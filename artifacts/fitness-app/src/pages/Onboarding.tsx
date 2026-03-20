import { useState } from "react";
import { useCreateProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Dumbbell, Target, Flame, ChevronRight, ChevronLeft,
  User, Ruler, Scale, Activity, Zap, CheckCircle2
} from "lucide-react";

const STEPS = [
  { id: "basics", title: "About You", subtitle: "Let's start with the basics", icon: User },
  { id: "body", title: "Body Stats", subtitle: "We'll calculate your targets", icon: Scale },
  { id: "goals", title: "Your Goals", subtitle: "What are you aiming for?", icon: Target },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male", emoji: "♂️" },
  { value: "female", label: "Female", emoji: "♀️" },
  { value: "other", label: "Other", emoji: "⚧️" },
];

const GOAL_OPTIONS = [
  { value: "weight loss", label: "Lose Weight", desc: "Burn fat, feel lighter", emoji: "🔥", color: "from-orange-500/20 to-red-500/10 border-orange-500/30" },
  { value: "muscle gain", label: "Build Muscle", desc: "Get stronger, bulk up", emoji: "💪", color: "from-violet-500/20 to-blue-500/10 border-violet-500/30" },
  { value: "maintenance", label: "Stay Fit", desc: "Maintain current shape", emoji: "⚖️", color: "from-green-500/20 to-cyan-500/10 border-green-500/30" },
  { value: "endurance", label: "Endurance", desc: "Run farther, last longer", emoji: "🏃", color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, little movement", emoji: "🪑" },
  { value: "light", label: "Light", desc: "Walk 1–3 days/week", emoji: "🚶" },
  { value: "moderate", label: "Moderate", desc: "Exercise 3–5 days/week", emoji: "🏋️" },
  { value: "very active", label: "Very Active", desc: "Hard training 6–7 days", emoji: "⚡" },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "Just getting started" },
  { value: "intermediate", label: "Intermediate", desc: "Training 1–2 years" },
  { value: "advanced", label: "Advanced", desc: "3+ years of training" },
];

interface FormData {
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  fitnessGoal: string;
  experienceLevel: string;
  activityLevel: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: user?.firstName || "",
    age: 25,
    gender: "male",
    heightCm: 170,
    weightKg: 70,
    fitnessGoal: "muscle gain",
    experienceLevel: "beginner",
    activityLevel: "moderate",
  });

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const { mutate: createProfile, isPending } = useCreateProfile({
    mutation: {
      onSuccess: () => setLocation("/"),
      onError: () => setError("Failed to save. Please try again."),
    },
  });

  const canProceed = () => {
    if (step === 0) return form.name.trim().length >= 2 && form.age >= 10 && form.age <= 100 && form.gender;
    if (step === 1) return form.heightCm >= 100 && form.heightCm <= 250 && form.weightKg >= 20 && form.weightKg <= 300;
    return true;
  };

  const handleFinish = () => {
    setError(null);
    createProfile({ data: form });
  };

  const slideDir = 1;

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden px-4 py-8">
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
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}
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

        {/* Card */}
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

          <div className="p-6 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 * slideDir }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 * slideDir }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Your Name</label>
                      <input
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white placeholder:text-white/20 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Age</label>
                      <input
                        type="number"
                        min={10} max={100}
                        value={form.age}
                        onChange={e => set("age", parseInt(e.target.value) || 25)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Gender</label>
                      <div className="grid grid-cols-3 gap-2">
                        {GENDER_OPTIONS.map(g => (
                          <button
                            key={g.value}
                            type="button"
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
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Height (cm)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={100} max={250}
                          value={form.heightCm}
                          onChange={e => set("heightCm", parseFloat(e.target.value) || 170)}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">cm</span>
                      </div>
                      <p className="text-[11px] text-white/25 mt-1.5">≈ {Math.floor(form.heightCm / 30.48)}' {Math.round((form.heightCm % 30.48) / 2.54)}"</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Weight (kg)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={20} max={300}
                          step={0.5}
                          value={form.weightKg}
                          onChange={e => set("weightKg", parseFloat(e.target.value) || 70)}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">kg</span>
                      </div>
                      <p className="text-[11px] text-white/25 mt-1.5">≈ {Math.round(form.weightKg * 2.205)} lbs</p>
                    </div>

                    {/* Live BMI preview */}
                    {form.heightCm > 0 && form.weightKg > 0 && (
                      <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/15">
                        {(() => {
                          const bmi = form.weightKg / ((form.heightCm / 100) ** 2);
                          const cat = bmi < 18.5 ? ["Underweight", "text-blue-400"] : bmi < 25 ? ["Normal", "text-green-400"] : bmi < 30 ? ["Overweight", "text-yellow-400"] : ["Obese", "text-red-400"];
                          return (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/40">Your BMI</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${cat[1]}`}>{bmi.toFixed(1)}</span>
                                <span className={`text-xs ${cat[1]}`}>· {cat[0]}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Primary Goal</label>
                      <div className="grid grid-cols-2 gap-2">
                        {GOAL_OPTIONS.map(g => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => set("fitnessGoal", g.value)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              form.fitnessGoal === g.value
                                ? `bg-gradient-to-br ${g.color}`
                                : "bg-white/3 border-white/8 hover:bg-white/6"
                            }`}
                          >
                            <span className="text-xl block mb-1">{g.emoji}</span>
                            <p className="text-sm font-semibold text-white">{g.label}</p>
                            <p className="text-[10px] text-white/40">{g.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Activity Level</label>
                      <div className="space-y-1.5">
                        {ACTIVITY_OPTIONS.map(a => (
                          <button
                            key={a.value}
                            type="button"
                            onClick={() => set("activityLevel", a.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              form.activityLevel === a.value
                                ? "bg-violet-600/20 border-violet-500/40 text-white"
                                : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6"
                            }`}
                          >
                            <span className="text-lg shrink-0">{a.emoji}</span>
                            <div>
                              <p className="text-sm font-semibold">{a.label}</p>
                              <p className="text-[10px] text-white/35">{a.desc}</p>
                            </div>
                            {form.activityLevel === a.value && <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPERIENCE_OPTIONS.map(e => (
                          <button
                            key={e.value}
                            type="button"
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
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {isPending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Flame className="w-4 h-4" /> Start My Journey</>
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
