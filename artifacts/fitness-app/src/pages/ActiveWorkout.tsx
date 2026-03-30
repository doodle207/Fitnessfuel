import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetWorkout, useGetExercises, useAddSet } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import {
  Dumbbell, Plus, Check, X, Timer, ChevronDown,
  Target, Zap, Info, TrendingUp, Search, ArrowLeft, Flame, Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const splitMuscleMap: Record<string, string[]> = {
  Push: ["Chest", "Shoulders", "Triceps"],
  Pull: ["Back", "Biceps"],
  Legs: ["Quads", "Hamstrings", "Glutes", "Calves"],
  Upper: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
  Lower: ["Quads", "Hamstrings", "Glutes", "Calves"],
  Chest: ["Chest"],
  Back: ["Back"],
  Shoulders: ["Shoulders"],
  Arms: ["Biceps", "Triceps"],
  LegsFull: ["Quads", "Hamstrings", "Glutes", "Calves"],
  FullBody: ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves"],
};

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",    focus: "Learn the movement. Light weight, perfect form.", tempo: "2-0-2" },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — keep tension on the muscle throughout.", tempo: "3-1-2" },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength & power. Maximal load with perfect form.", tempo: "2-1-1" },
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> How To</p>
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
        <p className="text-xs font-bold text-violet-400 mb-0.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Focus</p>
        <p className="text-xs text-white/80">{scheme.focus} Tempo: <span className="font-bold text-cyan-400">{scheme.tempo}</span></p>
      </div>
    </div>
  );
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => {
    if (timeLeft <= 0) { onDone(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onDone]);
  const pct = (timeLeft / seconds) * 100;
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/30 rounded-2xl">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="4" />
          <circle cx="25" cy="25" r={r} fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${circ * pct / 100} ${circ * (1 - pct / 100)}`}
            style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-cyan-300">{timeLeft}</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-cyan-200">Rest Timer</p>
        <p className="text-xs text-cyan-400/70">Set logged! Rest up then crush the next one 💪</p>
      </div>
      <button onClick={onDone} className="text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/25 px-3 py-1.5 rounded-xl hover:bg-cyan-500/25 transition-colors">
        Skip
      </button>
    </motion.div>
  );
}

function PRBanner({ exerciseName }: { exerciseName: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-amber-500/30 rounded-2xl">
      <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
      <div>
        <p className="text-sm font-bold text-amber-300">🏆 New Personal Record!</p>
        <p className="text-xs text-amber-400/70">{exerciseName} — Your best lift yet!</p>
      </div>
    </motion.div>
  );
}

function WorkoutTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="flex items-center gap-1 text-violet-400 font-semibold">
      <Timer className="w-3 h-3" /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

interface ExerciseInputRowProps {
  exId: number;
  exSets: any[];
  isAddingSet: boolean;
  onAddSet: (exId: number, weight: string, reps: string) => void;
}

const ExerciseInputRow = memo(function ExerciseInputRow({ exId, exSets, isAddingSet, onAddSet }: ExerciseInputRowProps) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const lastSet = exSets[exSets.length - 1];

  const handleAdd = useCallback(() => {
    if (!weight || !reps) return;
    onAddSet(exId, weight, reps);
    setWeight("");
    setReps("");
  }, [exId, weight, reps, onAddSet]);

  const handleRepeatLast = useCallback(() => {
    if (!lastSet) return;
    setWeight(String(lastSet.weightKg));
    setReps(String(lastSet.reps));
  }, [lastSet]);

  const handleAddWeight = useCallback((delta: number) => {
    setWeight(prev => String(Math.round((parseFloat(prev || String(lastSet?.weightKg || 0)) + delta) * 2) / 2));
  }, [lastSet]);

  return (
    <div className="space-y-3">
      <div className="flex items-center bg-violet-500/10 rounded-xl py-2 px-3 border border-violet-500/20 gap-2">
        <div className="w-10 text-center font-bold text-violet-400 text-sm">{exSets.length + 1}</div>
        <div className="flex-1 px-1">
          <input type="number" inputMode="decimal" value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-1.5 focus:border-violet-500 outline-none text-sm placeholder:text-muted-foreground/50"
            placeholder="kg" />
        </div>
        <div className="flex-1 px-1">
          <input type="number" inputMode="numeric" value={reps}
            onChange={e => setReps(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-1.5 focus:border-violet-500 outline-none text-sm placeholder:text-muted-foreground/50"
            placeholder="reps" />
        </div>
        <div className="w-8 flex justify-center">
          <button onClick={handleAdd} disabled={isAddingSet || !weight || !reps}
            className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 disabled:opacity-40 shadow-[0_0_8px_rgba(124,58,237,0.4)] transition-all">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Quick:</span>
        {lastSet && (
          <button onClick={handleRepeatLast}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60 font-medium">
            Repeat last
          </button>
        )}
        {lastSet && (
          <>
            <button onClick={() => handleAddWeight(2.5)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-cyan-400 font-medium">
              +2.5 kg
            </button>
            <button onClick={() => handleAddWeight(5)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-violet-400 font-medium">
              +5 kg
            </button>
          </>
        )}
      </div>
    </div>
  );
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ActiveWorkout() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workoutId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const startTimeRef = useRef(Date.now());
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
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishSummary, setFinishSummary] = useState<{ caloriesBurned: number; durationMinutes: number } | null>(null);

  // Rest timer state
  const [restTimerExId, setRestTimerExId] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(75);
  // PR banner state
  const [prExerciseName, setPrExerciseName] = useState<string | null>(null);
  // Track personal bests per exercise (max weight logged)
  const [personalBests, setPersonalBests] = useState<Record<number, number>>({});
  // Set-based progress tracking
  const [completedSets, setCompletedSets] = useState(0);
  // Optimistic sets added before server confirms
  const [optimisticSets, setOptimisticSets] = useState<any[]>([]);

  // Clear PR banner after 3 seconds
  useEffect(() => {
    if (!prExerciseName) return;
    const t = setTimeout(() => setPrExerciseName(null), 4000);
    return () => clearTimeout(t);
  }, [prExerciseName]);

  const { mutate: addSet, isPending: isAddingSet } = useAddSet({
    mutation: {
      onSuccess: (data, variables) => {
        const exId = variables.data.exerciseId;
        const weight = parseFloat(variables.data.weightKg as any) || 0;
        const tempId = (variables as any).__tempId;

        // Replace optimistic set with real server data
        if (tempId) {
          setOptimisticSets(prev => prev.filter(s => s.id !== tempId));
        }

        queryClient.invalidateQueries({ queryKey: ['fitness', 'workout', workoutId] });

        // Check for PR
        const prevBest = personalBests[exId] || 0;
        if (weight > prevBest) {
          const ex = allExercises.find(e => e.id === exId);
          if (prevBest > 0 && ex) setPrExerciseName(ex.name);
          setPersonalBests(m => ({ ...m, [exId]: weight }));
        }

        // Start rest timer
        const ex = allExercises.find(e => e.id === exId);
        const diff = ex?.difficulty ?? "Intermediate";
        const secs = diff === "Advanced" ? 120 : diff === "Intermediate" ? 75 : 60;
        setRestSeconds(secs);
        setRestTimerExId(exId);
      },
      onError: (_err, variables) => {
        const tempId = (variables as any).__tempId;
        if (tempId) setOptimisticSets(prev => prev.filter(s => s.id !== tempId));
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
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">This workout session doesn't exist or the server is unavailable.</p>
        <button onClick={() => setLocation("/workout")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
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
          {workoutData.caloriesBurned > 0 && <p className="text-orange-400 text-sm font-medium mb-1">🔥 {workoutData.caloriesBurned} kcal burned</p>}
          <p className="text-muted-foreground text-xs mb-6">⏱ {workoutData.durationMinutes} min · {workoutData.muscleGroup || "Mixed"}</p>
          <button onClick={() => setLocation("/workout")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Workout
          </button>
        </div>
      </PageTransition>
    );
  }

  const sets: any[] = Array.isArray(workoutData.sets) ? workoutData.sets : [];
  const allSets = [...sets, ...optimisticSets];
  const setsByExercise = allSets.reduce((acc: Record<number, any[]>, set: any) => {
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
      if (res.ok) { const data = await res.json(); setFinishSummary(data); }
      else setLocation("/workout");
    } catch { setLocation("/workout"); }
    finally { setIsFinishing(false); }
  };

  const handleAddSet = useCallback((exerciseId: number, weightStr: string, repsStr: string) => {
    const weight = parseFloat(weightStr);
    const reps = parseInt(repsStr);
    if (isNaN(weight) || isNaN(reps) || reps <= 0) return;
    const existingSets = setsByExercise[exerciseId] || [];
    const tempId = -Date.now();
    const optimisticSet = { id: tempId, exerciseId, setNumber: existingSets.length + 1, reps, weightKg: weight, notes: "", isOptimistic: true };
    setOptimisticSets(prev => [...prev, optimisticSet]);
    setCompletedSets(prev => prev + 1);
    addSet({ workoutId, data: { exerciseId, setNumber: existingSets.length + 1, reps, weightKg: weight, notes: "" }, __tempId: tempId } as any);
  }, [setsByExercise, workoutId, addSet]);

  const muscleGroups = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Full Body"];
  const filteredSelector = allExercises.filter(ex => {
    const matchGroup = selectorGroup === "All" || ex.muscleGroup === selectorGroup;
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch && !allDisplayIds.includes(ex.id);
  });

  const totalSets = sets.length;
  const totalVolume = sets.reduce((s: number, set: any) => s + (set.weightKg || 0) * (set.reps || 0), 0);

  // Extract day type from workout notes
  const workoutNotes = workoutData.notes || "";
  const dayTypeMatch = workoutNotes.match(/type:(\w+)/);
  const dayType = dayTypeMatch ? dayTypeMatch[1] : null;
  const focusMuscles = dayType && splitMuscleMap[dayType] ? splitMuscleMap[dayType].join(", ") : "";

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-4 pb-28">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5 pb-3 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h1 className="text-lg md:text-xl font-display font-bold">Today's Workout: <span className="text-violet-400">{dayType || "Custom"}</span></h1>
                  {focusMuscles && <p className="text-xs text-muted-foreground mt-0.5">Focus: <span className="text-cyan-300">{focusMuscles}</span></p>}
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                <WorkoutTimer startTime={startTimeRef.current} />
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400 font-bold" /> {completedSets}/{totalSets} sets completed</span>
                {totalVolume > 0 && <span className="flex items-center gap-1 text-cyan-400"><Flame className="w-3 h-3" /> {Math.round(totalVolume).toLocaleString()} kg vol</span>}
              </div>
            </div>
            <button onClick={handleFinishWorkout} disabled={isFinishing}
              className="shrink-0 px-3 md:px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {isFinishing ? "Saving..." : "Finish ✓"}
            </button>
          </div>
        </div>

        {/* Rest Timer */}
        <AnimatePresence>
          {restTimerExId !== null && (
            <RestTimer key={restTimerExId} seconds={restSeconds} onDone={() => setRestTimerExId(null)} />
          )}
        </AnimatePresence>

        {/* PR Banner */}
        <AnimatePresence>
          {prExerciseName && <PRBanner key={prExerciseName} exerciseName={prExerciseName} />}
        </AnimatePresence>

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
            const diffColor = exercise.difficulty === "Advanced" ? "text-red-400"
              : exercise.difficulty === "Intermediate" ? "text-yellow-400" : "text-green-400";

            const nextWeight = lastSet ? Math.round((lastSet.weightKg + 2.5) * 2) / 2 : null;

            return (
              <motion.div key={exId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="glass-card rounded-2xl overflow-hidden border border-white/5">
                {/* Exercise header */}
                <div className="p-4 bg-black/40 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => setExpandedExId(isExpanded ? null : exId)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">{exSets.length} sets logged · <span className={diffColor}>{exercise.difficulty || "Beginner"}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setShowInfoFor(showInfo ? null : exId); setExpandedExId(exId); }}
                      className={`p-1.5 rounded-lg transition-colors ${showInfo ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/10 text-muted-foreground"}`}>
                      <Info className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setPendingExerciseIds(prev => prev.filter(id => id !== exId)); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }} className="overflow-hidden">
                      {showInfo && <ExerciseInfoPanel exercise={exercise} />}

                      <div className="p-4 space-y-3 bg-black/10">
                        {/* Progression hint */}
                        {lastSet && exSets.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/8 border border-green-500/15 rounded-xl text-xs">
                            <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
                            <span className="text-green-300">
                              Last: <strong>{lastSet.weightKg} kg × {lastSet.reps} reps</strong>
                              {nextWeight && <> — Next target: <strong className="text-cyan-300">{nextWeight} kg</strong></>}
                            </span>
                          </div>
                        )}

                        {/* Sets table header */}
                        <div className="flex text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 gap-2">
                          <div className="w-10 text-center">Set</div>
                          <div className="flex-1 text-center">Weight (kg)</div>
                          <div className="flex-1 text-center">Reps</div>
                          <div className="w-8" />
                        </div>

                        {/* Logged sets */}
                        {exSets.map((set: any) => (
                          <div key={set.id} className={`flex items-center rounded-xl py-2 px-3 border gap-2 transition-all ${set.isOptimistic ? "bg-violet-500/10 border-violet-500/20 opacity-70" : "bg-white/5 border-white/5"}`}>
                            <div className="w-10 text-center font-bold text-violet-400 text-sm">{set.setNumber}</div>
                            <div className="flex-1 text-center font-semibold text-sm">{set.weightKg} kg</div>
                            <div className="flex-1 text-center font-semibold text-sm">{set.reps} reps</div>
                            <div className="w-8 flex justify-center">
                              {set.isOptimistic
                                ? <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                                : <Check className="w-4 h-4 text-green-500" />}
                            </div>
                          </div>
                        ))}

                        <ExerciseInputRow
                          exId={exId}
                          exSets={exSets}
                          isAddingSet={isAddingSet}
                          onAddSet={handleAddSet}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Add Exercise button / selector */}
        {!showSelector ? (
          <button onClick={() => setShowSelector(true)}
            className="w-full py-4 border-2 border-dashed border-white/10 hover:border-violet-500/50 text-muted-foreground hover:text-violet-400 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium hover:bg-violet-500/5">
            <Plus className="w-5 h-5" /> Add Exercise
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-violet-500/30 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-display font-semibold">Add Exercise</h3>
              <button onClick={() => setShowSelector(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
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
                <p className="text-center text-sm text-muted-foreground py-8">{allExercises.length === 0 ? "No exercises available (server offline)" : "No exercises found"}</p>
              )}
              {filteredSelector.map(ex => (
                <button key={ex.id} onClick={() => { setPendingExerciseIds(prev => [...prev, ex.id]); setExpandedExId(ex.id); setShowSelector(false); }}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 60 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full sm:max-w-sm bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-violet-600/20 via-transparent to-green-600/10 p-6 text-center space-y-1 border-b border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-display font-bold">Workout Complete!</h2>
                <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d · h:mm a")}</p>
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
                {totalVolume > 0 && (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-violet-300">{Math.round(totalVolume).toLocaleString()} kg</p>
                    <p className="text-xs text-violet-400/70">Total Volume Lifted</p>
                  </div>
                )}
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-3 flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0" />
                  <p className="text-sm text-orange-300 font-medium"><span className="font-bold text-orange-400">{finishSummary.caloriesBurned} kcal</span> added to today's calories burned</p>
                </div>
                <div className="bg-gradient-to-r from-violet-500/8 to-cyan-500/8 border border-white/8 rounded-2xl p-3 text-center">
                  <p className="text-xs text-white/50">Today's workout contributes to your muscle gain and fat loss prediction 💪</p>
                </div>
                <button onClick={() => setLocation("/workout")}
                  className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors shadow-[0_0_16px_rgba(124,58,237,0.4)]">
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
