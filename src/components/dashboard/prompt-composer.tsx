'use client';

import { useState, useTransition } from 'react';
import { ArrowUpRight, Loader2, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PromptComposer() {
  const [prompt, setPrompt] = useState('Build a multi-tenant analytics SaaS with auth, dashboards, Stripe billing, audit logs, and deploy previews.');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function createProject() {
    startTransition(async () => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setMessage(`Project ${data.project.name} created. Pipeline simulation started at step ${data.project.currentStep + 1}.`);
    });
  }

  return (
    <div id="new-project" className="rounded-[2rem] border border-sky-300/20 bg-slate-950/70 p-5 shadow-glow backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">New Project</p>
          <h2 className="text-2xl font-black text-white">Describe your app</h2>
        </div>
        <WandSparkles className="h-6 w-6 text-sky-300" />
      </div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-36 w-full resize-none rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-100 outline-none ring-sky-400/30 transition placeholder:text-slate-500 focus:ring-4" placeholder="Describe your app" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">STACKFAST converts product intent into plans, code, tests, infrastructure, and telemetry.</p>
        <Button onClick={createProject} disabled={isPending || prompt.length < 12} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
          Generate App
        </Button>
      </div>
      {message ? <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p> : null}
    </div>
  );
}
