import { useState } from "react";
import { useCreateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Target, ChevronRight, ChevronLeft,
  User, Scale, CheckCircle2,
  TrendingDown, TrendingUp, Heart, Calendar
} from "lucide-react";

const STEPS = [
  { id: "basics",  title: "About You",    subtitle: "Let's start with the basics",    icon: User   },
  { id: "body",    title: "Body & Goals", subtitle: "We'll calculate your targets",   icon: Scale  },
  { id: "plan",    title: "Your Plan",    subtitle: "Personalized just for you",      icon: Target },
];

const GENDER_OPTIONS = [
  { value: "male",   label: "Male",   emoji: "\u2642\uFE0F" },
  { value: "female", label: "Female", emoji: "\u2640\uFE0F" },
];

const DIET_OPTIONS = [
  { value: "non-veg", label: "Non-Veg",  desc: "Meat, fish & dairy",  emoji: "\uD83C\uDF57", color: "from-orange-500/20 to-red-500/10 border-orange-500/30" },
  { value: "veg",     label: "Vegetarian", desc: "Dairy & eggs, no meat", emoji: "\uD83E\uDD5A", color: "from-green-500/20 to-teal-500/10 border-green-500/30" },
  { value: "vegan",   label: "Vegan",    desc: "100% plant-based",    emoji: "\uD83C\uDF31", color: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30" },
];

const GOAL_OPTIONS = [
  { value: "weight loss",          label: "Lose Fat",       desc: "Calorie deficit",        emoji: "\uD83D\uDD25", color: "from-orange-500/20 to-red-500/10 border-orange-500/30" },
  { value: "muscle gain",          label: "Build Muscle",   desc: "Calorie surplus",        emoji: "\uD83D\uDCAA", color: "from-violet-500/20 to-blue-500/10 border-violet-500/30" },
  { value: "maintenance",          label: "Maintain",       desc: "Balanced calories",      emoji: "\u2696\uFE0F", color: "from-green-500/20 to-cyan-500/10 border-green-500/30" },
  { value: "recomposition",        label: "Recomposition",  desc: "Lose fat + gain muscle", emoji: "\uD83D\uDD04", color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30" },
  { value: "athletic performance", label: "Performance",    desc: "Peak athletic output",   emoji: "\u26A1",       color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30" },
  { value: "general fitness",      label: "General Fitness", desc: "Overall health",         emoji: "\u2764\uFE0F", color: "from-rose-500/20 to-pink-500/10 border-rose-500/30" },
  { value: "flexibility",          label: "Flexibility",    desc: "Mobility & recovery",    emoji: "\uD83E\uDDD8", color: "from-purple-500/20 to-violet-500/10 border-purple-500/30" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Sedentary",   desc: "Desk job, little movement",   emoji: "\uD83E\uDE91", factor: 1.2   },
  { value: "light",       label: "Light",       desc: "Walk 1\u20133 days/week",     emoji: "\uD83D\uDEB6", factor: 1.375 },
  { value: "moderate",    label: "Moderate",    desc: "Exercise 3\u20135 days/week",  emoji: "\uD83C\uDFCB\uFE0F", factor: 1.55  },
  { value: "active",      label: "Active",      desc: "Hard training 6\u20137 days",  emoji: "\u26A1",       factor: 1.725 },
  { value: "athlete",     label: "Athlete",     desc: "2x/day training or sports",   emoji: "\uD83C\uDFC6", factor: 1.9   },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner",     label: "Beginner",     desc: "Just getting started",   days: 3 },
  { value: "intermediate", label: "Intermediate", desc: "Training 1\u20132 years", days: 4 },
  { value: "advanced",     label: "Advanced",     desc: "3+ years of training",   days: 5 },
];

const COUNTRIES = [
  "USA", "India", "UK", "Canada", "Australia", "Japan", "Brazil", "Mexico",
  "Germany", "France", "South Korea", "Nigeria", "South Africa", "UAE", "Philippines",
];

interface PlanResult {
  bmr: number; tdee: number; calories: number; proteinG: number; carbsG: number; fatG: number;
  deficit: number; workoutDays: number; workoutSplit: string; workoutExercises: string[]; proteinFoods: string[];
}

function calculatePlan(form: FormData): PlanResult {
  const { age, gender, heightCm, weightKg, fitnessGoal, activityLevel, experienceLevel, dietPreference } = form;
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset);
  const activity = ACTIVITY_OPTIONS.find(a => a.value === activityLevel) ?? ACTIVITY_OPTIONS[2];
  const tdee = Math.round(bmr * activity.factor);

  let calories = tdee;
  let deficit = 0;
  if (fitnessGoal === "weight loss")           { calories = tdee - 500; deficit = -500; }
  if (fitnessGoal === "muscle gain")           { calories = tdee + 300; deficit = +300; }
  if (fitnessGoal === "athletic performance")  { calories = tdee + 200; deficit = +200; }
  if (fitnessGoal === "recomposition")         { calories = tdee - 100; deficit = -100; }

  const proteinG = Math.round(weightKg * 2.2);
  const fatG     = Math.round((calories * 0.25) / 9);
  const carbsG   = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  const exp = EXPERIENCE_OPTIONS.find(e => e.value === experienceLevel) ?? EXPERIENCE_OPTIONS[0];
  const workoutDays = exp.days;

  let workoutSplit: string;
  let workoutExercises: string[];

  if (experienceLevel === "beginner") {
    workoutSplit = "3 days/week \u00B7 Full Body";
    workoutExercises = ["Squats \u2014 3 \u00D7 10", "Push-ups \u2014 3 \u00D7 12", "Dumbbell Row \u2014 3 \u00D7 12 each side", "Overhead Press \u2014 3 \u00D7 10", "Plank \u2014 3 \u00D7 30 sec", "Lunges \u2014 3 \u00D7 10 each leg"];
  } else if (experienceLevel === "intermediate") {
    workoutSplit = "4 days/week \u00B7 Upper / Lower Split";
    workoutExercises = ["Upper A: Bench Press, Pull-ups, Shoulder Press, Bicep Curl", "Lower A: Squats, Romanian Deadlift, Leg Press, Calf Raises", "Upper B: Incline DB Press, Seated Row, Lateral Raise, Triceps", "Lower B: Bulgarian Split Squat, Hip Thrust, Leg Curl, Abs"];
  } else {
    workoutSplit = "5 days/week \u00B7 Push / Pull / Legs";
    workoutExercises = ["Push: Bench Press, Incline Press, Cable Fly, Tricep Pushdown", "Pull: Deadlift, Pull-ups, Seated Row, Face Pulls, Bicep Curl", "Legs: Squats, RDL, Leg Press, Leg Curl, Calf Raises", "Repeat Push & Pull with different variations on days 4\u20135"];
  }

  let proteinFoods: string[];
  if (dietPreference === "vegan") proteinFoods = ["Tofu", "Tempeh", "Lentils", "Chickpeas", "Edamame", "Seitan", "Hemp seeds"];
  else if (dietPreference === "veg") proteinFoods = ["Eggs", "Greek yoghurt", "Paneer", "Lentils", "Cottage cheese", "Chickpeas", "Milk"];
  else {
    const allNonVeg = ["Chicken breast", "Eggs", "Tuna", "Greek yoghurt", "Lean beef", "Salmon", "Whey protein"];
    proteinFoods = form.country === "India" ? allNonVeg.filter(f => f !== "Lean beef") : allNonVeg;
  }

  return { bmr, tdee, calories, proteinG, carbsG, fatG, deficit, workoutDays, workoutSplit, workoutExercises, proteinFoods };
}

interface FormData {
  name: string; age: number; gender: string; heightCm: number; weightKg: number;
  fitnessGoal: string; activityLevel: string; experienceLevel: string; dietPreference: string; country: string;
  cycleRegularity: string; periodStartDate: string; periodEndDate: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ageStr, setAgeStr] = useState("25");

  // Load pre-filled data from signup flow if available
  const getInitialForm = (): FormData => {
    const pending = localStorage.getItem("cfx_pending_profile");
    const pendingData = pending ? (() => { try { return JSON.parse(pending); } catch { return null; } })() : null;
    return {
      name:            (pendingData?.firstName || user?.firstName) ?? "",
      age:             pendingData?.age ?? 25,
      gender:          pendingData?.gender ?? "male",
      heightCm:        pendingData?.heightCm ?? 170,
      weightKg:        pendingData?.weightKg ?? 70,
      fitnessGoal:     pendingData?.fitnessGoal ?? "muscle gain",
      activityLevel:   pendingData?.activityLevel ?? "moderate",
      experienceLevel: "beginner",
      dietPreference:  "non-veg",
      country:         "USA",
      cycleRegularity: "regular",
      periodStartDate: "",
      periodEndDate:   "",
    };
  };

  const initialForm = getInitialForm();
  const [form, setForm] = useState<FormData>(initialForm);
  const [heightStr, setHeightStr] = useState(String(initialForm.heightCm));
  const [weightStr, setWeightStr] = useState(String(initialForm.weightKg));
  
  // Clear pending profile after onboarding completes
  const clearPendingProfile = () => {
    localStorage.removeItem("cfx_pending_profile");
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const { mutate: createProfile, isPending } = useCreateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: ["/api/profile"] });
        setLocation("/");
      },
      onError: () => setError("Failed to save. Please try again."),
    },
  });

  const canProceed = () => {
    if (step === 0) return form.name.trim().length >= 2 && form.age >= 10 && form.age <= 100 && !!form.gender && !!form.dietPreference;
    if (step === 1) return form.heightCm >= 100 && form.heightCm <= 250 && form.weightKg >= 20 && form.weightKg <= 300;
    return true;
  };

  const handleFinish = () => {
    setError(null);
    clearPendingProfile();
    const actMap: Record<string, string> = { active: "very active", athlete: "athlete" };
    const payload = { ...form, activityLevel: actMap[form.activityLevel] ?? form.activityLevel };
    createProfile({ data: payload });
  };

  const plan = step === 2 ? calculatePlan(form) : null;

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}>
            <img src="/logo.jpeg" alt="CaloForgeX" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-display font-black text-white">
            Calo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Forge</span><span className="text-cyan-400">X</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Let's personalize your experience</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : i === step ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                : "bg-white/5 border border-white/10 text-white/30"
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 rounded-full transition-all duration-500 ${i < step ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.04] border border-white/8 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center"><Icon className="w-5 h-5 text-violet-400" /></div>; })()}
              <div>
                <h2 className="font-display font-bold text-lg text-white">{STEPS[step].title}</h2>
                <p className="text-xs text-white/40">{STEPS[step].subtitle}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, ease: "easeOut" }}>

                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Your Name</label>
                      <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Alex Johnson"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white placeholder:text-white/20 text-sm transition-colors" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Age</label>
                      <input type="text" inputMode="numeric" value={ageStr}
                        onChange={e => { setAgeStr(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v > 0 && v <= 120) set("age", v); }}
                        onBlur={() => setAgeStr(String(form.age))}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Gender</label>
                      <div className="grid grid-cols-2 gap-3">
                        {GENDER_OPTIONS.map(g => {
                          const isFemale = g.value === "female";
                          const isSelected = form.gender === g.value;
                          return (
                            <motion.button
                              key={g.value}
                              type="button"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => set("gender", g.value)}
                              className={`py-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                                isSelected && isFemale
                                  ? "border-pink-400/60 shadow-[0_0_16px_rgba(255,182,193,0.25)]"
                                  : isSelected
                                  ? "bg-violet-600/30 border-violet-500/60 text-violet-300 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                                  : "bg-white/3 border-white/8 text-white/50 hover:bg-white/8"
                              }`}
                              style={isSelected && isFemale ? { background: "linear-gradient(135deg, rgba(255,182,193,0.18), rgba(236,72,153,0.08))", color: "#FFB6C1" } : {}}
                            >
                              <span className="block text-2xl mb-1">{g.emoji}</span>
                              {g.label}
                            </motion.button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {form.gender === "female" && (
                          <motion.div
                            key="cycle-section"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="mt-4 rounded-2xl border overflow-hidden"
                            style={{ background: "linear-gradient(135deg, rgba(190,24,93,0.12), rgba(157,23,77,0.08))", borderColor: "rgba(190,24,93,0.35)" }}
                          >
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4" style={{ color: "#f472b6" }} />
                                <p className="text-sm font-semibold" style={{ color: "#f472b6" }}>Cycle Information</p>
                              </div>
                              <div>
                                <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(244,114,182,0.6)" }}>Cycle Regularity</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["regular", "irregular"].map(r => (
                                    <button key={r} type="button" onClick={() => set("cycleRegularity", r)}
                                      className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                                        form.cycleRegularity === r
                                          ? ""
                                          : "bg-black/20 text-white/40 hover:bg-black/30"
                                      }`}
                                      style={form.cycleRegularity === r
                                        ? { background: "rgba(190,24,93,0.25)", borderColor: "rgba(190,24,93,0.6)", color: "#f472b6" }
                                        : { borderColor: "rgba(190,24,93,0.2)" }}
                                    >{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs font-semibold mb-1 flex items-center gap-1 block" style={{ color: "rgba(244,114,182,0.6)" }}>
                                    <Calendar className="w-3 h-3" /> Last Period Start
                                  </label>
                                  <input type="date" value={form.periodStartDate} onChange={e => set("periodStartDate", e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl outline-none text-xs text-white [color-scheme:dark] transition-colors"
                                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(190,24,93,0.25)" }}
                                    onFocus={e => (e.target.style.borderColor = "rgba(190,24,93,0.6)")}
                                    onBlur={e => (e.target.style.borderColor = "rgba(190,24,93,0.25)")} />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold mb-1 flex items-center gap-1 block" style={{ color: "rgba(244,114,182,0.6)" }}>
                                    <Calendar className="w-3 h-3" /> Last Period End
                                  </label>
                                  <input type="date" value={form.periodEndDate} onChange={e => set("periodEndDate", e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl outline-none text-xs text-white [color-scheme:dark] transition-colors"
                                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(190,24,93,0.25)" }}
                                    onFocus={e => (e.target.style.borderColor = "rgba(190,24,93,0.6)")}
                                    onBlur={e => (e.target.style.borderColor = "rgba(190,24,93,0.25)")} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Diet Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {DIET_OPTIONS.map(d => (
                          <button key={d.value} type="button" onClick={() => set("dietPreference", d.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              form.dietPreference === d.value ? `bg-gradient-to-br ${d.color}` : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}>
                            <span className="text-xl block mb-1">{d.emoji}</span>
                            <p className="text-xs font-semibold text-white leading-tight">{d.label}</p>
                            <p className="text-[9px] text-white/35 mt-0.5 leading-tight">{d.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Country</label>
                      <div className="relative">
                        <select value={form.country} onChange={e => set("country", e.target.value)}
                          className="w-full appearance-none px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors pr-10 [color-scheme:dark]">
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Height</label>
                        <div className="relative">
                          <input type="text" inputMode="decimal" value={heightStr}
                            onChange={e => { setHeightStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) set("heightCm", v); }}
                            onBlur={() => setHeightStr(String(form.heightCm))}
                            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">cm</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-1">{Math.floor(form.heightCm / 30.48)}' {Math.round((form.heightCm % 30.48) / 2.54)}"</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Weight</label>
                        <div className="relative">
                          <input type="text" inputMode="decimal" value={weightStr}
                            onChange={e => { setWeightStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) set("weightKg", v); }}
                            onBlur={() => setWeightStr(String(form.weightKg))}
                            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">kg</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-1">{"\u2248"} {Math.round(form.weightKg * 2.205)} lbs</p>
                      </div>
                    </div>

                    {form.heightCm > 0 && form.weightKg > 0 && (
                      <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/15">
                        {(() => {
                          const bmi = form.weightKg / ((form.heightCm / 100) ** 2);
                          const [cat, col] = bmi < 18.5 ? ["Underweight","text-blue-400"] : bmi < 25 ? ["Normal","text-green-400"] : bmi < 30 ? ["Overweight","text-yellow-400"] : ["Obese","text-red-400"];
                          return (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/40">BMI</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${col}`}>{bmi.toFixed(1)}</span>
                                <span className={`text-xs ${col}`}>{"\u00B7"} {cat}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Primary Goal</label>
                      <div className="grid grid-cols-2 gap-2">
                        {GOAL_OPTIONS.map(g => (
                          <button key={g.value} type="button" onClick={() => set("fitnessGoal", g.value)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              form.fitnessGoal === g.value ? `bg-gradient-to-br ${g.color}` : "bg-white/3 border-white/8 hover:bg-white/6"
                            }`}>
                            <span className="text-lg block mb-0.5">{g.emoji}</span>
                            <p className="text-xs font-semibold text-white">{g.label}</p>
                            <p className="text-[9px] text-white/40 mt-0.5">{g.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Activity Level</label>
                      <div className="space-y-1.5">
                        {ACTIVITY_OPTIONS.map(a => (
                          <button key={a.value} type="button" onClick={() => set("activityLevel", a.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              form.activityLevel === a.value
                                ? "bg-violet-600/20 border-violet-500/40 text-white"
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}>
                            <span className="text-base shrink-0">{a.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{a.label}</p>
                              <p className="text-[10px] text-white/35">{a.desc}</p>
                            </div>
                            {form.activityLevel === a.value && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPERIENCE_OPTIONS.map(e => {
                          const isSelected = form.experienceLevel === e.value;
                          const styles: Record<string, { active: string; glow: string; dot: string }> = {
                            beginner:     { active: "bg-blue-600/20 border-blue-500/50 text-blue-300", glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]", dot: "bg-blue-400" },
                            intermediate: { active: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300", glow: "shadow-[0_0_12px_rgba(234,179,8,0.3)]", dot: "bg-yellow-400" },
                            advanced:     { active: "bg-red-600/20 border-red-500/50 text-red-300", glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]", dot: "bg-red-400" },
                          };
                          const s = styles[e.value];
                          return (
                            <motion.button key={e.value} type="button"
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => set("experienceLevel", e.value)}
                              className={`py-3 px-2 rounded-xl border text-center transition-all ${
                                isSelected ? `${s.active} ${s.glow}` : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                              }`}>
                              {isSelected && <div className={`w-2 h-2 rounded-full ${s.dot} mx-auto mb-1`} />}
                              <p className="text-sm font-bold">{e.label}</p>
                              <p className="text-[9px] text-white/35 mt-0.5">{e.desc}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && plan && (
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl overflow-hidden p-5"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(124,58,237,0.8) 0%, transparent 60%)" }} />
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-3 shadow-[0_0_16px_rgba(124,58,237,0.5)]">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-display font-black text-lg text-white leading-snug mb-1">
                          Welcome to your<br />transformation journey.
                        </p>
                        <p className="text-sm text-white/60 leading-relaxed">
                          We help you stay consistent, build strength, and become your best version — one day at a time.
                        </p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {["Stay Consistent", "Build Strength", "Track Progress"].map(tag => (
                            <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Calories", value: `${plan.calories}`, unit: "kcal/day", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
                        { label: "Protein", value: `${plan.proteinG}g`, unit: "per day", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
                        { label: "Carbs", value: `${plan.carbsG}g`, unit: "per day", color: "text-green-400", bg: "bg-green-500/10 border-green-500/15" },
                      ].map(({ label, value, unit, color, bg }) => (
                        <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                          <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-white/40">{label}</p>
                          <p className="text-[9px] text-white/25">{unit}</p>
                        </div>
                      ))}
                    </div>

                    {plan.deficit !== 0 && (
                      <div className={`rounded-xl p-3 flex items-center gap-2 ${plan.deficit < 0 ? "bg-orange-500/10 border border-orange-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
                        {plan.deficit < 0 ? <TrendingDown className="w-4 h-4 text-orange-400" /> : <TrendingUp className="w-4 h-4 text-green-400" />}
                        <p className="text-xs">
                          <span className="font-semibold">{Math.abs(plan.deficit)} kcal {plan.deficit < 0 ? "deficit" : "surplus"}</span>
                          <span className="text-white/40"> from your TDEE of {plan.tdee} kcal</span>
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl bg-white/4 border border-white/5 p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Top Protein Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.proteinFoods.map(f => (
                          <span key={f} className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-300">{f}</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-center text-xs text-white/30 pt-1">
                      🔥 {plan.workoutDays} training days/week · {plan.workoutSplit.split("·")[1]?.trim() || "Your program"}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" onClick={() => canProceed() && setStep(s => s + 1)} disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleFinish} disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending ? "Creating..." : <><CheckCircle2 className="w-4 h-4" /> Start Training</>}
              </button>
            )}
          </div>

          {error && (
            <p className="px-6 pb-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
