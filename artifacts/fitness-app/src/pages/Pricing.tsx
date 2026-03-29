import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/ui/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, CheckCircle2, Zap, Brain, Camera, UtensilsCrossed, Sparkles,
  Gift, ArrowLeft, CreditCard, ShieldCheck, Tag, Loader2, X, PartyPopper
} from "lucide-react";
import { useLocation } from "wouter";
import UpgradeModal from "@/components/UpgradeModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FREE_FEATURES = [
  "Unlimited food logging",
  "Unlimited calorie tracking",
  "2 AI Coach chats per day",
  "2 food scans per day",
  "1 meal plan per week",
  "Workout tracking",
  "Progress charts",
  "Period cycle tracking",
];

const PREMIUM_FEATURES = [
  { icon: Brain, label: "Unlimited AI Coach chats" },
  { icon: Camera, label: "Unlimited food scans" },
  { icon: UtensilsCrossed, label: "Unlimited meal plan generation" },
  { icon: Sparkles, label: "Advanced AI coaching insights" },
  { icon: Zap, label: "Personalized nutrition analysis" },
  { icon: Crown, label: "Priority feature access" },
];

function VoucherBox({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("");

  React.useEffect(() => {
    fetch(`${BASE}/api/voucher/code-hint`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.code && setHint(d.code))
      .catch(() => {});
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${BASE}/api/voucher/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setExpiry(data.expiryDate ? new Date(data.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);
        setCode("");
        setTimeout(onSuccess, 1500);
      } else {
        setError(data.error || "Failed to redeem voucher.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-purple-950/10 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Have a voucher code?</p>
            <p className="text-xs text-muted-foreground">Redeem it for 1 week of free Pro access</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                <PartyPopper className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-green-300 text-base">{success}</p>
                {expiry && <p className="text-xs text-muted-foreground mt-1">Pro access until {expiry}</p>}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleRedeem}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
                  placeholder="Enter voucher code"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 uppercase tracking-widest"
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <X className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5 px-5 py-3 bg-violet-950/20">
        <p className="text-[11px] text-muted-foreground text-center">
          {hint ? (
            <>Use code <span className="font-bold text-violet-300 tracking-widest">{hint}</span> for 1 week of free Pro access</>
          ) : (
            "Enter your coupon code for 1 week of free Pro access"
          )}
        </p>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "pro">("premium");
  const [subscription, setSubscription] = useState<any>(null);
  const [userCountry, setUserCountry] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/payments/subscription`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSubscription(d))
      .catch(() => {});
    fetch(`${BASE}/api/profile`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.country && setUserCountry(d.country))
      .catch(() => {});
  }, []);

  const isIndia = userCountry === "India";
  const premiumPrice = isIndia ? "₹199" : "$5.99";
  const proPrice = isIndia ? "₹349" : "$9.99";
  const isPremium = subscription?.isPremium;

  const openPayment = (plan: "premium" | "pro") => {
    setSelectedPlan(plan);
    setShowUpgrade(true);
  };

  const refreshSubscription = () => {
    fetch(`${BASE}/api/payments/subscription`, { credentials: "include" })
      .then(r => r.json()).then(setSubscription).catch(() => {});
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <header>
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">Unlock your full potential with CaloForgeX Premium</p>
        </header>

        {paymentSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/8 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-300">Payment successful! 🎉</p>
              <p className="text-xs text-muted-foreground">Your plan is now active. Enjoy unlimited access!</p>
            </div>
          </motion.div>
        )}

        {isPremium && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/8 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-300">You have Premium access! 🎉</p>
              <p className="text-xs text-muted-foreground">
                Expires: {subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                {subscription?.couponUsed ? ` · Voucher: ${subscription.couponUsed}` : ""}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Free Plan */}
          <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-display font-black text-white">₹0</span>
                <span className="text-muted-foreground text-sm mb-1">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground">Always free. No card needed.</p>
            </div>
            <div className="space-y-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
            {!isPremium && (
              <div className="py-2.5 rounded-xl bg-white/5 text-sm text-center text-muted-foreground font-medium">
                Current Plan
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className="glass-card rounded-3xl p-5 border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 to-blue-950/15 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-display font-black text-white">{proPrice}</span>
                <span className="text-muted-foreground text-sm mb-1">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground">Best results + priority support.</p>
            </div>
            <div className="space-y-2">
              {["Everything in Premium", "Priority AI responses", "Advanced analytics", "Early feature access"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/15 flex items-center justify-center shrink-0">
                    <Crown className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-white/85">{f}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
            {!isPremium ? (
              <button
                onClick={() => openPayment("pro")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Upgrade to Pro
              </button>
            ) : (
              <div className="py-2.5 rounded-xl bg-white/5 text-sm text-center text-muted-foreground font-medium">Coming Soon</div>
            )}
          </div>

          {/* Premium Plan */}
          <div className="relative glass-card rounded-3xl p-5 border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-purple-950/20 space-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]">
                Most Popular
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">Premium</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-display font-black text-white">{premiumPrice}</span>
                <span className="text-muted-foreground text-sm mb-1">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground">Unlimited everything.</p>
            </div>
            <div className="space-y-2">
              {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-sm text-white/85">{label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
            {!isPremium ? (
              <button
                onClick={() => openPayment("premium")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_16px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Upgrade to Premium
              </button>
            ) : (
              <div className="py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-center text-green-400 font-semibold">
                Active Plan ✓
              </div>
            )}
          </div>
        </div>

        {/* Voucher section */}
        {!isPremium && (
          <VoucherBox onSuccess={refreshSubscription} />
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          {isIndia
            ? <span>Secured by Razorpay · UPI, Cards, Net Banking &amp; Wallets accepted</span>
            : <span>Secured by Razorpay · International Cards accepted (Visa, Mastercard, Amex)</span>
          }
        </div>

        {showUpgrade && (
          <UpgradeModal
            trigger="general"
            defaultPlan={selectedPlan}
            usage={subscription?.usage}
            onClose={() => setShowUpgrade(false)}
            onSuccess={() => { refreshSubscription(); setPaymentSuccess(true); }}
          />
        )}
      </div>
    </PageTransition>
  );
}
