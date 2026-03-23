import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetWorkout, useGetExercises, useAddSet } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import {
  Dumbbell, Plus, Check, X, Timer, ChevronDown,
  Target, Zap, Info, TrendingUp, Search, ArrowLeft, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string; rom: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",    focus: "Learn the movement. Light weight, perfect form.", tempo: "2-0-2", rom: "Full range — slow and controlled every rep." },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — keep tension on the muscle throughout.", tempo: "3-1-2", rom: "Full stretch at bottom, hard squeeze at the top." },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength & power. Maximal load with perfect form.", tempo: "2-1-1", rom: "Controlled eccentric, explosive concentric. Full ROM." },
};

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  secondaryMuscles?: string | null;
  equipment?: string | null;
  instructions?: string | null;
  difficulty?: string | null;
}

function ExerciseInfoPanel({ exercise }: { exercise: Exercise }) {
  const scheme = repSchemes[exercise.difficulty ?? "Intermediate"] ?? repSchemes.Intermediate;
  const steps = (exercise.instructions ?? "").split(". ").filter(Boolean).slice(0, 5);
  const diffColor = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-green-400 bg-green-500/10 border-green-500/20";

  return (
    <div className="p-4 space-y-3 bg-black/20 border-b border-white/5">
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs border rounded-full px-2 py-0.5 ${diffColor}`}>{exercise.difficulty || "Beginner"}</span>
        <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Target className="w-3 h-3" /> {exercise.muscleGroup}
        </span>
        {exercise.equipment && <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5">{exercise.equipment}</span>}
      </div>
      {steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> How To
          </p>
          <ul className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-muted-foreground leading-snug">{step.trim()}.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {[["Sets", scheme.sets], ["Reps", scheme.reps], ["Rest", scheme.rest]].map(([k, v]) => (
          <div key={k} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/8">
            <p className="text-[10px] text-muted-foreground mb-0.5">{k}</p>
            <p className="font-bold text-sm">{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-2.5">
        <p className="text-xs font-bold text-violet-400 mb-0.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Hypertrophy Focus</p>
        <p className="text-xs text-white/80">{scheme.focus} Tempo: <span className="font-bold text-cyan-400">{scheme.tempo}</span></p>
      </div>
    </div>
  );
}

function ProgressionHint({ lastWeight, lastReps }: { lastWeight: number; lastReps: number }) {
  const nextWeight = Math.round((lastWeight + 2.5) * 2) / 2;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-xs mb-2">
      <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
      <span className="text-green-300">
        Last: <strong>{lastWeight} kg × {lastReps} reps</strong> — Next target: <strong>{nextWeight} kg</strong>
      </span>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ActiveWorkout() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workoutId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const { toast } = useToast();

  const { data: workout, isLoading: isWorkoutLoading, error: workoutError } = useGetWorkout(workoutId, { query: { queryKey: ['fitness', 'workout', workoutId] } });
  const { data: rawExercises, isLoading: isExLoading } = useGetExercises(undefined, { query: { queryKey: ['fitness', 'exercises'] } });
  const allExercises: Exercise[] = Array.isArray(rawExercises) ? rawExercises : [];

  const [pendingExerciseIds, setPendingExerciseIds] = useState<number[]>([]);
  const [expandedExId, setExpandedExId] = useState<number | null>(null);
  const [showInfoFor, setShowInfoFor] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [search, setSearch] = useState("");
  const [selectorGroup, setSelectorGroup] = useState("All");
  const [repsMap, setRepsMap] = useState<Record<number, string>>({});
  const [weightMap, setWeightMap] = useState<Record<number, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishSummary, setFinishSummary] = useState<{ caloriesBurned: number; durationMinutes: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const { mutate: addSet, isPending: isAddingSet } = useAddSet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/workouts/${workoutId}`] });
      },
      onError: () => {
        toast({ title: "Couldn't log set", description: "Server unavailable. Try again.", variant: "destructive" });
      }
    }
  });

  if (isWorkoutLoading || isExLoading) return <LoadingState message="Loading session..." />;

  if (!workout || workoutError || !isNaN(workoutId) === false || workoutId === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-xl font-display font-bold mb-2">Workout Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          This workout session doesn't exist or the server is unavailable.
        </p>
        <button
          onClick={() => setLocation("/workout")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workout
        </button>
      </div>
    );
  }

  const workoutData = workout as any;

  if (workoutData.durationMinutes && workoutData.durationMinutes > 0) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">{workoutData.name}</h2>
          <p className="text-muted-foreground text-sm mb-1">This workout is already complete.</p>
          {workoutData.caloriesBurned > 0 && (
            <p className="text-orange-400 text-sm font-medium mb-1">🔥 {workoutData.caloriesBurned} kcal burned</p>
          )}
          <p className="text-muted-foreground text-xs mb-6">⏱ {workoutData.durationMinutes} min · {workoutData.muscleGroup || "Mixed"}</p>
          <button
            onClick={() => setLocation("/workout")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workout
          </button>
        </div>
      </PageTransition>
    );
  }

  const sets: any[] = Array.isArray(workoutData.sets) ? workoutData.sets : [];

  const setsByExercise = sets.reduce((acc: Record<number, any[]>, set: any) => {
    if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<number, any[]>);

  const exercisedIds = Object.keys(setsByExercise).map(Number);
  const allDisplayIds = [...new Set([...exercisedIds, ...pendingExerciseIds])];

  const handleFinishWorkout = async () => {
    setIsFinishing(true);
    try {
      const res = await fetch(`${BASE}/api/workouts/${workoutId}/finish`, { method: "PATCH", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFinishSummary(data);
      } else {
        setLocation("/workout");
      }
    } catch {
      setLocation("/workout");
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAddSet = (exerciseId: number) => {
    const weight = parseFloat(weightMap[exerciseId] || "");
    const reps = parseInt(repsMap[exerciseId] || "");
    if (isNaN(weight) || isNaN(reps) || reps <= 0) return;
    const existingSets = setsByExercise[exerciseId] || [];
    addSet({
      workoutId,
      data: {
        exerciseId,
        setNumber: existingSets.length + 1,
        reps,
        weightKg: weight,
        notes: ""
      }
    });
  };

  const muscleGroups = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Full Body"];
  const filteredSelector = allExercises.filter(ex => {
    const matchGroup = selectorGroup === "All" || ex.muscleGroup === selectorGroup;
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch && !allDisplayIds.includes(ex.id);
  });

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const totalSets = sets.length;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-4 pb-28">
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5 pb-3 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h1 className="text-xl font-display font-bold">{workoutData.name}</h1>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-violet-400 font-semibold">
                  <Timer className="w-3 h-3" /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" /> {allDisplayIds.length} exercises
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" /> {totalSets} sets
                </span>
              </div>
            </div>
            <button
              onClick={handleFinishWorkout}
              disabled={isFinishing}
              className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isFinishing ? "Saving..." : "Finish ✓"}
            </button>
          </div>
        </div>

        {allDisplayIds.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl text-muted-foreground">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No exercises yet</p>
            <p className="text-xs mt-1 opacity-60">Add exercises below to start logging sets</p>
          </div>
        )}

        <div className="space-y-3">
          {allDisplayIds.map(exId => {
            const exSets = setsByExercise[exId] || [];
            const exercise = allExercises.find(e => e.id === exId);
            if (!exercise) return null;

            const isExpanded = expandedExId === exId;
            const showInfo = showInfoFor === exId;
            const lastSet = exSets[exSets.length - 1];
            const currentWeight = weightMap[exId] ?? "";
            const currentReps = repsMap[exId] ?? "";
            const diffColor = exercise.difficulty === "Advanced" ? "text-red-400"
              : exercise.difficulty === "Intermediate" ? "text-yellow-400" : "text-green-400";

            return (
              <motion.div key={exId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <div
                  className="p-4 bg-black/40 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => setExpandedExId(isExpanded ? null : exId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">{exSets.length} sets · <span className={diffColor}>{exercise.difficulty || "Beginner"}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setShowInfoFor(showInfo ? null : exId); setExpandedExId(exId); }}
                      className={`p-1.5 rounded-lg transition-colors ${showInfo ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/10 text-muted-foreground"}`}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setPendingExerciseIds(prev => prev.filter(id => id !== exId)); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                      title="Remove exercise"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      {showInfo && <ExerciseInfoPanel exercise={exercise} />}

                      <div className="p-4 space-y-2.5 bg-black/10">
                        {lastSet && exSets.length > 0 && (
                          <ProgressionHint lastWeight={lastSet.weightKg} lastReps={lastSet.reps} />
                        )}

                        <div className="flex text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 gap-2">
                          <div className="w-10 text-center">Set</div>
                          <div className="flex-1 text-center">Weight (kg)</div>
                          <div className="flex-1 text-center">Reps</div>
                          <div className="w-8" />
                        </div>

                        {exSets.map((set: any) => (
                          <div key={set.id} className="flex items-center bg-white/5 rounded-xl py-2 px-3 border border-white/5 gap-2">
                            <div className="w-10 text-center font-bold text-violet-400 text-sm">{set.setNumber}</div>
                            <div className="flex-1 text-center font-semibold text-sm">{set.weightKg}</div>
                            <div className="flex-1 text-center font-semibold text-sm">{set.reps}</div>
                            <div className="w-8 flex justify-center">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center bg-violet-500/10 rounded-xl py-2 px-3 border border-violet-500/20 gap-2">
                          <div className="w-10 text-center font-bold text-violet-400 text-sm">{exSets.length + 1}</div>
                          <div className="flex-1 px-1">
                            <input
                              type="number"
                              value={currentWeight}
                              onChange={e => setWeightMap(m => ({ ...m, [exId]: e.target.value }))}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-1.5 focus:border-violet-500 outline-none text-sm placeholder:text-muted-foreground/50"
                              placeholder="kg"
                            />
                          </div>
                          <div className="flex-1 px-1">
                            <input
                              type="number"
                              value={currentReps}
                              onChange={e => setRepsMap(m => ({ ...m, [exId]: e.target.value }))}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-1.5 focus:border-violet-500 outline-none text-sm placeholder:text-muted-foreground/50"
                              placeholder="reps"
                            />
                          </div>
                          <div className="w-8 flex justify-center">
                            <button
                              onClick={() => handleAddSet(exId)}
                              disabled={isAddingSet || !weightMap[exId] || !repsMap[exId]}
                              className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 disabled:opacity-40 shadow-[0_0_8px_rgba(124,58,237,0.4)] transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 text-center">Enter weight and reps, then tap ✓ to log the set</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {!showSelector ? (
          <button
            onClick={() => setShowSelector(true)}
            className="w-full py-4 border-2 border-dashed border-white/10 hover:border-violet-500/50 text-muted-foreground hover:text-violet-400 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium hover:bg-violet-500/5"
          >
            <Plus className="w-5 h-5" /> Add Exercise
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.08)] overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-display font-semibold">Add Exercise</h3>
              <button onClick={() => setShowSelector(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..."
                  className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm focus:border-violet-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto px-4 py-3 no-scrollbar">
              {muscleGroups.map(g => (
                <button key={g} onClick={() => setSelectorGroup(g)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectorGroup === g ? "bg-violet-600 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"}`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="max-h-64 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
              {filteredSelector.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {allExercises.length === 0 ? "No exercises available (server offline)" : "No exercises found"}
                </p>
              )}
              {filteredSelector.map(ex => (
                <button key={ex.id}
                  onClick={() => {
                    setPendingExerciseIds(prev => [...prev, ex.id]);
                    setExpandedExId(ex.id);
                    setShowSelector(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 rounded-xl transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                      <Dumbbell className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-violet-400 transition-colors">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.muscleGroup} · {ex.equipment}</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/30 pb-2">
          For reference only. Consult a healthcare professional before starting any program.
        </p>
      </div>

      {/* Post-workout summary modal */}
      <AnimatePresence>
        {finishSummary && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-br from-violet-600/20 via-transparent to-green-600/10 p-6 text-center space-y-1 border-b border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-display font-bold">Workout Complete!</h2>
                <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy · h:mm a")}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
                    <Timer className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{finishSummary.durationMinutes}</p>
                    <p className="text-[10px] text-muted-foreground">Minutes</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-orange-400">{finishSummary.caloriesBurned}</p>
                    <p className="text-[10px] text-muted-foreground">Cal Burned</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
                    <Dumbbell className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{totalSets}</p>
                    <p className="text-[10px] text-muted-foreground">Total Sets</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-3 flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0" />
                  <p className="text-sm text-orange-300 font-medium"><span className="font-bold text-orange-400">{finishSummary.caloriesBurned} kcal</span> added to today's calories burned</p>
                </div>
                <button
                  onClick={() => setLocation("/workout")}
                  className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                >
                  View Recent Workouts
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
