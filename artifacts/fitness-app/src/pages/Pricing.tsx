import { useState, useEffect } from "react";
import { PageTransition } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import { Crown, CheckCircle2, Zap, Brain, Camera, UtensilsCrossed, Sparkles, Gift, ArrowLeft } from "lucide-react";
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

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [userCountry, setUserCountry] = useState<string>("");

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

  const isUSA = userCountry === "USA" || userCountry === "United States";
  const premiumPrice = isUSA ? "$5.99" : "₹199";
  const proPrice = isUSA ? "$9.99" : "₹349";

  const isPremium = subscription?.isPremium;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <header>
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Unlock your full potential with CaloForgeX Premium</p>
        </header>

        {isPremium && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/8 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-300">You have Premium access!</p>
              <p className="text-xs text-muted-foreground">
                Expires: {subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : "Never"}
                {subscription?.couponUsed ? ` · Coupon: ${subscription.couponUsed}` : ""}
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
              {[
                "Everything in Premium",
                "Priority AI responses",
                "Advanced analytics",
                "Early feature access",
              ].map(f => (
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
                onClick={() => setShowUpgrade(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </button>
            ) : (
              <div className="py-2.5 rounded-xl bg-white/5 text-sm text-center text-muted-foreground font-medium">
                Coming Soon
              </div>
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
                onClick={() => setShowUpgrade(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_16px_rgba(124,58,237,0.3)]"
              >
                Upgrade to Premium
              </button>
            ) : (
              <div className="py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-center text-green-400 font-semibold">
                Active Plan ✓
              </div>
            )}
          </div>
        </div>

        {/* Coupon section */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Have a coupon code?</p>
              <p className="text-xs text-muted-foreground">Redeem it for 7 days of free Premium access.</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shrink-0"
            >
              Redeem
            </button>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Payment gateway integration coming soon. Use coupon codes for free access in the meantime.
        </p>

        {showUpgrade && (
          <UpgradeModal
            trigger="general"
            usage={subscription?.usage}
            onClose={() => setShowUpgrade(false)}
            onSuccess={() => {
              fetch(`${BASE}/api/payments/subscription`, { credentials: "include" })
                .then(r => r.json()).then(setSubscription).catch(() => {});
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
