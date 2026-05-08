import { Bell, Boxes, ChevronDown, CreditCard, Gauge, Layers3, LayoutDashboard, Rocket, Search, ServerCog, Settings, Sparkles, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const icons = [LayoutDashboard, Sparkles, Boxes, Layers3, Rocket, ServerCog, Gauge, Users, Settings, CreditCard];
const nav = ['Dashboard', 'New Project', 'Projects', 'Templates', 'Deployments', 'Environments', 'Usage', 'Team', 'Settings', 'Billing'];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-white/10 bg-slate-950/50 p-5 backdrop-blur-xl lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/40 bg-sky-400/15 shadow-glow">
            <Sparkles className="h-6 w-6 text-sky-300" />
          </div>
          <div>
            <p className="text-lg font-black tracking-[0.22em] text-white">STACKFAST</p>
            <p className="text-xs text-slate-400">AI app-builder ops</p>
          </div>
        </div>
        <nav className="space-y-2">
          {nav.map((item, index) => {
            const Icon = icons[index];
            return (
              <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className={cn('group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white', index === 0 && 'border border-sky-300/30 bg-sky-400/10 text-sky-100 shadow-glow')}>
                <Icon className="h-4 w-4" />
                {item}
              </a>
            );
          })}
        </nav>
        <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4 shadow-greenGlow">
          <Badge className="border-emerald-300/30 bg-emerald-400/15 text-emerald-200">Production Ready</Badge>
          <p className="mt-3 text-sm text-slate-300">Docker, Postgres schema, mock APIs, and deploy pipeline are included.</p>
        </div>
      </aside>
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 grid-glow opacity-70" />
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none ring-sky-400/40 transition placeholder:text-slate-500 focus:ring-4" placeholder="Search projects, deployments, logs, templates..." />
            </div>
            <Button variant="secondary" size="sm" className="hidden md:inline-flex">⌘ K</Button>
            <button aria-label="Notifications" className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 shadow-greenGlow" />
            </button>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
              <Avatar><AvatarFallback>MK</AvatarFallback></Avatar>
              <div className="hidden pr-2 md:block">
                <p className="text-sm font-semibold text-white">Marty Khan</p>
                <p className="text-xs text-slate-400">Founder workspace</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 md:block" />
            </div>
          </div>
        </header>
        <div className="relative z-10 px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
