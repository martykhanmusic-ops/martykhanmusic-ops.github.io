'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, CircleDotDashed, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { workflowCards } from '@/lib/demo-data';
import type { PipelineStep } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusIcon = {
  complete: CheckCircle2,
  running: Loader2,
  pending: CircleDotDashed,
  failed: XCircle
};

export function WorkflowDiagram({ steps }: { steps: PipelineStep[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="border-purple-300/30 bg-purple-500/10 text-purple-200">Pipeline Orchestration</Badge>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Request → Planning → Code → Deploy → Monitor</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A glowing backend workflow maps every build artifact and operational handoff, with animated arrows showing the live pipeline path.</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 shadow-greenGlow">Scaling: 3 regions · 12 pods · 99.99%</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {workflowCards.map((card, index) => {
          const step = steps[index];
          const Icon = statusIcon[step.status];
          return (
            <motion.div key={card.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative">
              <div className={cn('group h-full rounded-3xl border bg-slate-900/75 p-4 transition', card.accent === 'green' && 'border-emerald-300/25 shadow-greenGlow', card.accent === 'purple' && 'border-purple-300/25 shadow-purpleGlow', card.accent === 'blue' && 'border-sky-300/25 shadow-glow', step.status === 'running' && 'ring-2 ring-sky-300/50')}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sm font-black text-white">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className={cn('h-5 w-5', step.status === 'complete' && 'text-emerald-300', step.status === 'running' && 'animate-spin text-sky-300', step.status === 'pending' && 'text-slate-500')} />
                </div>
                <h3 className="text-base font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
                <Badge className="mt-4 capitalize">{step.status}</Badge>
              </div>
              {index < workflowCards.length - 1 ? <div className="absolute -right-4 top-1/2 z-10 hidden h-0.5 w-8 origin-left animate-pulseLine bg-gradient-to-r from-sky-300 to-emerald-300 xl:block" /> : null}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-5 rounded-3xl border border-purple-300/20 bg-purple-500/10 p-4 text-sm text-purple-100 shadow-purpleGlow">Observe & Improve feeds usage data, logs, cost anomalies, user feedback, and security posture back into the planner for the next iteration.</div>
    </section>
  );
}
