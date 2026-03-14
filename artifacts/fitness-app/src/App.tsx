import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetProfile } from "@workspace/api-client-react";
import { useEffect } from "react";
import { Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

// Components
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

// Pages
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import WorkoutBuilder from "@/pages/WorkoutBuilder";
import ActiveWorkout from "@/pages/ActiveWorkout";
import Library from "@/pages/Library";
import Progress from "@/pages/Progress";
import Diet from "@/pages/Diet";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

function LoginScreen() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Abstract mesh background using the generated image */}
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Background" className="w-full h-full object-cover opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 rounded-[2rem] max-w-md w-full relative z-10 border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.2)] text-center"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] mb-6">
          <Dumbbell className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-2">FitTrack<span className="text-primary">Pro</span></h1>
        <p className="text-muted-foreground mb-10 text-lg">Your elite fitness companion.</p>
        
        <button 
          onClick={login}
          className="w-full py-4 rounded-xl font-bold text-lg text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all backdrop-blur-md"
        >
          Connect Account
        </button>
      </motion.div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfile({
    query: { enabled: isAuthenticated }
  });

  useEffect(() => {
    if (isAuthenticated && !isProfileLoading && location !== "/onboarding") {
      // If profile endpoint returns 404 error, user needs to onboard
      if (profileError && (profileError as any)?.status === 404) {
        setLocation("/onboarding");
      }
    }
  }, [isAuthenticated, isProfileLoading, profileError, location, setLocation]);

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  
  if (location === "/onboarding") return <>{children}</>;

  return <Shell>{children}</Shell>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Dashboard} />
        <Route path="/workout" component={WorkoutBuilder} />
        <Route path="/workout/active/:id" component={ActiveWorkout} />
        <Route path="/library" component={Library} />
        <Route path="/progress" component={Progress} />
        <Route path="/diet" component={Diet} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
