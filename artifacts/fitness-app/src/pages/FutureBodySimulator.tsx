import { useState, useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import {
  Brain, Zap, Dumbbell, Flame, Scale, Target, Info, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine
} from "recharts";
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
  const [reportMode, setReportMode] = useState<"plan" | "actual">("plan");

  // Actual logged data
  const [actualCalories, setActualCalories] = useState(0);
  const [actualProtein, setActualProtein] = useState(0);
  const [actualLoaded, setActualLoaded] = useState(false);

  // What-if overrides (for actual mode)
  const [whatIfCalories, setWhatIfCalories] = useState(0);
  const [whatIfProtein, setWhatIfProtein] = useState(0);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);

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

  // App-suggested macros
  const goalAdj: Record<string, number> = { "weight loss": -500, "fat loss": -500, "muscle gain": 300, "athletic performance": 200, "recomposition": -100, maintenance: 0, "general fitness": 0, flexibility: 0 };
  const suggestedCalories = tdee + (goalAdj[goal] ?? 0);
  const suggestedProtein = Math.round(weightKg * 2.2);

  useEffect(() => {
    if (actualLoaded) return;
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json())
      .then((logs: any[]) => {
        const cal = Array.isArray(logs) && logs.length > 0
          ? Math.round(logs.reduce((s, l) => s + (l.calories || 0), 0))
          : tdee;
        const prot = Array.isArray(logs) && logs.length > 0
          ? Math.round(logs.reduce((s, l) => s + (l.proteinG || 0), 0))
          : Math.round(weightKg * 1.8);
        setActualCalories(cal);
        setActualProtein(prot);
        setWhatIfCalories(cal);
        setWhatIfProtein(prot);
        setActualLoaded(true);
      }).catch(() => {
        setActualCalories(tdee);
        setActualProtein(Math.round(weightKg * 1.8));
        setWhatIfCalories(tdee);
        setWhatIfProtein(Math.round(weightKg * 1.8));
        setActualLoaded(true);
      });
  }, [tdee, weightKg, actualLoaded]);

  if (isLoading) return <LoadingState message="Loading your data..." />;

  const fmt1 = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1);

  // Plan report (suggested macros)
  const planResult = predict(weightKg, tdee, suggestedCalories, suggestedProtein, workoutsPerWeek, experience, days);
  const planChart = buildWeightChart(weightKg, tdee, suggestedCalories, days);

  // Actual report (logged data + what-if overrides)
  const actualResult = predict(weightKg, tdee, whatIfCalories, whatIfProtein, workoutsPerWeek, experience, days);
  const actualChart = buildWeightChart(weightKg, tdee, whatIfCalories, days);

  function buildInsights(protein: number, balance: number, workouts: number) {
    const list: { text: string; type: "good" | "warn" | "info" }[] = [];
    if (protein >= weightKg * 1.6) list.push({ text: "Your protein intake is helping preserve muscle 💪", type: "good" });
    else if (protein < weightKg * 1.2) list.push({ text: "Low protein may reduce muscle retention ⚠️", type: "warn" });
    if (balance < 0) list.push({ text: `${Math.abs(balance)} kcal deficit daily — great for fat loss`, type: "good" });
    else if (balance > 0) list.push({ text: `${balance} kcal surplus daily — muscle building mode`, type: "info" });
    else list.push({ text: "Calories balanced — maintaining weight", type: "info" });
    if (workouts < 2) list.push({ text: "Low workout frequency may slow fat loss ⚠️", type: "warn" });
    else list.push({ text: `${workouts}x/week training is boosting your muscle retention`, type: "good" });
    return list;
  }

  function statusFor(result: Prediction, surplus: boolean) {
    if (Math.abs(result.totalChange) < 0.5) return { msg: "Minimal change expected — adjust calories to accelerate", color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/25" };
    if (surplus && workoutsPerWeek < 2) return { msg: "Add strength training to convert surplus to muscle ⚠️", color: "from-orange-500/20 to-red-500/10 border-orange-500/25" };
    return { msg: "You are on track 🔥", color: "from-green-500/20 to-emerald-500/10 border-green-500/25" };
  }

  function ReportPanel({ result, chart, calories, protein, isActual }: {
    result: Prediction; chart: ReturnType<typeof buildWeightChart>;
    calories: number; protein: number; isActual: boolean;
  }) {
    const surplus = result.dailyBalance > 0;
    const deficit = result.dailyBalance < 0;
    const status = statusFor(result, surplus);
    const insights = buildInsights(protein, result.dailyBalance, workoutsPerWeek);
    const wChange = result.weightKg - weightKg;

    return (
      <div className="space-y-4">
        <motion.div
          key={`${days}-${calories}-${protein}-${workoutsPerWeek}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-5 border border-white/8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">In {days} days</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${deficit ? "text-green-400 bg-green-500/10 border-green-500/20" : surplus ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"}`}>
              {deficit ? `${result.dailyBalance}` : surplus ? `+${result.dailyBalance}` : "0"} kcal/day
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Scale className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Weight</p>
              <p className="font-display font-bold text-lg">{result.weightKg.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className={`text-xs font-semibold mt-0.5 ${wChange < 0 ? "text-green-400" : wChange > 0 ? "text-orange-400" : "text-muted-foreground"}`}>{fmt1(wChange)} kg</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Fat</p>
              <p className="font-display font-bold text-lg text-orange-300">{fmt1(result.fatChange)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.fatChange < 0 ? "lost" : "gained"}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/8">
              <Dumbbell className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-1">Muscle</p>
              <p className="font-display font-bold text-lg text-blue-300">{fmt1(result.muscleChange)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.muscleChange >= 0 ? "gained" : "lost"}</p>
            </div>
          </div>

          <div className={`rounded-2xl p-3 bg-gradient-to-r border text-sm font-semibold ${status.color}`}>{status.msg}</div>

          {/* Macro summary row */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/8 border border-orange-500/15">
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Calories</p>
                <p className="text-xs font-bold text-orange-300">{calories} kcal</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
              <Dumbbell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Protein</p>
                <p className="text-xs font-bold text-blue-300">{protein}g</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/8 border border-violet-500/15">
              <Target className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">TDEE</p>
                <p className="text-xs font-bold text-violet-300">{tdee} kcal</p>
              </div>
            </div>
          </div>

          {/* Weight chart */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Weight Trajectory</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`${v} kg`, "Weight"]} />
                  <Line type="monotone" dataKey="weight" stroke="url(#wGrad)" strokeWidth={2.5} dot={false} />
                  <defs>
                    <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">Estimates — individual results may vary</p>
          </div>

          {/* Bar chart */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Body Composition Change</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Fat", value: result.fatChange }, { name: "Muscle", value: result.muscleChange }]} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`${v > 0 ? "+" : ""}${v} kg`]} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {[result.fatChange, result.muscleChange].map((v, i) => (
                      <Cell key={i} fill={i === 0 ? (v < 0 ? "#22c55e" : "#f97316") : (v >= 0 ? "#3b82f6" : "#ef4444")} />
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

        {/* What-If sliders — only in Actual tab */}
        {isActual && (
          <div className="glass-card rounded-3xl p-5 border border-violet-500/20 bg-violet-500/3 space-y-5">
            <div>
              <p className="font-display font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" /> What-If Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Adjust to see how changes affect your outcome</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Daily Calories</span>
                  <span className="font-bold text-orange-300">{whatIfCalories} kcal</span>
                </div>
                <input type="range" min={tdee - 1000} max={tdee + 800} step={50} value={whatIfCalories}
                  onChange={e => setWhatIfCalories(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>-1000</span><span className="text-violet-400">TDEE: {tdee}</span><span>+800</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1"><Dumbbell className="w-3 h-3 text-blue-400" /> Protein</span>
                  <span className="font-bold text-blue-300">{whatIfProtein}g / day</span>
                </div>
                <input type="range" min={20} max={Math.round(weightKg * 3)} step={5} value={whatIfProtein}
                  onChange={e => setWhatIfProtein(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3 text-green-400" /> Workouts/week</span>
                  <span className="font-bold text-green-300">{workoutsPerWeek}x</span>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setWorkoutsPerWeek(n)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${workoutsPerWeek === n ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/8 text-muted-foreground hover:bg-white/10"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-xs text-violet-200">
              {whatIfProtein >= weightKg * 2 && workoutsPerWeek >= 3
                ? `🔥 At ${whatIfProtein}g protein + ${workoutsPerWeek}x training, you'll preserve maximum muscle`
                : whatIfProtein < weightKg * 1.5
                ? `💡 Increase protein to ${Math.round(weightKg * 2)}g/day to improve muscle retention by ~30%`
                : workoutsPerWeek < 3
                ? `💡 Adding ${3 - workoutsPerWeek} more workout(s)/week would improve your muscle gain by ~25%`
                : `You are on a solid path — stay consistent for best results`}
            </div>
          </div>
        )}
      </div>
    );
  }

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
            <button key={d} onClick={() => setDays(d)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border transition-all ${days === d ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
              {d} Days
            </button>
          ))}
        </div>

        {/* Report Tabs */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/8">
          <button onClick={() => setReportMode("plan")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${reportMode === "plan" ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]" : "text-muted-foreground hover:text-white"}`}>
            Suggested Plan
          </button>
          <button onClick={() => setReportMode("actual")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${reportMode === "actual" ? "bg-cyan-600 text-white shadow-[0_0_12px_rgba(8,145,178,0.35)]" : "text-muted-foreground hover:text-white"}`}>
            Your Actual
          </button>
        </div>

        {/* Tab description */}
        <p className="text-xs text-muted-foreground px-1">
          {reportMode === "plan"
            ? `App recommends ${suggestedCalories} kcal & ${suggestedProtein}g protein/day for your ${goal} goal`
            : actualLoaded
              ? `Based on your logged food data (${actualCalories} kcal, ${actualProtein}g protein). Use sliders to model changes.`
              : "Loading your food log..."}
        </p>

        {/* Report content */}
        {reportMode === "plan" ? (
          <ReportPanel result={planResult} chart={planChart} calories={suggestedCalories} protein={suggestedProtein} isActual={false} />
        ) : (
          <ReportPanel result={actualResult} chart={actualChart} calories={whatIfCalories} protein={whatIfProtein} isActual={true} />
        )}

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
