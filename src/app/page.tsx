import { AppShell } from '@/components/dashboard/app-shell';
import { MetricCards, OperationsGrid, WorkspaceSections } from '@/components/dashboard/status-panels';
import { PromptComposer } from '@/components/dashboard/prompt-composer';
import { WorkflowDiagram } from '@/components/dashboard/workflow-diagram';
import { Badge } from '@/components/ui/badge';
import { demoPipeline } from '@/lib/demo-data';

export default function Home() {
  return (
    <AppShell>
      <div id="dashboard" className="space-y-6">
        <section className="grid gap-5 xl:grid-cols-[1fr_430px]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
            <Badge className="border-sky-300/30 bg-sky-400/10 text-sky-200">AI Full-Stack Builder</Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">Ship production apps from a sentence.</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">STACKFAST is a sleek command center for describing, generating, testing, packaging, deploying, and monitoring full-stack applications with an AI backend pipeline.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              {['Request traceability', 'AI planning', 'Code generation', 'Validation gates', 'Docker packaging', 'Live observability'].map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{item}</span>)}
            </div>
          </div>
          <PromptComposer />
        </section>
        <MetricCards />
        <WorkflowDiagram steps={demoPipeline} />
        <OperationsGrid />
        <WorkspaceSections />
      </div>
    </AppShell>
  );
}
