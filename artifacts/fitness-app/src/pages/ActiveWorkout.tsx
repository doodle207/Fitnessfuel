import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetWorkout, useGetExercises, useAddSet } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import {
  Dumbbell, Plus, Check, X, Timer, ChevronDown, ChevronRight,
  Target, Zap, RotateCcw, Info, TrendingUp, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string; rom: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",      focus: "Learn the movement. Light weight, perfect form.", tempo: "2-0-2", rom: "Full range — slow and controlled every rep." },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec",   focus: "Hypertrophy — keep tension on the muscle throughout.", tempo: "3-1-2", rom: "Full stretch at bottom, hard squeeze at the top." },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",     focus: "Strength & power. Maximal load with perfect form.", tempo: "2-1-1", rom: "Controlled eccentric, explosive concentric. Full ROM." },
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
  const diffColor = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20" : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-green-400 bg-green-500/10 border-green-500/20";

  return (
    <div className="p-4 space-y-4">
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs border rounded-full px-2 py-0.5 ${diffColor}`}>{exercise.difficulty}</span>
        <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-3 py-1">
          <Target className="w-3 h-3" /> {exercise.muscleGroup}
        </span>
        {exercise.secondaryMuscles && exercise.secondaryMuscles.split(",").slice(0, 2).map(m => (
          <span key={m} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-muted-foreground">{m.trim()}</span>
        ))}
        {exercise.equipment && (
          <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1">{exercise.equipment}</span>
        )}
      </div>

      {/* Steps */}
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

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <p className="text-xs text-muted-foreground mb-1">Sets</p>
          <p className="font-bold text-white text-lg">{scheme.sets}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <p className="text-xs text-muted-foreground mb-1">Reps</p>
          <p className="font-bold text-white">{scheme.reps}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><Timer className="w-3 h-3" />Rest</p>
          <p className="font-bold text-white text-xs">{scheme.rest}</p>
        </div>
      </div>

      {/* ROM */}
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
        <p className="text-sm text-white/90">{scheme.focus} Tempo: <span className="font-bold text-cyan-400">{scheme.tempo}</span>.</p>
      </div>
    </div>
  );
}

function ProgressionHint({ lastWeight, lastReps }: { lastWeight: number; lastReps: number }) {
  const nextWeight = Math.round((lastWeight + 2.5) * 2) / 2;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-xs">
      <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
      <span className="text-green-300">
        Last: <strong>{lastWeight} kg × {lastReps} reps</strong> — Suggested next: <strong>{nextWeight} kg</strong> · Rest 48–72 hrs before re-training
      </span>
    </div>
  );
}

export default function ActiveWorkout() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workoutId = parseInt(id || "0");
  const queryClient = useQueryClient();

  const { data: workout, isLoading: isWorkoutLoading } = useGetWorkout(workoutId);
  const { data: allExercises, isLoading: isExLoading } = useGetExercises();

  const [expandedExId, setExpandedExId] = useState<number | null>(null);
  const [showInfoFor, setShowInfoFor] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [search, setSearch] = useState("");
  const [selectorGroup, setSelectorGroup] = useState("All");
  const [repsMap, setRepsMap] = useState<Record<number, string>>({});
  const [weightMap, setWeightMap] = useState<Record<number, string>>({});

  const { mutate: addSet, isPending: isAddingSet } = useAddSet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/workouts/${workoutId}`] });
      }
    }
  });

  useEffect(() => {
    if (workout?.sets && workout.sets.length > 0) {
      const lastByEx: Record<number, { weight: number; reps: number }> = {};
      workout.sets.forEach(s => { lastByEx[s.exerciseId] = { weight: s.weightKg, reps: s.reps }; });
      const newWeights: Record<number, string> = {};
      const newReps: Record<number, string> = {};
      Object.entries(lastByEx).forEach(([exId, { weight, reps }]) => {
        newWeights[parseInt(exId)] = String(weight);
        newReps[parseInt(exId)] = String(reps);
      });
      setWeightMap(prev => ({ ...newWeights, ...prev }));
      setRepsMap(prev => ({ ...newReps, ...prev }));
    }
  }, [workout?.sets?.length]);

  if (isWorkoutLoading || isExLoading) return <LoadingState message="Loading session..." />;
  if (!workout) return <div>Workout not found</div>;

  const setsByExercise = workout.sets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<number, typeof workout.sets>);

  const exercisedIds = Object.keys(setsByExercise).map(Number);

  const handleAddSet = (exerciseId: number) => {
    const existingSets = setsByExercise[exerciseId] || [];
    addSet({
      workoutId,
      data: {
        exerciseId,
        setNumber: existingSets.length + 1,
        reps: parseInt(repsMap[exerciseId] || "10"),
        weightKg: parseFloat(weightMap[exerciseId] || "0"),
        notes: ""
      }
    });
  };

  const muscleGroups = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Full Body"];

  const filteredSelector = allExercises?.filter(ex => {
    const matchGroup = selectorGroup === "All" || ex.muscleGroup === selectorGroup;
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch && !exercisedIds.includes(ex.id);
  }) ?? [];

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-5 pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                {workout.name}
              </h1>
              <p className="text-sm text-primary flex items-center gap-1 mt-1">
                <Timer className="w-4 h-4" /> Active Session
              </p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-white/10"
            >
              Finish Workout
            </button>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-4">
          {exercisedIds.map(exId => {
            const sets = setsByExercise[exId];
            const exercise = allExercises?.find(e => e.id === exId);
            if (!exercise) return null;

            const isExpanded = expandedExId === exId;
            const showInfo = showInfoFor === exId;
            const lastSet = sets[sets.length - 1];
            const currentWeight = weightMap[exId] ?? String(lastSet?.weightKg ?? "0");
            const currentReps = repsMap[exId] ?? String(lastSet?.reps ?? "10");

            return (
              <motion.div
                key={exId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden border border-white/5"
              >
                {/* Exercise Header */}
                <div
                  className="p-4 bg-black/40 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => setExpandedExId(isExpanded ? null : exId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">{sets.length} sets · {exercise.muscleGroup}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowInfoFor(showInfo ? null : exId); setExpandedExId(exId); }}
                      className={`p-2 rounded-lg transition-colors text-xs ${showInfo ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-muted-foreground'}`}
                      title="Exercise info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Info Panel */}
                      <AnimatePresence>
                        {showInfo && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="border-b border-white/5 bg-black/20">
                            <ExerciseInfoPanel exercise={exercise} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="p-4 space-y-3 bg-black/10">
                        {/* Progression hint */}
                        {lastSet && (
                          <ProgressionHint lastWeight={lastSet.weightKg} lastReps={lastSet.reps} />
                        )}

                        {/* Column headers */}
                        <div className="flex text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                          <div className="w-12 text-center">Set</div>
                          <div className="flex-1 text-center">kg</div>
                          <div className="flex-1 text-center">Reps</div>
                          <div className="w-10"></div>
                        </div>

                        {/* Logged Sets */}
                        {sets.map((set) => (
                          <div key={set.id} className="flex items-center bg-white/5 rounded-xl p-2 px-4 border border-white/5">
                            <div className="w-12 text-center font-bold text-primary">{set.setNumber}</div>
                            <div className="flex-1 text-center font-medium">{set.weightKg}</div>
                            <div className="flex-1 text-center font-medium">{set.reps}</div>
                            <div className="w-10 flex justify-center">
                              <Check className="w-5 h-5 text-green-500" />
                            </div>
                          </div>
                        ))}

                        {/* New Set Form */}
                        <div className="flex items-center bg-primary/10 rounded-xl p-2 px-4 border border-primary/20 mt-2">
                          <div className="w-12 text-center font-bold text-primary">{sets.length + 1}</div>
                          <div className="flex-1 px-2">
                            <input
                              type="number"
                              value={currentWeight}
                              onChange={e => setWeightMap(m => ({ ...m, [exId]: e.target.value }))}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-2 focus:border-primary outline-none text-sm"
                              placeholder="kg"
                            />
                          </div>
                          <div className="flex-1 px-2">
                            <input
                              type="number"
                              value={currentReps}
                              onChange={e => setRepsMap(m => ({ ...m, [exId]: e.target.value }))}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-2 focus:border-primary outline-none text-sm"
                              placeholder="reps"
                            />
                          </div>
                          <div className="w-10 flex justify-center">
                            <button
                              onClick={() => handleAddSet(exId)}
                              disabled={isAddingSet}
                              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/80 disabled:opacity-50 shadow-[0_0_10px_rgba(124,58,237,0.4)] transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Add Exercise Panel */}
        {!showSelector ? (
          <button
            onClick={() => setShowSelector(true)}
            className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary rounded-2xl flex items-center justify-center gap-2 transition-all font-medium hover:bg-primary/5"
          >
            <Plus className="w-5 h-5" /> Add Exercise
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.1)] overflow-hidden"
          >
            {/* Selector header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg">Add Exercise</h3>
              <button onClick={() => setShowSelector(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Muscle group filters */}
            <div className="flex gap-1.5 overflow-x-auto px-4 py-3 no-scrollbar">
              {muscleGroups.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectorGroup(g)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectorGroup === g ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'}`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Exercise list */}
            <div className="max-h-72 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
              {filteredSelector.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No exercises found</p>
              )}
              {filteredSelector.map(ex => {
                const diffColor = ex.difficulty === "Advanced" ? "text-red-400" : ex.difficulty === "Intermediate" ? "text-yellow-400" : "text-green-400";
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setExpandedExId(ex.id);
                      setShowSelector(false);
                      if (!repsMap[ex.id]) setRepsMap(m => ({ ...m, [ex.id]: "10" }));
                      if (!weightMap[ex.id]) setWeightMap(m => ({ ...m, [ex.id]: "0" }));
                      handleAddSet(ex.id);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-primary/15 border border-white/5 hover:border-primary/40 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.muscleGroup} · {ex.equipment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${diffColor}`}>{ex.difficulty}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/40 pt-2">
          For educational and training reference only. Consult a doctor before starting any program.
        </p>
      </div>
    </PageTransition>
  );
}
