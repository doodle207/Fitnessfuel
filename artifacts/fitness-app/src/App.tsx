import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import React, { useEffect, useState } from "react";
import { Activity, Zap, TrendingUp, ChevronRight, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import WorkoutBuilder from "@/pages/WorkoutBuilder";
import ActiveWorkout from "@/pages/ActiveWorkout";
import Progress from "@/pages/Progress";
import Diet from "@/pages/Diet";
import Profile from "@/pages/Profile";
import AICoach from "@/pages/AICoach";
import Pricing from "@/pages/Pricing";
import FutureBodySimulator from "@/pages/FutureBodySimulator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
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

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-28 h-28 mx-auto rounded-3xl overflow-hidden mb-8 relative"
          style={{ boxShadow: "0 0 60px rgba(124,58,237,0.5), 0 0 100px rgba(6,182,212,0.2)" }}
        >
          <img src="/logo.jpeg" alt="CaloForgeX" className="w-full h-full object-cover" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-display font-black mb-3 tracking-tight"
        >
          Calo<span style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Forge</span><span className="text-cyan-400">X</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/50 text-lg mt-2 mb-8"
        >
          Your elite fitness & nutrition companion
        </motion.p>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: Activity, label: "Smart Tracking" },
            { icon: Zap, label: "AI Nutrition" },
            { icon: TrendingUp, label: "Progress PRs" },
          ].map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5"
            >
              <Icon className="w-5 h-5 text-violet-400" />
              <span className="text-xs text-white/60 text-center font-medium">{label}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-semibold text-lg text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2"
        >
          Get Started <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

function SignupScreen({ onBack }: { onBack: () => void }) {
  const { loginWithGoogle } = useAuth();
  const [authEmail, setAuthEmail] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/email/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ email: authEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code."); return; }
      setAuthStep("otp");
      setResendTimer(30);
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/email/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ email: authEmail.trim(), otp: authOtp.trim() }),
      });
      if (res.ok) { window.location.reload(); }
      else { const d = await res.json(); setError(d.error || "Invalid code."); }
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
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
            className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-6 relative"
            style={{ boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.2)" }}
          >
            <img src="/logo.jpeg" alt="CaloForgeX" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-5xl font-display font-black mb-2 tracking-tight">
            Calo<span style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Forge</span><span className="text-cyan-400">X</span>
          </h1>
          <p className="text-white/50 text-base mt-2">Create your account to get started</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {authStep === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-base text-[#1a1a2e] bg-white hover:bg-white/95 transition-all shadow-lg"
              >
                <GoogleIcon /> Sign up with Google
              </motion.button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleEmailOtp} className="space-y-3">
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Email address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={loading || !authEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {authStep === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <button
                type="button"
                onClick={() => { setAuthStep("email"); setError(null); setAuthOtp(""); }}
                className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-1 transition-colors"
              >
                ← {authEmail}
              </button>

              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
                <ShieldCheck className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="font-semibold text-white text-sm">Check your inbox</p>
                <p className="text-white/50 text-xs mt-1">
                  Enter the 6-digit code sent to <span className="text-violet-300 font-medium">{authEmail}</span>
                </p>
              </div>

              <form onSubmit={handleOtpVerify} className="space-y-3">
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={authOtp}
                    onChange={e => { setAuthOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="000000"
                    autoFocus
                    className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-2xl font-mono tracking-[0.5em] text-center focus:outline-none focus:border-violet-500/60 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={loading || authOtp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <><ShieldCheck className="w-4 h-4" /> Create Account</>}
                </motion.button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-white/30">Resend code in {resendTimer}s</p>
                  ) : (
                    <button type="button" onClick={handleEmailOtp} disabled={loading}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-white/25 mt-6">By continuing, you agree to our Terms &amp; Privacy Policy</p>
        <p className="text-center text-sm text-white/40 mt-4">
          Already have an account?{" "}
          <button onClick={onBack} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors underline underline-offset-2">
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}

type EmailStep = "email" | "otp" | "name";

function LoginScreen({ onCreateAccount }: { onCreateAccount: () => void }) {
  const { loginWithGoogle } = useAuth();

  const [step, setStep] = useState<EmailStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const urlError = new URLSearchParams(window.location.search).get("error");

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code."); return; }
      setIsNewUser(!!data.isNewUser);
      setStep("otp");
      setResendTimer(30);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), firstName: firstName.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || "Invalid code. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
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
            className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-6 relative"
            style={{ boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.2)" }}
          >
            <img src="/logo.jpeg" alt="CaloForgeX" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-5xl font-display font-black mb-2 tracking-tight">
            Calo<span style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Forge</span><span className="text-cyan-400">X</span>
          </h1>
          <p className="text-white/50 text-base mt-2">Your elite fitness & nutrition companion</p>
        </div>

        {(urlError || error) && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error && error}
            {!error && urlError === "google_auth_failed" && "Google sign-in failed. Please try again."}
            {!error && urlError === "auth_session_expired" && "Login session expired. Please try signing in again."}
            {!error && urlError === "auth_failed" && "Authentication failed. Please try again."}
            {!error && urlError && !["google_auth_failed","auth_session_expired","auth_failed"].includes(urlError) && "Sign-in error. Please try again."}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-base text-[#1a1a2e] bg-white hover:bg-white/95 transition-all shadow-lg"
              >
                <GoogleIcon />
                Continue with Google
              </motion.button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleEmailContinue} className="space-y-3">
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); setOtp(""); setDevOtp(null); }}
                className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-5 transition-colors"
              >
                ← {email}
              </button>

              <div className="mb-5 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
                <ShieldCheck className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="font-semibold text-white text-sm">
                  {isNewUser ? "Create your account" : "Welcome back!"}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Enter the 6-digit code sent to <span className="text-violet-300 font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-3">
                {isNewUser && (
                  <div>
                    <label className="block text-white font-semibold text-sm mb-2">Your first name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:border-violet-500/60 transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="000000"
                    autoFocus
                    className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-2xl font-mono tracking-[0.5em] text-center focus:outline-none focus:border-violet-500/60 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4" /> {isNewUser ? "Create Account" : "Sign In"}</>}
                </motion.button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-white/30">Resend code in {resendTimer}s</p>
                  ) : (
                    <button type="button" onClick={handleEmailContinue} disabled={loading}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-white/25 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
        <p className="text-center text-sm text-white/40 mt-4">
          Don't have an account?{" "}
          <button onClick={onCreateAccount} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors underline underline-offset-2">
            Create here
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("cfx_welcomed"));
  const [showSignup, setShowSignup] = useState(false);
  const [restoredRoute, setRestoredRoute] = useState(false);

  const { data: profile, isLoading: isProfileLoading, error: profileError, refetch: refetchProfile } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey(), enabled: isAuthenticated }
  });

  const needsOnboarding = isAuthenticated && !isProfileLoading && profileError && (profileError as any).status === 404;

  // Save last visited route to localStorage for restoration on next login
  useEffect(() => {
    if (isAuthenticated && !isProfileLoading && profile) {
      const skipRoutes = ["/onboarding", "/pricing"];
      if (!skipRoutes.includes(location) && location !== "/") {
        localStorage.setItem("cfx_last_route", location);
      }
    }
  }, [location, isAuthenticated, isProfileLoading, profile]);

  // Restore last route once after login
  useEffect(() => {
    if (isAuthenticated && !isProfileLoading && profile && !restoredRoute) {
      setRestoredRoute(true);
      const saved = localStorage.getItem("cfx_last_route");
      if (saved && saved !== "/" && saved !== location) {
        setLocation(saved);
      }
    }
  }, [isAuthenticated, isProfileLoading, profile, restoredRoute, location, setLocation]);

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

  if (!isAuthenticated) {
    if (showWelcome) {
      return <WelcomeScreen onContinue={() => { localStorage.setItem("cfx_welcomed", "1"); setShowWelcome(false); }} />;
    }
    if (showSignup) {
      return <SignupScreen onBack={() => setShowSignup(false)} />;
    }
    return <LoginScreen onCreateAccount={() => setShowSignup(true)} />;
  }

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
        <Route path="/ai-coach" component={AICoach} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/future-body" component={FutureBodySimulator} />
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
