import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Copy, CheckCheck, Share2, Users, Trophy, Star,
  Clock, ChevronRight, Zap, Crown, RefreshCw, ExternalLink,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReferralStats {
  totalReferrals: number;
  validReferrals: number;
  pendingReferrals: number;
  totalMonthsEarned: number;
  nextMilestoneIn: number;
  progressToNextMilestone: number;
}

interface ReferralEntry {
  id: number;
  status: "pending" | "valid" | "rejected";
  created_at: string;
  validated_at: string | null;
  first_name: string | null;
  email: string | null;
}

interface RewardEntry {
  type: string;
  months_added: number;
  note: string;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  validReferrals: number;
}

interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referrals: ReferralEntry[];
  rewards: RewardEntry[];
}

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  valid:   "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  valid:   "Verified",
  rejected: "Rejected",
};

function StatCard({ icon: Icon, label, value, sub, color = "violet" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    cyan:   "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    green:  "bg-green-500/10 border-green-500/20 text-green-400",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Referral() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regMessage, setRegMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const [infoRes, lbRes] = await Promise.all([
        fetch(`${BASE}/api/referral/info`, { credentials: "include" }),
        fetch(`${BASE}/api/referral/leaderboard`, { credentials: "include" }),
      ]);
      if (infoRes.ok) setInfo(await infoRes.json());
      if (lbRes.ok) setLeaderboard((await lbRes.json()).leaderboard ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    const stored = localStorage.getItem("cfx_pending_ref");
    if (!stored) return;

    setRegistering(true);
    fetch(`${BASE}/api/referral/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refCode: stored }),
    })
      .then(r => r.json())
      .then(d => {
        localStorage.removeItem("cfx_pending_ref");
        if (d.success) {
          setRegMessage({ ok: true, text: "Referral code applied! Your referrer will be rewarded once you're verified as an active user." });
          fetchInfo();
        } else if (d.error?.includes("already used")) {
          localStorage.removeItem("cfx_pending_ref");
        }
      })
      .catch(() => {})
      .finally(() => setRegistering(false));
  }, [fetchInfo]);

  const copyLink = useCallback(() => {
    if (!info?.referralLink) return;
    navigator.clipboard.writeText(info.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [info?.referralLink]);

  const shareWhatsApp = useCallback(() => {
    if (!info?.referralLink) return;
    const text = encodeURIComponent(
      `Join me on CaloForgeX — your AI-powered fitness & nutrition companion! Use my link to sign up: ${info.referralLink}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [info?.referralLink]);

  const shareNative = useCallback(async () => {
    if (!info?.referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join CaloForgeX", text: "Sign up with my referral link and let's crush our fitness goals together!", url: info.referralLink });
      } catch { }
    } else {
      copyLink();
    }
  }, [info?.referralLink, copyLink]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading referral dashboard…</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Failed to load referral info. Please try again.</p>
      </div>
    );
  }

  const { stats, referrals, rewards } = info;
  const progress = stats.progressToNextMilestone;
  const progressPct = Math.round((progress / 5) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-white">Refer &amp; Earn</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Invite friends to CaloForgeX. Every 5 verified referrals earns you 1 month free Pro.
          When a friend buys Pro, you also earn +1 month.
        </p>
      </div>

      <AnimatePresence>
        {regMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${regMessage.ok
              ? "bg-green-500/10 border-green-500/20 text-green-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {regMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Your Referral Link</p>
            <p className="text-[11px] text-muted-foreground">Share this link with friends</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 font-mono truncate select-all">
            {info.referralLink}
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={copyLink}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              copied
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            }`}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Your code:</span>
          <span className="text-xs font-mono font-bold text-violet-300 tracking-widest bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
            {info.referralCode}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={shareWhatsApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] hover:bg-[#25D366]/20 text-sm font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.062.524 4.004 1.447 5.7L0 24l6.436-1.417A11.958 11.958 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm.002 21.805c-1.791 0-3.534-.482-5.065-1.39l-.364-.215-3.77.83.879-3.67-.236-.374A9.772 9.772 0 0 1 2.23 12c0-5.395 4.377-9.772 9.772-9.772 5.394 0 9.77 4.377 9.77 9.772 0 5.394-4.376 9.805-9.77 9.805z" />
            </svg>
            Share on WhatsApp
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={shareNative}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            More options
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Referrals" value={stats.totalReferrals} color="cyan" />
        <StatCard icon={CheckCheck} label="Verified" value={stats.validReferrals} color="green" />
        <StatCard icon={Clock} label="Pending" value={stats.pendingReferrals} sub="Validating activity" color="yellow" />
        <StatCard icon={Crown} label="Months Earned" value={stats.totalMonthsEarned} sub="Free Pro access" color="violet" />
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Progress to Next Free Month</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {progress} / 5
          </span>
        </div>

        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {stats.nextMilestoneIn === 0
            ? "🎉 You've hit the milestone! Rewards have been applied."
            : `${stats.nextMilestoneIn} more verified referral${stats.nextMilestoneIn !== 1 ? "s" : ""} until 1 month free Pro`}
        </p>

        <div className="border-t border-white/5 pt-3 space-y-1.5 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Every <strong className="text-white">5 verified referrals</strong> → 1 month free Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-violet-400" />
            <span>Friend buys Pro → <strong className="text-white">+1 month free</strong> for you</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rewards are <strong className="text-white">stackable</strong> with no limit</span>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel rounded-2xl p-5 space-y-3"
      >
        <h3 className="text-sm font-semibold text-white">How Verification Works</h3>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Friend signs up using your referral link" },
            { step: "2", text: "They log meals or use the AI coach on the app" },
            { step: "3", text: "After 30 minutes of real activity, referral is verified" },
            { step: "4", text: "You earn rewards automatically — no action needed" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral List */}
      {referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Your Referrals
            </h3>
            <span className="text-xs text-muted-foreground">{referrals.length} total</span>
          </div>
          <div className="divide-y divide-white/5">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {(r.first_name?.[0] || r.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {r.first_name || (r.email ? r.email.split("@")[0] : "Anonymous user")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 ml-3 text-[11px] font-medium px-2.5 py-1 rounded-full border ${statusColors[r.status]}`}>
                  {statusLabels[r.status]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rewards History */}
      {rewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Rewards Earned
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {rewards.map((rw, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    {rw.type === "purchase_bonus" ? <Crown className="w-3.5 h-3.5 text-yellow-400" /> : <Star className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-white">+{rw.months_added} month{rw.months_added !== 1 ? "s" : ""} free Pro</p>
                    <p className="text-[11px] text-muted-foreground">{rw.note}</p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground ml-3 shrink-0">
                  {new Date(rw.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl overflow-hidden mb-6"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-400" />
              Top Referrers
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {leaderboard.map(l => (
              <div key={l.rank} className="flex items-center gap-4 px-5 py-3">
                <span className={`w-6 text-center font-bold text-sm shrink-0 ${
                  l.rank === 1 ? "text-yellow-400" : l.rank === 2 ? "text-gray-300" : l.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {l.rank === 1 ? "🥇" : l.rank === 2 ? "🥈" : l.rank === 3 ? "🥉" : l.rank}
                </span>
                <p className="flex-1 text-sm text-white truncate">{l.name}</p>
                <span className="text-sm font-bold text-primary shrink-0">{l.validReferrals} referrals</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
