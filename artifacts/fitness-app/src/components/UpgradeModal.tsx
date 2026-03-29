import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Crown, CheckCircle2, Loader2, Gift, Brain, Camera, UtensilsCrossed, XCircle, CreditCard, Share2, Copy, CheckCheck, Users, Star } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"upgrade" | "coupon" | "refer">("upgrade");
  const [userCountry, setUserCountry] = useState<string>("");
  const [payingPlan, setPayingPlan] = useState<"premium" | "pro" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [successPlan, setSuccessPlan] = useState("");
  const [referralInfo, setReferralInfo] = useState<{ referralLink: string; referralCode: string; stats: any } | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/profile`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.country && setUserCountry(d.country))
      .catch(() => {});
    loadRazorpayScript();
  }, []);

  const loadReferralInfo = useCallback(() => {
    if (referralInfo || referralLoading) return;
    setReferralLoading(true);
    fetch(`${BASE}/api/referral/info`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setReferralInfo(d))
      .catch(() => {})
      .finally(() => setReferralLoading(false));
  }, [referralInfo, referralLoading]);

  const copyReferralLink = useCallback(() => {
    if (!referralInfo?.referralLink) return;
    navigator.clipboard.writeText(referralInfo.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralInfo?.referralLink]);

  const shareWhatsApp = useCallback(() => {
    if (!referralInfo?.referralLink) return;
    const text = encodeURIComponent(`Join me on CaloForgeX — AI-powered fitness & nutrition! Sign up with my link: ${referralInfo.referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [referralInfo?.referralLink]);

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
        body: JSON.stringify({ plan, currency: isIndia ? "INR" : "USD" }),
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
                    Upgrade
                  </button>
                  <button onClick={() => setActiveTab("coupon")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${activeTab === "coupon" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"}`}>
                    <Gift className="w-3.5 h-3.5" /> Coupon
                  </button>
                  <button onClick={() => { setActiveTab("refer"); loadReferralInfo(); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${activeTab === "refer" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"}`}>
                    <Share2 className="w-3.5 h-3.5" /> Refer
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
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/5">
                      <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-4 h-4 rounded" onError={e => (e.currentTarget.style.display = "none")} />
                      {isIndia ? (
                        <p className="text-[11px] text-muted-foreground">Secured by Razorpay · UPI, Cards, Net Banking, Wallets</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Secured by Razorpay · International Cards (Visa, Mastercard, Amex)</p>
                      )}
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

                {activeTab === "refer" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border border-cyan-500/20 text-center">
                      <Share2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <p className="font-semibold text-white">Invite Friends, Earn Free Pro</p>
                      <p className="text-xs text-muted-foreground mt-1">Every 5 friends = 1 free month. Friend buys Pro = +1 free month for you.</p>
                    </div>

                    {referralLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    ) : referralInfo ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/70 font-mono truncate select-all">
                            {referralInfo.referralLink}
                          </div>
                          <button
                            onClick={copyReferralLink}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                              copied ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                            }`}
                          >
                            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/4 rounded-xl py-2.5 px-1">
                            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                            <p className="text-base font-bold text-white">{referralInfo.stats.totalReferrals}</p>
                            <p className="text-[10px] text-muted-foreground">Invited</p>
                          </div>
                          <div className="bg-white/4 rounded-xl py-2.5 px-1">
                            <CheckCheck className="w-4 h-4 text-green-400 mx-auto mb-1" />
                            <p className="text-base font-bold text-white">{referralInfo.stats.validReferrals}</p>
                            <p className="text-[10px] text-muted-foreground">Verified</p>
                          </div>
                          <div className="bg-white/4 rounded-xl py-2.5 px-1">
                            <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                            <p className="text-base font-bold text-white">{referralInfo.stats.totalMonthsEarned}</p>
                            <p className="text-[10px] text-muted-foreground">Months earned</p>
                          </div>
                        </div>

                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round((referralInfo.stats.progressToNextMilestone / 5) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground">
                          {referralInfo.stats.nextMilestoneIn > 0
                            ? `${referralInfo.stats.nextMilestoneIn} more verified referral${referralInfo.stats.nextMilestoneIn !== 1 ? "s" : ""} → 1 month free`
                            : "🎉 You've earned a free month reward!"}
                        </p>

                        <button
                          onClick={shareWhatsApp}
                          className="w-full py-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#25D366]/25 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.062.524 4.004 1.447 5.7L0 24l6.436-1.417A11.958 11.958 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm.002 21.805c-1.791 0-3.534-.482-5.065-1.39l-.364-.215-3.77.83.879-3.67-.236-.374A9.772 9.772 0 0 1 2.23 12c0-5.395 4.377-9.772 9.772-9.772 5.394 0 9.77 4.377 9.77 9.772 0 5.394-4.376 9.805-9.77 9.805z" />
                          </svg>
                          Share on WhatsApp
                        </button>
                      </>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">Could not load referral info. Please try again.</p>
                    )}

                    <div className="border-t border-white/5 pt-3 space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-yellow-400" /><span>5 verified referrals → 1 month free Pro</span></div>
                      <div className="flex items-center gap-2"><Crown className="w-3 h-3 text-violet-400" /><span>Friend buys Pro → +1 month free for you</span></div>
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
