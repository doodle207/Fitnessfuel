import { motion } from "framer-motion";

const AD_VARIANTS = [
  { text: "Upgrade to CaloForgeX Pro", sub: "Unlock AI meal plans, body scans & more", gradient: "from-violet-600/10 to-cyan-600/10", border: "border-violet-500/20" },
  { text: "Premium Workouts Available", sub: "Access 500+ guided programs", gradient: "from-amber-600/10 to-orange-600/10", border: "border-amber-500/20" },
  { text: "Track Smarter, Not Harder", sub: "AI-powered insights for your journey", gradient: "from-emerald-600/10 to-teal-600/10", border: "border-emerald-500/20" },
];

export default function AdBanner({ variant = 0 }: { variant?: number }) {
  const ad = AD_VARIANTS[variant % AD_VARIANTS.length];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl bg-gradient-to-r ${ad.gradient} border ${ad.border} px-4 py-3 flex items-center justify-between`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/70">{ad.text}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{ad.sub}</p>
      </div>
      <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 shrink-0 ml-2">Ad</span>
    </motion.div>
  );
}
