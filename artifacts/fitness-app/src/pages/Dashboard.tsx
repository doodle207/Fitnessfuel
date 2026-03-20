import { useState, useEffect } from "react";
import { useGetDashboard, useGetProfile } from "@workspace/api-client-react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { format } from "date-fns";
import {
  Flame, Activity, Trophy, ArrowRight, Utensils, Droplets, Footprints,
  Target, TrendingUp, Zap, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Link } from "wouter";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MacroRingProps {
  label: string;
  emoji: string;
  current: number;
  target: number;
  stroke: string;
  track: string;
}

function MacroRing({ label, emoji, current, target, stroke, track }: MacroRingProps) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const arcPct = 0.75; // 270° open-bottom arc
  const arcLen = circumference * arcPct;
  const gapLen = circumference - arcLen;
  const pct = Math.min(current / Math.max(target, 1), 1);
  const filled = arcLen * pct;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: "rotate(135deg)" }}>
          {/* Track ring */}
          <circle cx="50" cy="50" r={r} fill="none"
            stroke={track} strokeWidth="9"
            strokeDasharray={`${arcLen} ${gapLen}`}
            strokeLinecap="round"
          />
          {/* Progress ring */}
          <circle cx="50" cy="50" r={r} fill="none"
            stroke={stroke} strokeWidth="9"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pb-2">
          <span className="text-2xl select-none">{emoji}</span>
        </div>
      </div>
      <div className="text-center leading-snug">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xs font-bold text-white/90">{current}/{target}g</p>
      </div>
    </div>
  );
}

const STEPS_KEY = "fittrack_steps_today";
const STEPS_DATE_KEY = "fittrack_steps_date";
const WATER_KEY = "fittrack_water_ml";
const CALS_PER_STEP = 0.04;

function getStepsToday(): number {
  const d = localStorage.getItem(STEPS_DATE_KEY);
  const today = new Date().toISOString().split("T")[0];
  if (d !== today) {
    localStorage.setItem(STEPS_KEY, "0");
    localStorage.setItem(STEPS_DATE_KEY, today);
    return 0;
  }
  return parseInt(localStorage.getItem(STEPS_KEY) || "0");
}

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  const { data: stats, isLoading: isStatsLoading } = useGetDashboard();
  const [steps, setSteps] = useState(getStepsToday);
  const [stepsInput, setStepsInput] = useState("");
  const [showStepsInput, setShowStepsInput] = useState(false);
  const [waterMl, setWaterMl] = useState(0);
  const [macroTotals, setMacroTotals] = useState({ proteinG: 0, carbsG: 0, fatG: 0 });
  const [todayFoodCalories, setTodayFoodCalories] = useState(0);

  useEffect(() => {
    localStorage.setItem(STEPS_KEY, String(steps));
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STEPS_DATE_KEY, today);
  }, [steps]);

  useEffect(() => {
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json())
      .then((logs: any[]) => {
        if (!Array.isArray(logs)) return;
        const totals = logs.reduce(
          (acc, l) => ({
            calories: acc.calories + (l.calories || 0),
            proteinG: acc.proteinG + (l.proteinG || 0),
            carbsG: acc.carbsG + (l.carbsG || 0),
            fatG: acc.fatG + (l.fatG || 0),
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
        );
        setTodayFoodCalories(Math.round(totals.calories));
        setMacroTotals({
          proteinG: Math.round(totals.proteinG),
          carbsG: Math.round(totals.carbsG),
          fatG: Math.round(totals.fatG),
        });
      })
      .catch(() => {});
    // Fetch water from API (same source as Diet page)
    const today = new Date().toISOString().split("T")[0];
    fetch(`${BASE}/api/progress/water?date=${today}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d && d.totalMl !== undefined) setWaterMl(d.totalMl); })
      .catch(() => { setWaterMl(parseInt(localStorage.getItem(WATER_KEY) || "0")); });
  }, []);

  const handleStepsSave = () => {
    const n = parseInt(stepsInput);
    if (!isNaN(n) && n >= 0) setSteps(n);
    setStepsInput("");
    setShowStepsInput(false);
  };

  if (isProfileLoading || isStatsLoading) return <LoadingState message="Loading dashboard..." />;

  const safeProfile = profile && typeof profile === "object" && !Array.isArray(profile) ? profile as any : {};
  const safeStats = stats && typeof stats === "object" && !Array.isArray(stats) ? stats as any : {
    currentStreak: 0,
    totalWorkouts: 0,
    weeklyStreak: 0,
    recentWorkouts: [],
    personalRecords: [],
    weeklyVolume: [
      { day: "Mon", volume: 0 }, { day: "Tue", volume: 0 }, { day: "Wed", volume: 0 },
      { day: "Thu", volume: 0 }, { day: "Fri", volume: 0 }, { day: "Sat", volume: 0 }, { day: "Sun", volume: 0 },
    ],
  };

  const stepCalories = Math.round(steps * CALS_PER_STEP);
  const today = new Date().toISOString().split("T")[0];
  const todayWorkoutCalories = safeStats.recentWorkouts
    ?.filter((w: any) => w.date === today)
    .reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0) || 0;
  const totalBurned = todayWorkoutCalories + stepCalories;

  const weightKg = safeProfile.weightKg || 70;
  const heightCm = safeProfile.heightCm || 170;
  const age = safeProfile.age || 25;
  const gender = safeProfile.gender || "male";
  const activityLevel = safeProfile.activityLevel || "moderate";
  const fitnessGoal = safeProfile.fitnessGoal || "maintenance";

  const bmr = Math.round(
    10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "female" ? -161 : 5)
  );
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, "very active": 1.725,
  };
  const tdee = Math.round(bmr * (activityMultipliers[activityLevel] ?? 1.55));
  const calTarget = fitnessGoal === "weight loss" ? Math.round(tdee - 500)
    : fitnessGoal === "muscle gain" ? Math.round(tdee + 300)
    : tdee;

  const proteinTarget = Math.round(weightKg * 2.2);
  const fatTarget = Math.round(weightKg * 0.9);
  const carbsTarget = Math.max(0, Math.round((calTarget - proteinTarget * 4 - fatTarget * 9) / 4));

  const waterPct = Math.min(waterMl / 3000, 1);
  const waterGlasses = Math.round(waterMl / 250);
  const netCalories = todayFoodCalories - totalBurned;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM do")}</p>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-0.5">
              Hey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{safeProfile.name?.split(" ")[0] || "Champ"}</span> 👋
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/workout" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-[0_0_16px_rgba(124,58,237,0.4)]">
              <Activity className="w-4 h-4" /> Workout
            </Link>
            <Link href="/diet" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
              <Utensils className="w-4 h-4" /> Log Food
            </Link>
          </div>
        </header>

        {/* ── ROW 1: Calories Overview ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card rounded-3xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Calorie Overview</h3>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">Today</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Utensils className="w-3 h-3 text-green-400" /> Eaten</p>
              <p className="text-2xl font-display font-bold text-green-400">{todayFoodCalories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Burned</p>
              <p className="text-2xl font-display font-bold text-orange-400">{totalBurned}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Target className="w-3 h-3 text-blue-400" /> Goal</p>
              <p className="text-2xl font-display font-bold text-blue-400">{calTarget}</p>
              <p className="text-xs text-muted-foreground">kcal target</p>
            </div>
            <button onClick={() => setShowStepsInput(v => !v)} className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center hover:bg-violet-500/20 transition-colors cursor-pointer">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Footprints className="w-3 h-3 text-violet-400" /> Steps</p>
              <p className="text-2xl font-display font-bold text-violet-400">{steps.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">≈ {stepCalories} kcal</p>
            </button>
          </div>
          {showStepsInput && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-2 mb-4">
              <input
                type="number"
                value={stepsInput}
                onChange={e => setStepsInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStepsSave()}
                placeholder="Enter today's step count"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm"
              />
              <button onClick={handleStepsSave} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">Save</button>
            </motion.div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Daily target: <span className="text-white/60 font-semibold">{calTarget} kcal</span> · {fitnessGoal === "weight loss" ? "Cut" : fitnessGoal === "muscle gain" ? "Bulk" : "Maintain"}</span>
              <span className={netCalories > 0 ? "text-green-400" : "text-orange-400"}>{netCalories > 0 ? "+" : ""}{netCalories} kcal net</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min(todayFoodCalories / Math.max(calTarget, 1), 1) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
              />
            </div>
          </div>
        </motion.div>

        {/* ── ROW 2: Macros+Hydration (left) | Workout+Streaks (right) ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

          {/* LEFT: Macros + Hydration */}
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="md:col-span-3 glass-card rounded-3xl p-5 border border-white/5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Macros & Hydration</h3>
              <Link href="/diet" className="text-xs text-violet-400 hover:underline flex items-center gap-1">Diet <ArrowRight className="w-3 h-3" /></Link>
            </div>

            {/* Macro Rings row */}
            <div className="grid grid-cols-3 gap-2">
              <MacroRing label="Protein" emoji="🥩" current={macroTotals.proteinG} target={proteinTarget} stroke="#4A90D9" track="rgba(74,144,217,0.15)" />
              <MacroRing label="Carbs" emoji="🌾" current={macroTotals.carbsG} target={carbsTarget} stroke="#34C759" track="rgba(52,199,89,0.15)" />
              <MacroRing label="Fat" emoji="🥑" current={macroTotals.fatG} target={fatTarget} stroke="#FF9500" track="rgba(255,149,0,0.15)" />
            </div>

            {/* Hydration */}
            <div className="rounded-2xl bg-cyan-500/5 border border-cyan-500/15 p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="url(#waterGrad2)" strokeWidth="8"
                      strokeLinecap="round"
                      style={{ strokeDasharray: `${2 * Math.PI * 32}`, strokeDashoffset: `${2 * Math.PI * 32 * (1 - waterPct)}`, transition: "stroke-dashoffset 1s ease" }}
                    />
                    <defs>
                      <linearGradient id="waterGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Droplets className="w-4 h-4 text-cyan-400 mb-0.5" />
                    <span className="text-base font-display font-bold text-cyan-400">{waterGlasses}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold text-cyan-400">Hydration</span>
                    <span className="text-xs text-muted-foreground">{waterMl} / 3000 ml</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${waterPct * 100}%` }} />
                  </div>
                  <div className="flex gap-2">
                    {[250, 500].map(ml => (
                      <button key={ml} onClick={async () => {
                        const newVal = Math.min(waterMl + ml, 3000);
                        setWaterMl(newVal);
                        try {
                          const today = new Date().toISOString().split("T")[0];
                          const r = await fetch(`${BASE}/api/progress/water`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMl: ml, date: today }) });
                          const d = await r.json();
                          if (d && d.totalMl !== undefined) setWaterMl(d.totalMl);
                        } catch {}
                      }} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 active:scale-95 transition-all">
                        +{ml}ml
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Workout + Streaks */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="md:col-span-2 glass-card rounded-3xl p-5 border border-white/5 space-y-4"
          >
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Workout & Streaks</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-orange-500/10 border border-orange-500/20 text-center">
                <p className="text-3xl font-display font-black text-orange-400">{safeStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground mt-1">Day Streak 🔥</p>
              </div>
              <div className="rounded-2xl p-4 bg-violet-500/10 border border-violet-500/20 text-center">
                <p className="text-3xl font-display font-black text-violet-400">{safeStats.totalWorkouts}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Workouts</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This week</span>
                <span className="text-sm font-semibold">{safeStats.weeklyStreak} sessions</span>
              </div>
              <div className="flex gap-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                  const filled = i < safeStats.weeklyStreak;
                  return (
                    <div key={i} className={`flex-1 h-2 rounded-full transition-all ${filled ? "bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(124,58,237,0.5)]" : "bg-white/10"}`} />
                  );
                })}
              </div>
              <div className="flex gap-1 justify-between">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</span>
                ))}
              </div>
            </div>
            <Link href="/workout" className="flex items-center justify-between p-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 transition-colors border border-violet-500/20 group">
              <span className="text-sm font-semibold text-violet-300">Start Workout</span>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* ── ROW 3: PRs + Weekly Volume ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal Records */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-5 border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Personal Records
              </h3>
              <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{safeStats.personalRecords.length} PRs</span>
            </div>
            {safeStats.personalRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Log workouts to track your PRs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {safeStats.personalRecords.slice(0, 4).map((pr, i) => (
                  <motion.div key={pr.exerciseId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                    className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{pr.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(pr.date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-yellow-500 text-lg">{pr.weightKg}</p>
                      <p className="text-xs text-muted-foreground">kg</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Weekly Volume Polygon Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card rounded-3xl p-5 border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" /> Weekly Volume
              </h3>
              <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">Last 7 Days</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeStats.weeklyVolume} barSize={28} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", fontSize: "12px" }}
                  />
                  <Bar dataKey="volume" radius={[8, 8, 2, 2]} label={false}>
                    {safeStats.weeklyVolume.map((entry, index) => (
                      <Cell key={`cell-${index}`}
                        fill={entry.volume > 0 ? "url(#barGrad)" : "rgba(255,255,255,0.05)"}
                        stroke={entry.volume > 0 ? "rgba(124,58,237,0.3)" : "transparent"}
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ── Recent Workouts ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card rounded-3xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Recent Workouts</h3>
            <Link href="/workout" className="text-xs text-violet-400 hover:underline flex items-center gap-1">See all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {safeStats.recentWorkouts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-muted-foreground">
              <p className="text-sm">No workouts yet.</p>
              <Link href="/workout" className="text-violet-400 text-sm font-medium mt-2 inline-block hover:underline">Start your first workout!</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeStats.recentWorkouts.slice(0, 3).map((workout, i) => (
                <Link key={workout.id} href={`/workout/active/${workout.id}`} className="block group">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-violet-500/30 transition-all group-hover:bg-black/60 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-xs text-muted-foreground mb-1">{format(new Date(workout.date), "MMM d")}</p>
                    <h4 className="font-semibold group-hover:text-violet-400 transition-colors">{workout.name}</h4>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {workout.exerciseCount} exercises</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {workout.caloriesBurned || 0} kcal</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{workout.muscleGroup || "Mixed"}</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
