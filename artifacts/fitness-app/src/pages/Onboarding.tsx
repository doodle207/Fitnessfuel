import { useState } from "react";
import { useCreateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Dumbbell, Target, Flame, ChevronRight, ChevronLeft,
  User, Scale, CheckCircle2, Salad, Activity, Zap, Trophy,
  TrendingDown, TrendingUp, Minus, Apple, Beef, Wheat
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: "basics",  title: "About You",    subtitle: "Let's start with the basics",    icon: User   },
  { id: "body",    title: "Body & Goals", subtitle: "We'll calculate your targets",   icon: Scale  },
  { id: "plan",    title: "Your Plan",    subtitle: "Personalized just for you",      icon: Target },
];

const GENDER_OPTIONS = [
  { value: "male",   label: "Male",   emoji: "♂️" },
  { value: "female", label: "Female", emoji: "♀️" },
  { value: "other",  label: "Other",  emoji: "⚧️" },
];

const DIET_OPTIONS = [
  { value: "non-veg", label: "Non-Veg",  desc: "Meat, fish & dairy",  emoji: "🍗", color: "from-orange-500/20 to-red-500/10 border-orange-500/30" },
  { value: "veg",     label: "Vegetarian", desc: "Dairy & eggs, no meat", emoji: "🥚", color: "from-green-500/20 to-teal-500/10 border-green-500/30" },
  { value: "vegan",   label: "Vegan",    desc: "100% plant-based",    emoji: "🌱", color: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30" },
];

const GOAL_OPTIONS = [
  { value: "weight loss",  label: "Lose Fat",      desc: "Calorie deficit",       emoji: "🔥", color: "from-orange-500/20 to-red-500/10 border-orange-500/30" },
  { value: "muscle gain",  label: "Build Muscle",  desc: "Calorie surplus",       emoji: "💪", color: "from-violet-500/20 to-blue-500/10 border-violet-500/30" },
  { value: "maintenance",  label: "Maintain",      desc: "Balanced calories",     emoji: "⚖️", color: "from-green-500/20 to-cyan-500/10 border-green-500/30" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Sedentary",   desc: "Desk job, little movement",   emoji: "🪑", factor: 1.2   },
  { value: "light",       label: "Light",       desc: "Walk 1–3 days/week",          emoji: "🚶", factor: 1.375 },
  { value: "moderate",    label: "Moderate",    desc: "Exercise 3–5 days/week",      emoji: "🏋️", factor: 1.55  },
  { value: "active",      label: "Active",      desc: "Hard training 6–7 days",      emoji: "⚡", factor: 1.725 },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner",     label: "Beginner",     desc: "Just getting started",   days: 3 },
  { value: "intermediate", label: "Intermediate", desc: "Training 1–2 years",     days: 4 },
  { value: "advanced",     label: "Advanced",     desc: "3+ years of training",   days: 5 },
];

// ─── Calculation logic ────────────────────────────────────────────────────────

interface PlanResult {
  bmr:       number;
  tdee:      number;
  calories:  number;
  proteinG:  number;
  carbsG:    number;
  fatG:      number;
  deficit:   number; // negative = deficit, positive = surplus, 0 = maintenance
  workoutDays: number;
  workoutSplit: string;
  workoutExercises: string[];
  proteinFoods: string[];
}

function calculatePlan(form: FormData): PlanResult {
  const { age, gender, heightCm, weightKg, fitnessGoal, activityLevel, experienceLevel, dietPreference } = form;

  // BMR — Mifflin-St Jeor equation
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78; // other = average
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset);

  // TDEE
  const activity = ACTIVITY_OPTIONS.find(a => a.value === activityLevel) ?? ACTIVITY_OPTIONS[2];
  const tdee = Math.round(bmr * activity.factor);

  // Goal-based calorie target
  let calories = tdee;
  let deficit = 0;
  if (fitnessGoal === "weight loss")  { calories = tdee - 500; deficit = -500; }
  if (fitnessGoal === "muscle gain")  { calories = tdee + 300; deficit = +300; }

  // Macros
  const proteinG = Math.round(weightKg * 2);           // 2g per kg
  const fatG     = Math.round((calories * 0.25) / 9);  // 25% of calories from fat
  const carbsG   = Math.round((calories - proteinG * 4 - fatG * 9) / 4); // remaining

  // Workout plan by experience
  const exp = EXPERIENCE_OPTIONS.find(e => e.value === experienceLevel) ?? EXPERIENCE_OPTIONS[0];
  const workoutDays = exp.days;

  let workoutSplit: string;
  let workoutExercises: string[];

  if (experienceLevel === "beginner") {
    workoutSplit = "3 days/week · Full Body";
    workoutExercises = [
      "Squats — 3 × 10",
      "Push-ups — 3 × 12",
      "Dumbbell Row — 3 × 12 each side",
      "Overhead Press — 3 × 10",
      "Plank — 3 × 30 sec",
      "Lunges — 3 × 10 each leg",
    ];
  } else if (experienceLevel === "intermediate") {
    workoutSplit = "4 days/week · Upper / Lower Split";
    workoutExercises = [
      "Upper A: Bench Press, Pull-ups, Shoulder Press, Bicep Curl",
      "Lower A: Squats, Romanian Deadlift, Leg Press, Calf Raises",
      "Upper B: Incline DB Press, Seated Row, Lateral Raise, Triceps",
      "Lower B: Bulgarian Split Squat, Hip Thrust, Leg Curl, Abs",
    ];
  } else {
    workoutSplit = "5 days/week · Push / Pull / Legs";
    workoutExercises = [
      "Push: Bench Press, Incline Press, Cable Fly, Tricep Pushdown",
      "Pull: Deadlift, Pull-ups, Seated Row, Face Pulls, Bicep Curl",
      "Legs: Squats, RDL, Leg Press, Leg Curl, Calf Raises",
      "Repeat Push & Pull with different variations on days 4–5",
    ];
  }

  // Protein food suggestions by diet preference
  let proteinFoods: string[];
  if (dietPreference === "vegan") {
    proteinFoods = ["Tofu", "Tempeh", "Lentils", "Chickpeas", "Edamame", "Seitan", "Hemp seeds"];
  } else if (dietPreference === "veg") {
    proteinFoods = ["Eggs", "Greek yoghurt", "Paneer", "Lentils", "Cottage cheese", "Chickpeas", "Milk"];
  } else {
    proteinFoods = ["Chicken breast", "Eggs", "Tuna", "Greek yoghurt", "Lean beef", "Salmon", "Whey protein"];
  }

  return { bmr, tdee, calories, proteinG, carbsG, fatG, deficit, workoutDays, workoutSplit, workoutExercises, proteinFoods };
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  fitnessGoal: string;
  activityLevel: string;
  experienceLevel: string;
  dietPreference: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name:            user?.firstName ?? "",
    age:             25,
    gender:          "male",
    heightCm:        170,
    weightKg:        70,
    fitnessGoal:     "muscle gain",
    activityLevel:   "moderate",
    experienceLevel: "beginner",
    dietPreference:  "non-veg",
  });

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const { mutate: createProfile, isPending } = useCreateProfile({
    mutation: {
      onSuccess: () => {
        // Clear the cached 404 so AuthGuard knows the profile now exists
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
    // Map "active" back to "very active" for DB compatibility, keep others as-is
    const payload = { ...form, activityLevel: form.activityLevel === "active" ? "very active" : form.activityLevel };
    createProfile({ data: payload });
  };

  const plan = step === 2 ? calculatePlan(form) : null;

  const goalIcon = form.fitnessGoal === "weight loss"
    ? <TrendingDown className="w-4 h-4 text-orange-400" />
    : form.fitnessGoal === "muscle gain"
      ? <TrendingUp className="w-4 h-4 text-violet-400" />
      : <Minus className="w-4 h-4 text-green-400" />;

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}
          >
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-black text-white">
            FitTrack<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Pro</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Let's personalize your experience</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step  ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
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

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center"><Icon className="w-5 h-5 text-violet-400" /></div>; })()}
              <div>
                <h2 className="font-display font-bold text-lg text-white">{STEPS[step].title}</h2>
                <p className="text-xs text-white/40">{STEPS[step].subtitle}</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >

                {/* ── STEP 0: About You ── */}
                {step === 0 && (
                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Your Name</label>
                      <input
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white placeholder:text-white/20 text-sm transition-colors"
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Age</label>
                      <input
                        type="number" min={10} max={100}
                        value={form.age}
                        onChange={e => set("age", parseInt(e.target.value) || 25)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Gender</label>
                      <div className="grid grid-cols-3 gap-2">
                        {GENDER_OPTIONS.map(g => (
                          <button
                            key={g.value} type="button"
                            onClick={() => set("gender", g.value)}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                              form.gender === g.value
                                ? "bg-violet-600/30 border-violet-500/60 text-violet-300 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/8"
                            }`}
                          >
                            <span className="block text-lg mb-0.5">{g.emoji}</span>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Diet preference */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Diet Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {DIET_OPTIONS.map(d => (
                          <button
                            key={d.value} type="button"
                            onClick={() => set("dietPreference", d.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              form.dietPreference === d.value
                                ? `bg-gradient-to-br ${d.color}`
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}
                          >
                            <span className="text-xl block mb-1">{d.emoji}</span>
                            <p className="text-xs font-semibold text-white leading-tight">{d.label}</p>
                            <p className="text-[9px] text-white/35 mt-0.5 leading-tight">{d.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Body & Goals ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    {/* Height + Weight row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Height</label>
                        <div className="relative">
                          <input
                            type="number" min={100} max={250}
                            value={form.heightCm}
                            onChange={e => set("heightCm", parseFloat(e.target.value) || 170)}
                            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">cm</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-1">{Math.floor(form.heightCm / 30.48)}' {Math.round((form.heightCm % 30.48) / 2.54)}"</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Weight</label>
                        <div className="relative">
                          <input
                            type="number" min={20} max={300} step={0.5}
                            value={form.weightKg}
                            onChange={e => set("weightKg", parseFloat(e.target.value) || 70)}
                            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">kg</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-1">≈ {Math.round(form.weightKg * 2.205)} lbs</p>
                      </div>
                    </div>

                    {/* Live BMI */}
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
                                <span className={`text-xs ${col}`}>· {cat}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Fitness Goal */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Primary Goal</label>
                      <div className="grid grid-cols-3 gap-2">
                        {GOAL_OPTIONS.map(g => (
                          <button
                            key={g.value} type="button"
                            onClick={() => set("fitnessGoal", g.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              form.fitnessGoal === g.value
                                ? `bg-gradient-to-br ${g.color}`
                                : "bg-white/3 border-white/8 hover:bg-white/6"
                            }`}
                          >
                            <span className="text-xl block mb-1">{g.emoji}</span>
                            <p className="text-xs font-semibold text-white">{g.label}</p>
                            <p className="text-[9px] text-white/40 mt-0.5">{g.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Activity Level</label>
                      <div className="space-y-1.5">
                        {ACTIVITY_OPTIONS.map(a => (
                          <button
                            key={a.value} type="button"
                            onClick={() => set("activityLevel", a.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              form.activityLevel === a.value
                                ? "bg-violet-600/20 border-violet-500/40 text-white"
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}
                          >
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

                    {/* Experience Level */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPERIENCE_OPTIONS.map(e => (
                          <button
                            key={e.value} type="button"
                            onClick={() => set("experienceLevel", e.value)}
                            className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                              form.experienceLevel === e.value
                                ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-300"
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}
                          >
                            <p className="text-xs font-semibold">{e.label}</p>
                            <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{e.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Your Plan ── */}
                {step === 2 && plan && (
                  <div className="space-y-4">
                    {/* Calorie target hero */}
                    <div
                      className="p-4 rounded-2xl text-center"
                      style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.25)" }}
                    >
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Daily Calorie Target</p>
                      <p className="text-4xl font-black text-white">{plan.calories.toLocaleString()}</p>
                      <p className="text-xs text-white/40 mt-1">kcal / day</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {goalIcon}
                        <span className="text-xs text-white/50">
                          {plan.deficit === 0
                            ? "Maintenance — TDEE matched"
                            : plan.deficit > 0
                              ? `+${plan.deficit} kcal surplus above TDEE`
                              : `${Math.abs(plan.deficit)} kcal deficit below TDEE`}
                        </span>
                      </div>
                    </div>

                    {/* BMR / TDEE row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8 text-center">
                        <p className="text-[10px] text-white/35 uppercase tracking-wider">BMR</p>
                        <p className="text-lg font-bold text-white mt-0.5">{plan.bmr.toLocaleString()}</p>
                        <p className="text-[10px] text-white/30">kcal at rest</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8 text-center">
                        <p className="text-[10px] text-white/35 uppercase tracking-wider">TDEE</p>
                        <p className="text-lg font-bold text-white mt-0.5">{plan.tdee.toLocaleString()}</p>
                        <p className="text-[10px] text-white/30">with activity</p>
                      </div>
                    </div>

                    {/* Macros */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Daily Macros</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                          <Beef className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-blue-300">{plan.proteinG}g</p>
                          <p className="text-[10px] text-white/35">Protein</p>
                          <p className="text-[9px] text-white/20 mt-0.5">2g / kg BW</p>
                        </div>
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                          <Wheat className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-yellow-300">{plan.carbsG}g</p>
                          <p className="text-[10px] text-white/35">Carbs</p>
                          <p className="text-[9px] text-white/20 mt-0.5">remaining cal</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                          <Apple className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-orange-300">{plan.fatG}g</p>
                          <p className="text-[10px] text-white/35">Fat</p>
                          <p className="text-[9px] text-white/20 mt-0.5">25% of cal</p>
                        </div>
                      </div>
                    </div>

                    {/* Workout plan */}
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-violet-400" />
                        <p className="text-xs font-semibold text-white/70">Workout Plan</p>
                        <span className="ml-auto text-[10px] text-cyan-400 font-semibold">{plan.workoutSplit}</span>
                      </div>
                      <ul className="space-y-1">
                        {plan.workoutExercises.map((ex, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                            <span className="text-violet-400 mt-0.5 shrink-0">›</span>{ex}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Protein food suggestions */}
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                      <div className="flex items-center gap-2 mb-2">
                        <Salad className="w-4 h-4 text-green-400" />
                        <p className="text-xs font-semibold text-white/70">Top Protein Sources</p>
                        <span className="ml-auto text-[10px] text-green-400 capitalize">{form.dietPreference}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.proteinFoods.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-300">{f}</span>
                        ))}
                      </div>
                    </div>

                    {/* Calculation note */}
                    <p className="text-[10px] text-white/20 text-center leading-relaxed">
                      Calculated using Mifflin-St Jeor (BMR) · TDEE = BMR × {ACTIVITY_OPTIONS.find(a => a.value === form.activityLevel)?.factor ?? 1.55} activity factor<br />
                      Protein 2g/kg · Fat 25% · Carbs from remaining calories
                    </p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => canProceed() && setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 shadow-[0_0_16px_rgba(124,58,237,0.3)]"
              >
                {step === 1 ? <><Zap className="w-4 h-4" /> See My Plan</> : <><ChevronRight className="w-4 h-4" /> Continue</>}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
              >
                {isPending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Trophy className="w-4 h-4" /> Start My Journey</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-5">
          You can update these details anytime in your Profile
        </p>
      </motion.div>
    </div>
  );
}
