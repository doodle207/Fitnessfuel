import { useState } from "react";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/ui/LoadingState";
import { useCreateWorkout, useGetExercises } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Dumbbell, Activity, Play, Calendar, ChevronDown, CheckCircle2,
  Timer, Zap, Target, Info, RotateCcw, X, ChevronRight
} from "lucide-react";

const muscleGroups = [
  { id: "Chest", color: "from-blue-500 to-cyan-500", emoji: "💪", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop" },
  { id: "Back", color: "from-violet-500 to-purple-500", emoji: "🏋️", image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=500&h=300&fit=crop" },
  { id: "Legs", color: "from-orange-500 to-red-500", emoji: "🦵", image: "https://images.unsplash.com/photo-1434652092654-250ad142a5bc?w=500&h=300&fit=crop" },
  { id: "Shoulders", color: "from-emerald-500 to-teal-500", emoji: "🎯", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=300&fit=crop" },
  { id: "Arms", color: "from-pink-500 to-rose-500", emoji: "💪", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop" },
  { id: "Core", color: "from-yellow-500 to-orange-500", emoji: "⚡", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=300&fit=crop" },
  { id: "Cardio", color: "from-cyan-500 to-sky-500", emoji: "🏃", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&h=300&fit=crop" },
  { id: "Full Body", color: "from-gray-600 to-gray-900", emoji: "🔥", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=500&h=300&fit=crop" },
];

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string; rom: string }> = {
  Beginner: { sets: "3", reps: "12–15", rest: "60 seconds", focus: "Learn the movement pattern and build a foundation. Use light weight.", tempo: "2-0-2", rom: "Full range — slow and controlled. Never sacrifice form for weight." },
  Intermediate: { sets: "4", reps: "8–12", focus: "Hypertrophy — keep tension on the muscle throughout every rep.", rest: "60–90 seconds", tempo: "3-1-2", rom: "Full stretch at the bottom, squeeze hard at the top. Avoid momentum." },
  Advanced: { sets: "5", reps: "4–8", rest: "2–3 minutes", focus: "Strength & power. Push maximal load with perfect form.", tempo: "2-1-1 (explosive concentric)", rom: "Controlled eccentric, powerful concentric. Full ROM every rep." },
};

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  secondaryMuscles?: string | null;
  equipment?: string | null;
  instructions?: string | null;
  difficulty?: string | null;
  isFavorite?: boolean;
}

function ExerciseDetailCard({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const scheme = repSchemes[exercise.difficulty ?? "Intermediate"] ?? repSchemes.Intermediate;
  const steps = (exercise.instructions ?? "").split(". ").filter(Boolean).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-3 rounded-2xl border border-primary/40 bg-black/60 backdrop-blur overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="font-display font-bold text-base text-white">{exercise.name}</h4>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Targets */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-3 py-1">
            <Target className="w-3 h-3" /> {exercise.muscleGroup}
          </span>
          {exercise.secondaryMuscles && exercise.secondaryMuscles.split(",").slice(0, 3).map(m => (
            <span key={m} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-muted-foreground">{m.trim()}</span>
          ))}
          {exercise.equipment && (
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1">{exercise.equipment}</span>
          )}
        </div>

        {/* How To Do */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> How To Do It
          </p>
          <ul className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-muted-foreground leading-snug">{step.trim()}{step.endsWith('.') ? '' : '.'}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reps & Sets */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-muted-foreground mb-1">Sets</p>
            <p className="font-bold text-white text-lg">{scheme.sets}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-muted-foreground mb-1">Reps</p>
            <p className="font-bold text-white text-lg">{scheme.reps}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><Timer className="w-3 h-3" />Rest</p>
            <p className="font-bold text-white text-sm">{scheme.rest}</p>
          </div>
        </div>

        {/* Range of Motion */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Range of Motion
          </p>
          <p className="text-sm text-white/80">{scheme.rom}</p>
        </div>

        {/* Hypertrophy tip */}
        <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-xl p-3">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Hypertrophy Focus
          </p>
          <p className="text-sm text-white/90">{scheme.focus} Use tempo <span className="font-bold text-cyan-400">{scheme.tempo}</span> for maximum time under tension.</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<string>("Chest");
  const [workoutName, setWorkoutName] = useState("");
  const [expandedExId, setExpandedExId] = useState<number | null>(null);
  const [step, setStep] = useState<"group" | "exercises">("group");

  const { data: exercises } = useGetExercises({ muscleGroup: selectedGroup });

  const { mutate: createWorkout, isPending } = useCreateWorkout({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/workout/active/${data.id}`);
      }
    }
  });

  const handleStart = () => {
    createWorkout({
      data: {
        name: workoutName || `${selectedGroup} Day`,
        muscleGroup: selectedGroup,
        date: new Date().toISOString(),
        durationMinutes: 0,
        caloriesBurned: 0,
        notes: ""
      }
    });
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Start Workout</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </header>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("group")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${step === "group" ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
            Muscle Group
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setStep("exercises")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${step === "exercises" ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
            Exercises
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "group" && (
            <motion.div key="group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6 rounded-3xl space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Workout Name (Optional)</label>
                <input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder={`${selectedGroup} Day`}
                  className="w-full px-5 py-4 rounded-2xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Target Muscle Group
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">{selectedGroup} Selected</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {muscleGroups.map((group, idx) => {
                    const isSelected = selectedGroup === group.id;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={`relative h-28 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.98]' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                      >
                        <img src={group.image} alt={group.id} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? 'from-primary/80 via-black/50' : 'from-black/90 via-black/40'} to-transparent`} />
                        <div className="absolute inset-0 p-3 flex flex-col justify-end">
                          <h3 className="font-display font-bold text-white text-sm">{group.id}</h3>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-[0_0_10px_rgba(124,58,237,0.8)]">
                            <Activity className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={handleStart}
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-muted-foreground rounded-2xl font-medium hover:bg-white/10 transition-all"
                >
                  {isPending ? "Starting..." : "Quick Start"}
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep("exercises")}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all hover:-translate-y-1"
                >
                  Browse Exercises
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "exercises" && (
            <motion.div key="exercises" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Group switcher row */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {muscleGroups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGroup(g.id); setExpandedExId(null); }}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedGroup === g.id ? "bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]" : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"}`}
                  >
                    {g.emoji} {g.id}
                  </button>
                ))}
              </div>

              <div className="glass-card p-4 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg">{selectedGroup} Exercises</h2>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{exercises?.length ?? 0} exercises</span>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {exercises?.map((ex, idx) => {
                    const isExpanded = expandedExId === ex.id;
                    const diffColor = ex.difficulty === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20" : ex.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-green-400 bg-green-500/10 border-green-500/20";

                    return (
                      <motion.div
                        key={ex.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <div
                          onClick={() => setExpandedExId(isExpanded ? null : ex.id)}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${isExpanded ? 'bg-primary/10 border-primary/40' : 'bg-black/30 hover:bg-white/5 border-white/5 hover:border-primary/20'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-white/5 text-primary'}`}>
                              <Dumbbell className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{ex.name}</p>
                              <p className="text-xs text-muted-foreground">{ex.equipment}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs border rounded-full px-2 py-0.5 ${diffColor}`}>{ex.difficulty}</span>
                            {isExpanded ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <ExerciseDetailCard
                              exercise={ex}
                              onClose={() => setExpandedExId(null)}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep("group")} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium hover:bg-white/10 transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handleStart}
                  disabled={isPending}
                  className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                >
                  {isPending ? "Starting..." : "Begin Session"}
                  <Play className="w-5 h-5 fill-current" />
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground/50 pt-2">
                For educational and training reference only. Consult a doctor before starting any program.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
