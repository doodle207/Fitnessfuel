import { useState, useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, TrendingDown, TrendingUp, Dumbbell, Flame,
  Scale, Target, Info, ChevronRight, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine
} from "recharts";
import { format, addDays } from "date-fns";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const actMul: Record<string, number> = {
  sedentary: 1.2, light: 1.375, "lightly active": 1.375,
  moderate: 1.55, "moderately active": 1.55,
  active: 1.725, "very active": 1.725,
  athlete: 1.9, "extra active": 1.9,
};

function computeBMR(weightKg: number, heightCm: number, age: number, gender: string) {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "female" ? -161 : 5));
}

interface Prediction {
  weightKg: number;
  fatChange: number;
  muscleChange: number;
  totalChange: number;
  dailyBalance: number;
}

function predict(
  currentWeight: number,
  tdee: number,
  calories: number,
  proteinG: number,
  workoutsPerWeek: number,
  experience: string,
  days: number
): Prediction {
  const dailyBalance = calories - tdee;
  const totalKgChange = (dailyBalance * days) / 7700;

  const hasTraining = workoutsPerWeek >= 2;
  const hasGoodProtein = proteinG >= currentWeight * 1.5;
  const isBeginner = experience?.toLowerCase().includes("beginner");

  let fatChange: number, muscleChange: number;

  if (totalKgChange < 0) {
    const muscleRatio = hasTraining && hasGoodProtein ? 0.08 : hasTraining || hasGoodProtein ? 0.14 : 0.22;
    muscleChange = totalKgChange * muscleRatio;
    fatChange = totalKgChange * (1 - muscleRatio);
  } else {
    let muscleRatio = hasTraining ? (isBeginner ? 0.65 : 0.45) : 0.2;
    if (!hasGoodProtein) muscleRatio *= 0.7;
    muscleChange = totalKgChange * muscleRatio;
    fatChange = totalKgChange * (1 - muscleRatio);
  }

  return {
    weightKg: currentWeight + totalKgChange,
    fatChange: parseFloat(fatChange.toFixed(2)),
    muscleChange: parseFloat(muscleChange.toFixed(2)),
    totalChange: parseFloat(totalKgChange.toFixed(2)),
    dailyBalance,
  };
}

function buildWeightChart(startWeight: number, tdee: number, calories: number, days: number) {
  const dailyDelta = (calories - tdee) / 7700;
  const steps = Math.min(days, 15);
  const interval = days / steps;
  const data = [];
  for (let i = 0; i <= steps; i++) {
    const d = Math.round(i * interval);
    data.push({
      label: d === 0 ? "Now" : `Day ${d}`,
      weight: parseFloat((startWeight + dailyDelta * d).toFixed(2)),
    });
  }
  return data;
}

export default function FutureBodySimulator() {
  const [, setLocation] = useLocation();
  const { data: rawProfile, isLoading } = useGetProfile({
    query: { queryKey: ["fitness", "profile"] }
  });

  const [days, setDays] = useState(30);
  const [avgCalories, setAvgCalories] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [dataLoaded, setDataLoaded] = useState(false);

  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
    ? rawProfile as any : {};

  const weightKg = profile.weightKg || 70;
  const heightCm = profile.heightCm || 170;
  const age = profile.age || 25;
  const gender = profile.gender || "male";
  const activityLevel = profile.activityLevel || "moderate";
  const experience = profile.experienceLevel || "Intermediate";
  const goal = profile.fitnessGoal || "maintenance";

  const bmr = computeBMR(weightKg, heightCm, age, gender);
  const tdee = Math.round(bmr * (actMul[activityLevel] ?? 1.55));

  useEffect(() => {
    if (dataLoaded) return;
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json())
      .then((logs: any[]) => {
        if (!Array.isArray(logs) || logs.length === 0) return;
        const total = logs.reduce((acc, l) => ({
          cal: acc.cal + (l.calories || 0),
          protein: acc.protein + (l.proteinG || 0),
        }), { cal: 0, protein: 0 });
        setAvgCalories(Math.round(total.cal));
        setAvgProtein(Math.round(total.protein));
        setDataLoaded(true);
      }).catch(() => {
        setAvgCalories(tdee);
        setAvgProtein(Math.round(weightKg * 1.8));
        setDataLoaded(true);
      });
  }, [tdee, weightKg, dataLoaded]);

  const result = predict(weightKg, tdee, avgCalories, avgProtein, workoutsPerWeek, experience, days);
  const chartData = buildWeightChart(weightKg, tdee, avgCalories, days);

  const isDeficit = result.dailyBalance < 0;
  const isSurplus = result.dailyBalance > 0;

  // Insights
  const insights: { text: string; type: "good" | "warn" | "info" }[] = [];
  if (avgProtein >= weightKg * 1.6) insights.push({ text: "Your protein intake is helping preserve muscle 💪", type: "good" });
  else if (avgProtein < weightKg * 1.2) insights.push({ text: "Low protein may reduce muscle retention ⚠️", type: "warn" });
  if (isDeficit) insights.push({ text: `You are in a ${Math.abs(result.dailyBalance)} kcal deficit — great for fat loss`, type: "good" });
  else if (isSurplus) insights.push({ text: `You are in a ${result.dailyBalance} kcal surplus — muscle building mode`, type: "info" });
  else insights.push({ text: "Calories balanced — maintaining weight", type: "info" });
  if (workoutsPerWeek < 2) insights.push({ text: "Low workout frequency may slow fat loss ⚠️", type: "warn" });
  else insights.push({ text: `${workoutsPerWeek}x/week training is boosting your muscle retention`, type: "good" });

  // Status message
  let statusMsg = "You are on track 🔥";
  let statusColor = "from-green-500/20 to-emerald-500/10 border-green-500/25";
  if (Math.abs(result.totalChange) < 0.5) {
    statusMsg = "Minimal change expected — adjust calories to accelerate progress";
    statusColor = "from-yellow-500/20 to-amber-500/10 border-yellow-500/25";
  } else if (isSurplus && workoutsPerWeek < 2) {
    statusMsg = "Progress slowing — add strength training to convert surplus to muscle ⚠️";
    statusColor = "from-orange-500/20 to-red-500/10 border-orange-500/25";
  }

  if (isLoading) return <LoadingState message="Loading your data..." />;

  const fmt1 = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1);
  const weightChange = result.weightKg - weightKg;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-5 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-400" /> Future Body Simulator
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">See how your body will change based on your current routine</p>
          </div>
        </div>

        {/* Time Frame */}
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d}
              onClick={() => setDays(d)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border transition-all ${days === d
                ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
              {d} Days
            </button>
          ))}
        </div>

        {/* Prediction Card */}
        <motion.div
          key={`${days}-${avgCalories}-${avgProtein}-${workoutsPerWeek}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-5 border border-white/8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">In {days} days</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${isDeficit ? "text-green-400 bg-green-500/10 border-green-500/20" : isSurplus ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"}`}>
              {isDeficit ? `${result.dailyBalance} kcal/day` : isSurplus ? `+${result.dailyBalance} kcal/day` : "Maintenance"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Weight */}
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Scale className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Weight</p>
              <p className="font-display font-bold text-lg">{result.weightKg.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className={`text-xs font-semibold mt-0.5 ${weightChange < 0 ? "text-green-400" : weightChange > 0 ? "text-orange-400" : "text-muted-foreground"}`}>
                {fmt1(weightChange)} kg
              </p>
            </div>
            {/* Fat */}
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Fat</p>
              <p className="font-display font-bold text-lg text-orange-300">{fmt1(result.fatChange)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.fatChange < 0 ? "lost" : "gained"}</p>
            </div>
            {/* Muscle */}
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Dumbbell className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Muscle</p>
              <p className="font-display font-bold text-lg text-blue-300">{fmt1(result.muscleChange)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.muscleChange >= 0 ? "gained" : "lost"}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`rounded-2xl p-3 bg-gradient-to-r border text-sm font-semibold ${statusColor}`}>
            {statusMsg}
          </div>

          {/* Weight Prediction Chart */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Weight Trajectory</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => [`${v} kg`, "Weight"]}
                  />
                  <Line
                    type="monotone" dataKey="weight"
                    stroke="url(#weightGrad)" strokeWidth={2.5} dot={false}
                    strokeDasharray={chartData.length > 1 ? undefined : "0"}
                  />
                  <defs>
                    <linearGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">Predictions are estimates based on your data and may vary</p>
          </div>

          {/* Fat vs Muscle bar */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Body Composition Change</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Fat", value: result.fatChange, fill: result.fatChange < 0 ? "#22c55e" : "#f97316" },
                  { name: "Muscle", value: result.muscleChange, fill: result.muscleChange >= 0 ? "#3b82f6" : "#ef4444" },
                ]} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => [`${v > 0 ? "+" : ""}${v} kg`]}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {[result.fatChange, result.muscleChange].map((val, i) => (
                      <Cell key={i} fill={i === 0 ? (val < 0 ? "#22c55e" : "#f97316") : (val >= 0 ? "#3b82f6" : "#ef4444")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Smart Insights */}
        <div className="glass-card rounded-3xl p-5 border border-white/8 space-y-3">
          <p className="font-display font-bold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-violet-400" /> Smart Insights</p>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-2.5 p-3 rounded-xl text-sm border ${ins.type === "good" ? "bg-green-500/8 border-green-500/15 text-green-300" : ins.type === "warn" ? "bg-yellow-500/8 border-yellow-500/15 text-yellow-300" : "bg-violet-500/8 border-violet-500/15 text-violet-300"}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ins.type === "good" ? "bg-green-400" : ins.type === "warn" ? "bg-yellow-400" : "bg-violet-400"}`} />
                {ins.text}
              </motion.div>
            ))}
          </div>
        </div>

        {/* What-If Mode */}
        <div className="glass-card rounded-3xl p-5 border border-violet-500/20 bg-violet-500/3 space-y-5">
          <div>
            <p className="font-display font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" /> What-If Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">Adjust inputs to instantly see how your results change</p>
          </div>

          <div className="space-y-4">
            {/* Calories */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Daily Calories</span>
                <span className="font-bold text-orange-300">{avgCalories} kcal</span>
              </div>
              <input type="range" min={tdee - 1000} max={tdee + 800} step={50} value={avgCalories}
                onChange={e => setAvgCalories(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>-1000</span>
                <span className="text-violet-400">TDEE: {tdee}</span>
                <span>+800</span>
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1"><Dumbbell className="w-3 h-3 text-blue-400" /> Protein</span>
                <span className="font-bold text-blue-300">{avgProtein}g / day</span>
              </div>
              <input type="range" min={20} max={Math.round(weightKg * 3)} step={5} value={avgProtein}
                onChange={e => setAvgProtein(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Low</span>
                <span className="text-blue-400">Goal: {Math.round(weightKg * 2)}g</span>
                <span>High</span>
              </div>
            </div>

            {/* Workouts */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3 text-green-400" /> Workouts/week</span>
                <span className="font-bold text-green-300">{workoutsPerWeek}x</span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => setWorkoutsPerWeek(n)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${workoutsPerWeek === n ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/8 text-muted-foreground hover:bg-white/10"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* What-if insight */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-xs text-violet-200">
            {avgProtein >= weightKg * 2 && workoutsPerWeek >= 3
              ? `🔥 At ${avgProtein}g protein + ${workoutsPerWeek}x training, you'll preserve maximum muscle`
              : avgProtein < weightKg * 1.5
              ? `💡 Increase protein to ${Math.round(weightKg * 2)}g/day to improve muscle retention by ~30%`
              : workoutsPerWeek < 3
              ? `💡 Adding ${3 - workoutsPerWeek} more workout(s)/week would improve your muscle gain by ~25%`
              : `You are on a solid path — stay consistent for best results`}
          </div>
        </div>

        {/* Profile summary */}
        <div className="glass-card rounded-3xl p-4 border border-white/5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Based on Your Profile</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { label: "TDEE", value: `${tdee} kcal` },
              { label: "BMR", value: `${bmr} kcal` },
              { label: "Goal", value: goal },
              { label: "Weight", value: `${weightKg} kg` },
              { label: "Experience", value: experience },
              { label: "Activity", value: activityLevel },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-xl bg-white/3 border border-white/5">
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold capitalize mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Predictions are estimates based on your data and may vary. Consult a professional for medical advice.
        </p>
      </div>
    </PageTransition>
  );
}
