import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetProfile } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { Dumbbell, Activity, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import WorkoutBuilder from "@/pages/WorkoutBuilder";
import ActiveWorkout from "@/pages/ActiveWorkout";
import Progress from "@/pages/Progress";
import Diet from "@/pages/Diet";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never retry 4xx client errors — a 404 means "no profile", not a transient failure
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d?.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const urlError = new URLSearchParams(window.location.search).get("error");

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[200px]" />
      </div>

      <div className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 relative"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.2)" }}
          >
            <Dumbbell className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-display font-black mb-2 tracking-tight">
            FitTrack<span style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pro</span>
          </h1>
          <p className="text-white/50 text-base mt-2">Your elite fitness & nutrition companion</p>
        </div>

        {urlError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {urlError === "google_auth_failed" && "Google sign-in failed. Please try again."}
            {urlError === "auth_session_expired" && "Login session expired. Please try signing in again."}
            {urlError === "auth_failed" && "Authentication failed. Please try again."}
            {!["google_auth_failed","auth_session_expired","auth_failed"].includes(urlError) && "Sign-in error. Please try again."}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Activity, label: "Smart Tracking" },
            { icon: Zap, label: "AI Nutrition" },
            { icon: TrendingUp, label: "Progress PRs" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5">
              <Icon className="w-5 h-5 text-violet-400" />
              <span className="text-xs text-white/60 text-center font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {googleEnabled && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-base text-[#1a1a2e] bg-white hover:bg-white/95 transition-all shadow-lg"
            >
              <GoogleIcon />
              Sign in with Google
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={login}
            className="w-full py-4 rounded-2xl font-semibold text-base text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            Sign in with Replit
          </motion.button>
        </div>

        <p className="text-center text-xs text-white/25 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
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

  // Check if user needs onboarding: authenticated, loaded, and got 404
  const needsOnboarding = isAuthenticated && !isProfileLoading && profileError && (profileError as any).status === 404;

  useEffect(() => {
    if (needsOnboarding && location !== "/onboarding") {
      setLocation("/onboarding");
    }
  }, [needsOnboarding, location, setLocation]);

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/10 border-b-cyan-500/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  // Block render until the redirect fires — prevents a flash of the dashboard
  if (needsOnboarding && location !== "/onboarding") return null;

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
