import { Link, useLocation } from "wouter";
import { Activity, Dumbbell, LineChart, Apple, Brain, User, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useLanguage();

  const mobileNavItems = [
    { href: "/", label: t.nav_dashboard, icon: Activity },
    { href: "/workout", label: t.nav_workout, icon: Dumbbell },
    { href: "/diet", label: t.nav_diet, icon: Apple },
    { href: "/progress", label: t.nav_progress, icon: LineChart },
    { href: "/ai-coach", label: t.nav_ai_coach, icon: Brain },
  ];

  const allDesktopNavItems = [
    { href: "/", label: t.nav_dashboard, icon: Activity },
    { href: "/workout", label: t.nav_workout, icon: Dumbbell },
    { href: "/progress", label: t.nav_progress, icon: LineChart },
    { href: "/diet", label: t.nav_diet, icon: Apple },
    { href: "/ai-coach", label: t.nav_ai_coach, icon: Brain },
    { href: "/pricing", label: t.nav_premium, icon: Crown },
    { href: "/profile", label: t.nav_profile, icon: User },
  ];

  return (
    <div className="h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r border-white/5 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.jpeg" alt="CaloForgeX" className="w-10 h-10 rounded-xl object-cover shadow-[0_0_15px_rgba(124,58,237,0.4)]" />
          <span className="font-display font-bold text-xl tracking-tight">Calo<span className="text-primary">Forge</span><span className="text-cyan-400">X</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {allDesktopNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative
                  ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}
                `}>
                  {item.href === "/ai-coach" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full">AI</span>
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto overscroll-y-contain pb-24 md:pb-0 min-w-0 max-w-full overflow-x-hidden relative" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 z-50 px-1 py-2 pb-safe flex justify-around">
        {mobileNavItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
              <div className={`
                flex flex-col items-center p-1.5 rounded-xl transition-colors relative
                ${isActive ? "text-primary" : "text-muted-foreground"}
              `}>
                {item.href === "/ai-coach" && !isActive && (
                  <span className="absolute -top-0.5 right-1 w-2 h-2 bg-violet-500 rounded-full" />
                )}
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute bottom-0 w-6 h-0.5 bg-primary rounded-t-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
