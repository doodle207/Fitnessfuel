import { Link, useLocation } from "wouter";
import { Activity, Dumbbell, Grid, LineChart, Apple, User, LogOut } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/diet", label: "Diet", icon: Apple },
  { href: "/profile", label: "Profile", icon: User },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r border-white/5 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">FitTrack<span className="text-primary">Pro</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}
                `}>
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

        <div className="p-4 mt-auto">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-0 min-w-0 max-w-full overflow-x-hidden relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 z-50 px-2 py-3 pb-safe flex justify-around">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
              <div className={`
                flex flex-col items-center p-2 rounded-xl transition-colors
                ${isActive ? "text-primary" : "text-muted-foreground"}
              `}>
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeBottomTab"
                    className="absolute bottom-1 w-8 h-1 bg-primary rounded-t-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
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
