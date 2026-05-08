import type React from 'react';
import { Activity, Bug, Database, Gauge, GitBranch, LockKeyhole, MessageSquareText, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { demoPipeline, demoProjects, stackItems } from '@/lib/demo-data';
import { formatNumber } from '@/lib/utils';

export function MetricCards() {
  const metrics = [
    { label: 'Projects built', value: formatNumber(128), icon: GitBranch, tone: 'text-sky-300' },
    { label: 'Deploy success', value: '98.7%', icon: RocketIcon, tone: 'text-emerald-300' },
    { label: 'Avg. build time', value: '6m 14s', icon: Zap, tone: 'text-purple-300' },
    { label: 'Monthly tokens', value: '8.4M', icon: Activity, tone: 'text-cyan-300' }
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label} className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-white">{value}</p>
            </div>
            <Icon className={`h-6 w-6 ${tone}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function RocketIcon(props: React.ComponentProps<typeof Zap>) {
  return <Zap {...props} />;
}

export function OperationsGrid() {
  const running = demoPipeline.filter((step) => step.status !== 'pending').length;
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr_0.9fr]">
      <Card id="deployments">
        <CardHeader>
          <CardTitle>Pipeline status tracker</CardTitle>
          <p className="text-sm text-slate-400">Fake/demo backend job progress streamed from mock API routes.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={(running / demoPipeline.length) * 100} />
          {demoPipeline.slice(0, 8).map((step) => (
            <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <span className={`h-2.5 w-2.5 rounded-full ${step.status === 'complete' ? 'bg-emerald-400' : step.status === 'running' ? 'bg-sky-400' : 'bg-slate-600'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{step.title}</p>
                <p className="truncate text-xs text-slate-500">{step.logs.at(-1)}</p>
              </div>
              <span className="text-xs capitalize text-slate-400">{step.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card id="templates">
        <CardHeader><CardTitle>Technology stack</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stackItems.map((item) => <div key={item} className="rounded-2xl border border-sky-300/15 bg-sky-400/10 p-3 text-sm text-sky-100">{item}</div>)}
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"><Database className="mb-2 h-5 w-5" />Supabase/PostgreSQL schema is ready for projects and pipeline steps.</div>
        </CardContent>
      </Card>
      <Card id="usage">
        <CardHeader><CardTitle>Logs & monitoring</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {['Build queue latency 112ms', 'Tests passed 42/42', 'Docker layer cache hit 87%', 'Canary health checks green', 'Error budget remains 99.6%'].map((log) => (
            <div key={log} className="rounded-2xl bg-black/30 p-3 font-mono text-xs text-emerald-200">$ {log}</div>
          ))}
          <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 p-3 text-sm text-purple-100"><Gauge className="mb-2 h-5 w-5" />Live telemetry loop: requests, spend, errors, and feedback.</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkspaceSections() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <Card id="projects"><CardHeader><CardTitle>Projects</CardTitle></CardHeader><CardContent className="space-y-3">{demoProjects.map((project) => <div key={project.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="font-semibold text-white">{project.name}</p><p className="text-xs capitalize text-slate-400">{project.status} · step {project.currentStep + 1}/10</p></div>)}</CardContent></Card>
      <Card id="environments"><CardHeader><CardTitle>Environments</CardTitle></CardHeader><CardContent className="space-y-3">{['Production', 'Preview', 'Staging'].map((env) => <div key={env} className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-3 text-sm"><span>{env}</span><span className="text-emerald-300">Healthy</span></div>)}</CardContent></Card>
      <Card id="team"><CardHeader><CardTitle>User feedback</CardTitle></CardHeader><CardContent><MessageSquareText className="mb-3 h-6 w-6 text-purple-300" /><p className="text-sm leading-6 text-slate-300">“Add admin impersonation, exportable reports, and usage-based billing before the next deploy.”</p></CardContent></Card>
      <Card id="settings"><CardHeader><CardTitle>Security & privacy</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-300"><p className="flex gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /> SOC2-ready audit trails</p><p className="flex gap-2"><LockKeyhole className="h-5 w-5 text-sky-300" /> Secrets isolated per environment</p><p className="flex gap-2"><Bug className="h-5 w-5 text-purple-300" /> Vulnerability checks in CI</p></CardContent></Card>
      <Card id="billing" className="lg:col-span-2 xl:col-span-4"><CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-white">Billing</p><p className="text-sm text-slate-400">Pro plan · $289 projected this month · autoscaling spend guard enabled.</p></div><div className="text-sm text-emerald-300">Privacy footer: encrypted prompts, private repos, regional data controls, no training by default.</div></CardContent></Card>
    </div>
  );
}
