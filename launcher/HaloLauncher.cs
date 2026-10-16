using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Text;

internal static class HaloLauncher
{
    private const string Url = "http://localhost:4173/halo/";
    private static readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.Ordinal);

    private static int Main(string[] args)
    {
        try
        {
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
            listener.Prefixes.Add("http://localhost:4173/");
            listener.Start();
            Console.WriteLine("Halo is running at " + Url);
            Console.WriteLine("Keep this window open. Press Ctrl+C to stop Halo.");
            if (args.Length == 0 || args[0] != "--no-browser")
                Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true });
            while (true) Handle(listener.GetContext());
        }
        catch (HttpListenerException error)
        {
            Console.Error.WriteLine("Halo could not open localhost:4173. Close the other server using that address and try again. " + error.Message);
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
            if (host != "localhost:4173" || !IPAddress.IsLoopback(context.Request.RemoteEndPoint.Address))
            {
                response.StatusCode = 403;
                return;
            }
            if (context.Request.HttpMethod != "GET" && context.Request.HttpMethod != "HEAD")
            {
                response.StatusCode = 405;
                return;
            }
            string path = context.Request.Url.AbsolutePath;
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
