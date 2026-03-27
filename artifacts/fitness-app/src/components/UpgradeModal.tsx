import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Crown, CheckCircle2, Loader2, Gift, Brain, Camera, UtensilsCrossed, XCircle, CreditCard } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UsageInfo {
  aiChatsToday?: number;
  scansToday?: number;
  mealPlansThisWeek?: number;
}

interface Props {
  trigger?: "aiChat" | "scan" | "mealPlan" | "general";
  usage?: UsageInfo;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPlan?: "premium" | "pro";
}

const FEATURES = [
  { icon: Brain, label: "Unlimited AI Coach chats" },
  { icon: Camera, label: "Unlimited food scans" },
  { icon: UtensilsCrossed, label: "Unlimited meal plan generation" },
  { icon: Sparkles, label: "Advanced AI coaching insights" },
  { icon: Zap, label: "Priority feature access" },
];

const triggerMessages: Record<string, { title: string; desc: string }> = {
  aiChat: { title: "AI Chat Limit Reached", desc: "You've used your 2 free AI chats for today." },
  scan: { title: "Scan Limit Reached", desc: "You've used your 2 free food scans for today." },
  mealPlan: { title: "Meal Plan Limit Reached", desc: "You've used your 1 free meal plan for this week." },
  general: { title: "Unlock Full Access", desc: "Go unlimited with CaloForgeX Premium." },
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type PaymentStatus = "idle" | "loading" | "success" | "failed";

export default function UpgradeModal({ trigger = "general", usage, onClose, onSuccess, defaultPlan }: Props) {
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeTab, setActiveTab] = useState<"upgrade" | "coupon">("upgrade");
  const [userCountry, setUserCountry] = useState<string>("");
  const [payingPlan, setPayingPlan] = useState<"premium" | "pro" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [successPlan, setSuccessPlan] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/profile`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.country && setUserCountry(d.country))
      .catch(() => {});
    loadRazorpayScript();
  }, []);

  const isIndia = userCountry === "India";
  const premiumPrice = isIndia ? "₹199" : "$5.99";
  const proPrice = isIndia ? "₹349" : "$9.99";

  const msg = triggerMessages[trigger] || triggerMessages.general;

  const handleRazorpayPayment = async (plan: "premium" | "pro") => {
    setPayingPlan(plan);
    setPaymentStatus("loading");
    setPaymentMessage("");

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPaymentStatus("failed");
        setPaymentMessage("Failed to load payment gateway. Please check your connection and try again.");
        setPayingPlan(null);
        return;
      }

      const orderRes = await fetch(`${BASE}/api/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setPaymentStatus("failed");
        setPaymentMessage(orderData.error || "Failed to create payment order.");
        setPayingPlan(null);
        return;
      }

      setPaymentStatus("idle");

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CaloForgeX",
        description: `${orderData.planName} Plan — 1 Month`,
        image: "/logo.jpeg",
        order_id: orderData.orderId,
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setPaymentStatus("failed");
            setPaymentMessage("Payment was cancelled. You can try again anytime.");
            setPayingPlan(null);
          },
        },
        handler: async (response: any) => {
          setPaymentStatus("loading");
          setPaymentMessage("Verifying payment...");
          try {
            const verifyRes = await fetch(`${BASE}/api/payments/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPaymentStatus("success");
              setSuccessPlan(verifyData.planName);
              setPaymentMessage(verifyData.message || "Plan activated!");
              onSuccess?.();
            } else {
              setPaymentStatus("failed");
              setPaymentMessage(verifyData.error || "Payment verification failed. Contact support.");
            }
          } catch {
            setPaymentStatus("failed");
            setPaymentMessage("Network error during verification. Please contact support with your payment ID.");
          }
          setPayingPlan(null);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setPaymentStatus("failed");
        setPaymentMessage(response?.error?.description || "Payment failed. Please try a different payment method.");
        setPayingPlan(null);
      });
      rzp.open();
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Something went wrong. Please try again.");
      setPayingPlan(null);
    }
  };

  const redeemCoupon = async () => {
    if (!coupon.trim()) { setCouponError("Please enter a coupon code."); return; }
    setIsRedeeming(true); setCouponError(""); setCouponSuccess("");
    try {
      const res = await fetch(`${BASE}/api/payments/redeem-coupon`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: coupon.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || "Invalid coupon. Please try again."); }
      else {
        setCouponSuccess(data.message || "Premium activated for 7 days!");
        setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
      }
    } catch { setCouponError("Network error. Please check your connection."); }
    setIsRedeeming(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
        onClick={paymentStatus === "loading" ? undefined : onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0d0d14] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pt-4 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)]">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">{msg.title}</h3>
                <p className="text-xs text-muted-foreground">{msg.desc}</p>
              </div>
            </div>
            {paymentStatus !== "loading" && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors mt-0.5">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {usage && (
            <div className="px-5 pb-3 flex gap-2 flex-wrap">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {2 - (usage.aiChatsToday ?? 0)} AI chats left today
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                {2 - (usage.scansToday ?? 0)} scans left today
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300">
                {1 - (usage.mealPlansThisWeek ?? 0)} meal plan left this week
              </span>
            </div>
          )}

          {/* Payment status feedback */}
          <AnimatePresence>
            {paymentStatus === "success" && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/25 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="font-bold text-green-300 text-base">{successPlan} Activated!</p>
                <p className="text-sm text-green-300/70 mt-1">{paymentMessage}</p>
                <button onClick={onClose}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 font-semibold text-sm hover:bg-green-500/30 transition-colors">
                  Start using premium →
                </button>
              </motion.div>
            )}

            {paymentStatus === "failed" && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-300 text-sm">Payment Unsuccessful</p>
                    <p className="text-xs text-red-300/70 mt-0.5">{paymentMessage}</p>
                  </div>
                  <button onClick={() => setPaymentStatus("idle")} className="ml-auto p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>
              </motion.div>
            )}

            {paymentStatus === "loading" && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
                <p className="text-sm text-violet-300">{paymentMessage || "Opening payment..."}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {paymentStatus !== "success" && (
            <>
              <div className="px-5 pb-3">
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                  <button onClick={() => setActiveTab("upgrade")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "upgrade" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"}`}>
                    Upgrade Plan
                  </button>
                  <button onClick={() => setActiveTab("coupon")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === "coupon" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"}`}>
                    <Gift className="w-3.5 h-3.5" /> Coupon
                  </button>
                </div>
              </div>

              <div className="px-5 pb-6 space-y-4">
                {activeTab === "upgrade" && (
                  <>
                    <div className="space-y-2">
                      {FEATURES.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <span className="text-sm text-white/80">{label}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Non-India: show coming soon banner */}
                      {userCountry && !isIndia && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                          <span className="text-xl">🌍</span>
                          <div>
                            <p className="font-semibold text-amber-300 text-sm">International payments coming soon</p>
                            <p className="text-xs text-amber-300/70 mt-0.5">Razorpay payments are currently available for India only. Use a coupon code for free Premium access.</p>
                            <button onClick={() => setActiveTab("coupon")} className="mt-2 text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300">
                              Redeem a coupon →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Premium */}
                      <div className="relative p-4 rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-cyan-500/5">
                        <div className="absolute -top-2.5 left-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
                            Most Popular
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 mb-3">
                          <div>
                            <p className="font-bold text-white">Premium</p>
                            <p className="text-xs text-muted-foreground">All features unlocked · 30 days</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-black text-2xl text-white">{premiumPrice}</p>
                            <p className="text-[10px] text-muted-foreground">/ month</p>
                          </div>
                        </div>
                        {isIndia || !userCountry ? (
                          <button
                            onClick={() => handleRazorpayPayment("premium")}
                            disabled={paymentStatus === "loading"}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_16px_rgba(124,58,237,0.3)]"
                          >
                            {payingPlan === "premium" && paymentStatus === "loading" ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                            ) : (
                              <><CreditCard className="w-4 h-4" /> Pay {premiumPrice} with Razorpay</>
                            )}
                          </button>
                        ) : (
                          <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-sm text-center font-medium">
                            Coming soon for your region
                          </div>
                        )}
                      </div>

                      {/* Pro */}
                      <div className="p-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-blue-950/10">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-white">Pro</p>
                            <p className="text-xs text-muted-foreground">Best results + priority support · 30 days</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-black text-2xl text-white">{proPrice}</p>
                            <p className="text-[10px] text-muted-foreground">/ month</p>
                          </div>
                        </div>
                        {isIndia || !userCountry ? (
                          <button
                            onClick={() => handleRazorpayPayment("pro")}
                            disabled={paymentStatus === "loading"}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {payingPlan === "pro" && paymentStatus === "loading" ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                            ) : (
                              <><CreditCard className="w-4 h-4" /> Pay {proPrice} with Razorpay</>
                            )}
                          </button>
                        ) : (
                          <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-sm text-center font-medium">
                            Coming soon for your region
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/5">
                      <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-4 h-4 rounded" onError={e => (e.currentTarget.style.display = "none")} />
                      <p className="text-[11px] text-muted-foreground">Secured by Razorpay · UPI, Cards, Net Banking, Wallets</p>
                    </div>

                    <button onClick={() => setActiveTab("coupon")}
                      className="w-full py-2.5 rounded-xl border border-dashed border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" /> Have a coupon code?
                    </button>
                  </>
                )}

                {activeTab === "coupon" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 text-center">
                      <Gift className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                      <p className="font-semibold text-white">Redeem a Voucher</p>
                      <p className="text-xs text-muted-foreground mt-1">Enter your coupon code below for 7 days of free Premium access.</p>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); setCouponSuccess(""); }}
                        onKeyDown={e => e.key === "Enter" && redeemCoupon()}
                        placeholder="Enter coupon code (e.g. CFXFREE7)"
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm font-mono tracking-widest uppercase text-white placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal transition-colors"
                      />
                      {couponError && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 px-1">{couponError}</motion.p>
                      )}
                      {couponSuccess && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          <p className="text-sm text-green-400">{couponSuccess}</p>
                        </motion.div>
                      )}
                      <button
                        onClick={redeemCoupon}
                        disabled={isRedeeming || !coupon.trim() || !!couponSuccess}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                      >
                        {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                        {isRedeeming ? "Activating..." : "Activate Coupon"}
                      </button>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">Each coupon can only be used once, globally.</p>
                      <p className="text-xs text-muted-foreground">Your 7-day premium access starts immediately.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
