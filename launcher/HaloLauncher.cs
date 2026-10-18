using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

internal static class HaloLauncher
{
    private static readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.Ordinal);
    private static readonly Regex VoiceId = new Regex("^/voicebox/(history|audio)/[a-f0-9-]{36}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly object MusicLock = new object();
    private static DateTime LastMusicRequest = DateTime.MinValue;

    private static int Main(string[] args)
    {
        try
        {
            int port = Array.IndexOf(args, "--port=4174") >= 0 ? 4174 : 4173;
            string url = "http://localhost:" + port + "/halo/";
            using (Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream("HaloSite"))
            using (ZipArchive archive = new ZipArchive(resource, ZipArchiveMode.Read))
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    if (entry.FullName.EndsWith("/", StringComparison.Ordinal)) continue;
                    using (Stream input = entry.Open())
                    using (MemoryStream output = new MemoryStream())
                    {
                        input.CopyTo(output);
                        Files.Add("/" + entry.FullName, output.ToArray());
                    }
                }
            }
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:" + port + "/");
            listener.Start();
            Console.WriteLine("Halo is running at " + url);
            Console.WriteLine("Keep this window open. Press Ctrl+C to stop Halo.");
            if (Array.IndexOf(args, "--no-browser") < 0)
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            while (true) Handle(listener.GetContext());
        }
        catch (HttpListenerException error)
        {
            Console.Error.WriteLine("Halo could not open its local port. Close the other server using that address and try again. " + error.Message);
            return 1;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Halo could not start: " + error.Message);
            return 1;
        }
    }

    private static void Handle(HttpListenerContext context)
    {
        HttpListenerResponse response = context.Response;
        try
        {
            string host = context.Request.Headers["Host"] ?? "";
            if (host != "localhost:" + context.Request.LocalEndPoint.Port || !IPAddress.IsLoopback(context.Request.RemoteEndPoint.Address))
            {
                response.StatusCode = 403;
                return;
            }
            string path = context.Request.Url.AbsolutePath;
            if (path.StartsWith("/voicebox/", StringComparison.Ordinal))
            {
                ProxyVoicebox(context, path);
                return;
            }
            if (path.StartsWith("/local-llm/", StringComparison.Ordinal))
            {
                ProxyLocalLlm(context, path);
                return;
            }
            if (path.StartsWith("/public-data/", StringComparison.Ordinal))
            {
                SearchMusic(context, path);
                return;
            }
            if (context.Request.HttpMethod != "GET" && context.Request.HttpMethod != "HEAD")
            {
                response.StatusCode = 405;
                return;
            }
            if (path == "/") path = "/index.html";
            if (path == "/halo" || path == "/halo/") path = "/halo/index.html";
            byte[] body;
            if (!Files.TryGetValue(path, out body))
            {
                response.StatusCode = 404;
                return;
            }
            response.ContentType = ContentType(path);
            response.ContentLength64 = body.Length;
            response.Headers["X-Content-Type-Options"] = "nosniff";
            response.Headers["Cache-Control"] = "no-store";
            if (context.Request.HttpMethod == "GET") response.OutputStream.Write(body, 0, body.Length);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Request failed: " + error.Message);
        }
        finally { response.Close(); }
    }

    private static void ProxyVoicebox(HttpListenerContext context, string path)
    {
        string method = context.Request.HttpMethod;
        bool allowed = (method == "GET" && (path == "/voicebox/health" || VoiceId.IsMatch(path)))
            || (method == "POST" && (path == "/voicebox/transcribe" || path == "/voicebox/speak"));
        if (!allowed) { context.Response.StatusCode = 404; return; }
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:17493" + path.Substring(9));
        request.Method = method;
        request.Timeout = 600000;
        request.ReadWriteTimeout = 600000;
        request.Proxy = null;
        if (method == "POST")
        {
            if (context.Request.ContentLength64 < 0 || context.Request.ContentLength64 > 12000000)
            { context.Response.StatusCode = 413; return; }
            request.ContentType = context.Request.ContentType;
            request.ContentLength = context.Request.ContentLength64;
            using (Stream input = context.Request.InputStream)
            using (Stream output = request.GetRequestStream()) input.CopyTo(output);
        }
        try
        {
            using (HttpWebResponse upstream = (HttpWebResponse)request.GetResponse()) CopyVoiceResponse(upstream, context.Response);
        }
        catch (WebException error)
        {
            HttpWebResponse upstream = error.Response as HttpWebResponse;
            if (upstream != null) using (upstream) CopyVoiceResponse(upstream, context.Response);
            else
            {
                context.Response.StatusCode = 503;
                byte[] body = Encoding.UTF8.GetBytes("Local Voicebox is unavailable.");
                context.Response.ContentType = "text/plain; charset=utf-8";
                context.Response.OutputStream.Write(body, 0, body.Length);
            }
        }
    }

    private static void ProxyLocalLlm(HttpListenerContext context, string path)
    {
        string method = context.Request.HttpMethod;
        if (!((method == "GET" && path == "/local-llm/models") || (method == "POST" && (path == "/local-llm/draft" || path == "/local-llm/chat"))))
        { context.Response.StatusCode = 404; return; }
        string origin = context.Request.Headers["Origin"] ?? "";
        if (method == "POST" && origin != "http://localhost:" + context.Request.LocalEndPoint.Port)
        { context.Response.StatusCode = 403; return; }
        if (method == "POST" && (context.Request.ContentLength64 < 1 || context.Request.ContentLength64 > 12000 || !(context.Request.ContentType ?? "").StartsWith("application/json", StringComparison.OrdinalIgnoreCase)))
        { context.Response.StatusCode = 413; return; }
        string upstreamPath = method == "GET" ? "/api/tags" : "/api/chat";
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:11434" + upstreamPath);
        request.Method = method;
        request.Timeout = 120000;
        request.ReadWriteTimeout = 120000;
        request.Proxy = null;
        try
        {
            if (method == "POST")
            {
                request.ContentType = "application/json";
                request.ContentLength = context.Request.ContentLength64;
                using (Stream input = context.Request.InputStream)
                using (Stream output = request.GetRequestStream()) input.CopyTo(output);
            }
            using (HttpWebResponse upstream = (HttpWebResponse)request.GetResponse())
            {
                if (path == "/local-llm/chat") CopyStreamingResponse(upstream, context.Response);
                else CopyVoiceResponse(upstream, context.Response);
            }
        }
        catch (WebException error)
        {
            HttpWebResponse upstream = error.Response as HttpWebResponse;
            if (upstream != null) using (upstream) CopyVoiceResponse(upstream, context.Response);
            else
            {
                context.Response.StatusCode = 503;
                byte[] body = Encoding.UTF8.GetBytes("Local LLM service is unavailable.");
                context.Response.ContentType = "text/plain; charset=utf-8";
                context.Response.OutputStream.Write(body, 0, body.Length);
            }
        }
    }

    private static void CopyVoiceResponse(HttpWebResponse upstream, HttpListenerResponse downstream)
    {
        downstream.StatusCode = (int)upstream.StatusCode;
        downstream.ContentType = upstream.ContentType;
        downstream.Headers["Cache-Control"] = "no-store";
        downstream.Headers["X-Content-Type-Options"] = "nosniff";
        using (Stream input = upstream.GetResponseStream()) input.CopyTo(downstream.OutputStream);
    }

    private static void CopyStreamingResponse(HttpWebResponse upstream, HttpListenerResponse downstream)
    {
        downstream.StatusCode = (int)upstream.StatusCode;
        downstream.ContentType = upstream.ContentType;
        downstream.SendChunked = true;
        downstream.Headers["Cache-Control"] = "no-store";
        downstream.Headers["X-Content-Type-Options"] = "nosniff";
        byte[] buffer = new byte[2048];
        using (Stream input = upstream.GetResponseStream())
        {
            int read;
            while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
            {
                downstream.OutputStream.Write(buffer, 0, read);
                downstream.OutputStream.Flush();
            }
        }
    }

    private static void SearchMusic(HttpListenerContext context, string path)
    {
        HttpListenerResponse response = context.Response;
        string resource = path == "/public-data/artists" ? "artist" : path == "/public-data/recordings" ? "recording" : path == "/public-data/releases" ? "release-group" : null;
        if (resource == null || context.Request.HttpMethod != "GET") { response.StatusCode = 404; return; }
        string origin = context.Request.Headers["Origin"] ?? "";
        if (origin.Length > 0 && origin != "http://localhost:" + context.Request.LocalEndPoint.Port) { response.StatusCode = 403; return; }
        string name = (context.Request.QueryString["name"] ?? "").Trim();
        if (name.Length < 2 || name.Length > 80 || name.IndexOfAny(new[] { '\r', '\n', '\0' }) >= 0)
        { response.StatusCode = 400; return; }
        lock (MusicLock)
        {
            if ((DateTime.UtcNow - LastMusicRequest).TotalMilliseconds < 1200) { response.StatusCode = 429; return; }
            LastMusicRequest = DateTime.UtcNow;
        }
        string target = "https://musicbrainz.org/ws/2/" + resource + "/?query=" + Uri.EscapeDataString(name) + "&fmt=json&limit=8";
        string curl = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "curl.exe");
        if (!File.Exists(curl)) { response.StatusCode = 503; return; }
        try
        {
            ProcessStartInfo start = new ProcessStartInfo(curl);
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.RedirectStandardOutput = true;
            start.Arguments = "--silent --fail --max-time 10 --max-filesize 100000 --proto =https --user-agent \"HaloMusicReference/1.0 (https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io)\" --url \"" + target + "\"";
            using (Process process = Process.Start(start))
            using (MemoryStream output = new MemoryStream())
            {
                byte[] buffer = new byte[8192]; int read;
                while ((read = process.StandardOutput.BaseStream.Read(buffer, 0, buffer.Length)) > 0)
                {
                    if (output.Length + read > 100000) { process.Kill(); response.StatusCode = 502; return; }
                    output.Write(buffer, 0, read);
                }
                if (!process.WaitForExit(12000)) { process.Kill(); response.StatusCode = 503; return; }
                if (process.ExitCode != 0) { response.StatusCode = 503; return; }
                byte[] data = output.ToArray();
                response.StatusCode = 200;
                response.ContentType = "application/json; charset=utf-8";
                response.Headers["Cache-Control"] = "no-store";
                response.Headers["X-Content-Type-Options"] = "nosniff";
                response.ContentLength64 = data.Length;
                response.OutputStream.Write(data, 0, data.Length);
            }
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Music reference unavailable: " + error.Message);
            response.StatusCode = 503;
        }
    }

    private static string ContentType(string path)
    {
        string extension = Path.GetExtension(path).ToLowerInvariant();
        switch (extension)
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": case ".mjs": return "text/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".svg": return "image/svg+xml";
            case ".png": return "image/png";
            case ".jpg": case ".jpeg": return "image/jpeg";
            case ".webp": return "image/webp";
            case ".woff2": return "font/woff2";
            default: return "application/octet-stream";
        }
    }
}
