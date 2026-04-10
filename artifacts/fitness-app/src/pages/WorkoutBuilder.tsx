import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/ui/LoadingState";
import { useCreateWorkout, useGetExercises, useGetWorkouts } from "@workspace/api-client-react";
import { useGetProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Dumbbell, Play, Calendar, X, Target, Info, Zap, Search, AlertCircle, Star, ChevronRight, CheckCircle2, Sparkles, Flame, Loader2, Wand2, MapPin, Clock, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

const makeGroupImage = (label: string, color: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='${color}'/%3E%3Cstop offset='100%25' stop-color='%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='320' height='200' fill='url(%23g)'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='28' font-weight='700'%3E${encodeURIComponent(
    label,
  )}%3C/text%3E%3C/svg%3E`;

const imgChest = makeGroupImage("Chest", "%233b82f6");
const imgBack = makeGroupImage("Back", "%238b5cf6");
const imgLegs = makeGroupImage("Legs", "%23f97316");
const imgShoulders = makeGroupImage("Shoulders", "%2310b981");
const imgArms = makeGroupImage("Arms", "%23ec4899");
const imgCore = makeGroupImage("Core", "%23f59e0b");
const imgCardio = makeGroupImage("Cardio", "%2306b6d4");
const imgFullBody = makeGroupImage("Full Body", "%236b7280");

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const muscleGroupImages: Record<string, string> = {
  Chest: imgChest, Back: imgBack, Legs: imgLegs, Shoulders: imgShoulders,
  Arms: imgArms, Core: imgCore, Cardio: imgCardio, "Full Body": imgFullBody,
};

const muscleGroups = [
  { id: "Chest", color: "from-blue-500/80 to-cyan-500/80", emoji: "💪" },
  { id: "Back", color: "from-violet-500/80 to-purple-500/80", emoji: "🏋️" },
  { id: "Legs", color: "from-orange-500/80 to-red-500/80", emoji: "🦵" },
  { id: "Shoulders", color: "from-emerald-500/80 to-teal-500/80", emoji: "🎯" },
  { id: "Arms", color: "from-pink-500/80 to-rose-500/80", emoji: "💪" },
  { id: "Core", color: "from-yellow-500/80 to-orange-500/80", emoji: "⚡" },
  { id: "Cardio", color: "from-cyan-500/80 to-sky-500/80", emoji: "🏃" },
  { id: "Full Body", color: "from-gray-600/80 to-gray-800/80", emoji: "🔥" },
];

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
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — constant tension every rep.",        tempo: "3-1-2" },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength & power. Maximal load, perfect form.",    tempo: "2-1-1" },
};

const WORKOUT_SPLITS = [
  {
    id: "ppl",
    name: "Push Pull Legs",
    days: 6,
    level: "Intermediate",
    recommended: true,
    emoji: "💪",
    desc: "Most effective split for muscle gain. Maximizes frequency and recovery.",
    color: "from-violet-600/20 to-purple-600/10 border-violet-500/40",
    schedule: [
      { day: "Monday", focus: "Push", muscles: "Chest, Shoulders, Triceps", emoji: "🫸" },
      { day: "Tuesday", focus: "Pull", muscles: "Back, Biceps, Rear Delts", emoji: "🫷" },
      { day: "Wednesday", focus: "Legs", muscles: "Quads, Hamstrings, Glutes", emoji: "🦵" },
      { day: "Thursday", focus: "Push", muscles: "Chest, Shoulders, Triceps", emoji: "🫸" },
      { day: "Friday", focus: "Pull", muscles: "Back, Biceps, Rear Delts", emoji: "🫷" },
      { day: "Saturday", focus: "Legs", muscles: "Quads, Hamstrings, Glutes", emoji: "🦵" },
      { day: "Sunday", focus: "Rest", muscles: "Active recovery / stretching", emoji: "😴" },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    days: 4,
    level: "Beginner",
    recommended: false,
    emoji: "⚡",
    desc: "Perfect for beginners and intermediates. Train each muscle twice a week.",
    color: "from-cyan-600/15 to-blue-600/10 border-cyan-500/30",
    schedule: [
      { day: "Monday", focus: "Upper", muscles: "Chest, Back, Shoulders, Arms", emoji: "👆" },
      { day: "Tuesday", focus: "Lower", muscles: "Quads, Hamstrings, Glutes, Calves", emoji: "👇" },
      { day: "Wednesday", focus: "Rest", muscles: "Active recovery", emoji: "😴" },
      { day: "Thursday", focus: "Upper", muscles: "Chest, Back, Shoulders, Arms", emoji: "👆" },
      { day: "Friday", focus: "Lower", muscles: "Quads, Hamstrings, Glutes, Calves", emoji: "👇" },
      { day: "Saturday", focus: "Rest", muscles: "Rest or light cardio", emoji: "😴" },
      { day: "Sunday", focus: "Rest", muscles: "Full rest day", emoji: "😴" },
    ],
  },
  {
    id: "bro-split",
    name: "Bro Split",
    days: 5,
    level: "Intermediate",
    recommended: false,
    emoji: "🏋️",
    desc: "One muscle group per day. Maximum volume and pump for each muscle.",
    color: "from-orange-600/15 to-red-600/10 border-orange-500/30",
    schedule: [
      { day: "Monday", focus: "Chest", muscles: "Chest + Triceps", emoji: "💪" },
      { day: "Tuesday", focus: "Back", muscles: "Back + Biceps", emoji: "🏋️" },
      { day: "Wednesday", focus: "Shoulders", muscles: "Shoulders + Traps", emoji: "🎯" },
      { day: "Thursday", focus: "Arms", muscles: "Biceps, Triceps, Forearms", emoji: "💪" },
      { day: "Friday", focus: "Legs", muscles: "Quads, Hamstrings, Calves", emoji: "🦵" },
      { day: "Saturday", focus: "Rest", muscles: "Rest or light cardio", emoji: "😴" },
      { day: "Sunday", focus: "Rest", muscles: "Full rest day", emoji: "😴" },
    ],
  },
  {
    id: "full-body",
    name: "Full Body",
    days: 3,
    level: "Beginner",
    recommended: false,
    emoji: "🔥",
    desc: "Train your entire body each session. Great for beginners and busy schedules.",
    color: "from-green-600/15 to-emerald-600/10 border-green-500/30",
    schedule: [
      { day: "Monday", focus: "Full Body", muscles: "All major muscle groups", emoji: "🔥" },
      { day: "Tuesday", focus: "Rest", muscles: "Active recovery", emoji: "😴" },
      { day: "Wednesday", focus: "Full Body", muscles: "All major muscle groups", emoji: "🔥" },
      { day: "Thursday", focus: "Rest", muscles: "Active recovery", emoji: "😴" },
      { day: "Friday", focus: "Full Body", muscles: "All major muscle groups", emoji: "🔥" },
      { day: "Saturday", focus: "Rest", muscles: "Rest or light cardio", emoji: "😴" },
      { day: "Sunday", focus: "Rest", muscles: "Full rest day", emoji: "😴" },
    ],
  },
];

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  secondaryMuscles?: string | null;
  equipment?: string | null;
  instructions?: string | null;
  difficulty?: string | null;
}

function ExerciseTip({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const scheme = repSchemes[exercise.difficulty ?? "Intermediate"] ?? repSchemes.Intermediate;
  const steps = (exercise.instructions ?? "").split(". ").filter(Boolean).slice(0, 4);
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden border-t border-white/5 bg-black/30">
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Target className="w-3 h-3" />{exercise.muscleGroup}
            </span>
            {exercise.equipment && <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5">{exercise.equipment}</span>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-3 h-3 text-muted-foreground" /></button>
        </div>
        {steps.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> How To</p>
            <ul className="space-y-1">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {step.trim()}.
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {[["Sets", scheme.sets], ["Reps", scheme.reps], ["Rest", scheme.rest]].map(([k, v]) => (
            <div key={k} className="bg-white/5 rounded-xl p-2 text-center border border-white/8">
              <p className="text-[10px] text-muted-foreground">{k}</p>
              <p className="font-bold text-sm">{v}</p>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-2.5">
          <p className="text-xs font-bold text-violet-400 mb-0.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Focus</p>
          <p className="text-xs text-white/80">{scheme.focus} Tempo: <span className="text-cyan-400 font-bold">{scheme.tempo}</span></p>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<string>("Chest");
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<string>("ppl");
  const [aiChoose, setAiChoose] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const [forgeOpen, setForgeOpen] = useState(false);
  const [forgeText, setForgeText] = useState("");
  const [forgeLoading, setForgeLoading] = useState(false);
  const [forgeDone, setForgeDone] = useState(false);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const forgeScrollRef = useRef<HTMLDivElement>(null);

  const exercisesQueryOptions = useMemo(() => ({ query: { queryKey: ['fitness', 'exercises', selectedGroup] } }), [selectedGroup]);
  const workoutsQueryOptions = useMemo(() => ({ query: { queryKey: ['fitness', 'workouts'] } }), []);

  const { data: rawExercises, isLoading: exLoading } = useGetExercises({ muscleGroup: selectedGroup } as any, exercisesQueryOptions);
  const { data: rawWorkouts } = useGetWorkouts(workoutsQueryOptions);

  const exercises: Exercise[] = Array.isArray(rawExercises) ? rawExercises : [];
  const recentWorkouts = Array.isArray(rawWorkouts) ? rawWorkouts : [];

  const { mutate: createWorkout, isPending } = useCreateWorkout({
    mutation: {
      onSuccess: (data: any) => {
        if (data && typeof data === "object" && data.id) {
          setLocation(`/workout/active/${data.id}`);
        } else {
          toast({ title: "Backend unavailable", description: "Workout tracking requires the server.", variant: "destructive" });
        }
      },
      onError: () => {
        toast({ title: "Couldn't start workout", description: "Unable to connect to the server.", variant: "destructive" });
      }
    }
  });

  const handleStartWithExercise = (exerciseId: number, exerciseName: string) => {
    createWorkout({ data: { name: `${exerciseName} & More`, muscleGroup: selectedGroup, date: new Date().toISOString(), durationMinutes: 0, caloriesBurned: 0, notes: `exercise:${exerciseId}` } });
  };

  const handleStartGroup = () => {
    createWorkout({ data: { name: `${selectedGroup} Day`, muscleGroup: selectedGroup, date: new Date().toISOString(), durationMinutes: 0, caloriesBurned: 0, notes: `type:${selectedGroup}` } });
  };

  const handleStartSplitDay = (dayType: string) => {
    const muscles = splitMuscleMap[dayType] || [];
    createWorkout({ data: { name: `${dayType} Day`, muscleGroup: muscles[0] || dayType, date: new Date().toISOString(), durationMinutes: 0, caloriesBurned: 0, notes: `type:${dayType}` } });
  };

  const handleForgeWorkout = useCallback(async () => {
    setForgeOpen(true);
    setForgeText("");
    setForgeLoading(true);
    setForgeDone(false);
    setForgeError(null);

    try {
      const splitName = WORKOUT_SPLITS.find(s => s.id === selectedSplit)?.name || selectedSplit;
      const response = await fetch(`${BASE}/api/forge-workout/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ split: splitName }),
      });

      if (!response.ok || !response.body) {
        setForgeError("Server error. Please try again.");
        setForgeLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) {
              setForgeError(parsed.error);
              setForgeLoading(false);
              return;
            }
            if (parsed.done) {
              setForgeDone(true);
              setForgeLoading(false);
              return;
            }
            if (parsed.content) {
              setForgeText(prev => prev + parsed.content);
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err) {
      setForgeError("Network error. Please check your connection.");
      setForgeLoading(false);
    }
  }, [selectedSplit]);

  useEffect(() => {
    if (forgeScrollRef.current) {
      forgeScrollRef.current.scrollTop = forgeScrollRef.current.scrollHeight;
    }
  }, [forgeText]);

  const filteredExercises = exercises.filter(ex => !search || ex.name.toLowerCase().includes(search.toLowerCase()));

  const diffColor = (d?: string | null) =>
    d === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : d === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-green-400 bg-green-500/10 border-green-500/20";

  const activeSplit = WORKOUT_SPLITS.find(s => s.id === selectedSplit) || WORKOUT_SPLITS[0];
  const today = new Date().getDay();
  const todaySchedule = activeSplit.schedule[today === 0 ? 6 : today - 1];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-5 pb-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Your Workout Plan</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </header>

        {/* Today's Focus Banner */}
        {todaySchedule && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 border bg-gradient-to-r ${activeSplit.color} flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{todaySchedule.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-0.5">Today</p>
                <p className="font-display font-bold text-lg leading-tight">{todaySchedule.focus}</p>
                <p className="text-xs text-white/60">{todaySchedule.muscles}</p>
              </div>
            </div>
            {todaySchedule.focus !== "Rest" && (
              <button
                onClick={() => handleStartSplitDay(todaySchedule.focus)}
                disabled={isPending}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition-colors shadow-[0_0_16px_rgba(124,58,237,0.5)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> {isPending ? "Starting..." : "Start"}
              </button>
            )}
          </motion.div>
        )}

        {/* Workout Split Selection */}
        <div>
          <p className="font-display font-bold text-base mb-3">Your Workout Plan</p>

          {/* AI Choose Toggle */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <button
              onClick={() => setAiChoose(!aiChoose)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${aiChoose ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Let AI choose for me
            </button>
            {aiChoose && (
              <span className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
                Recommended: <strong>Push Pull Legs</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKOUT_SPLITS.map((split, idx) => {
              const isSelected = selectedSplit === split.id || (aiChoose && split.recommended);
              return (
                <div key={split.id}>
                  <button
                    onClick={() => { setSelectedSplit(split.id); setAiChoose(false); }}
                    className={`relative w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? `bg-gradient-to-br ${split.color} ring-1 ring-violet-500/50` : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"}`}
                  >
                    {split.recommended && (
                      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" /> Recommended
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5">
                        <CheckCircle2 className="w-5 h-5 text-violet-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2 pr-16">
                      <span className="text-xl">{split.emoji}</span>
                      <p className="font-display font-bold text-sm">{split.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] bg-white/8 border border-white/10 rounded-full px-2 py-0.5 text-white/60">{split.days}x / week</span>
                      <span className={`text-[11px] border rounded-full px-2 py-0.5 ${diffColor(split.level)}`}>{split.level}</span>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed">{split.desc}</p>
                  </button>

                  {/* Weekly Schedule - appears right below selected split */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden">
                        <div className="glass-card rounded-2xl border border-white/8 overflow-hidden">
                          <div className="p-4 border-b border-white/5 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <h3 className="font-display font-bold text-sm">{split.name} — Weekly Schedule</h3>
                          </div>
                          <div className="divide-y divide-white/5">
                            {split.schedule.map((day, i) => {
                              const isToday = i === (today === 0 ? 6 : today - 1);
                              return (
                                <div key={day.day} className={`flex items-center gap-3 px-4 py-3 ${isToday ? "bg-violet-500/8" : ""}`}>
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${isToday ? "bg-violet-500/30 ring-1 ring-violet-500/50" : "bg-white/5"}`}>
                                    {day.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-semibold ${isToday ? "text-violet-300" : "text-white/80"}`}>{day.day}</p>
                                      {isToday && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-bold">TODAY</span>}
                                    </div>
                                    <p className="text-xs text-white/40">{day.muscles}</p>
                                  </div>
                                  <span className={`text-xs font-bold ${day.focus === "Rest" ? "text-white/30" : "text-white/70"}`}>{day.focus}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exercise Browser */}
        <div>
          {/* Focus Muscles Banner */}
          {activeSplit && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl p-4 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/25">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t.todays_focus}</p>
              <p className="text-sm font-display font-bold text-white">
                <span className="text-violet-400">{activeSplit.name}</span>
                <span className="text-muted-foreground mx-2">—</span>
                <span className="text-cyan-300">{activeSplit.schedule[today === 0 ? 6 : today - 1].muscles}</span>
              </p>
            </motion.div>
          )}

          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t.muscle_group}</p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {muscleGroups.map((group, idx) => {
              const isSelected = selectedGroup === group.id;
              const imgSrc = muscleGroupImages[group.id];
              return (
                <button
                  key={group.id}
                  onClick={() => { setSelectedGroup(group.id); setExpandedTip(null); setSearch(""); }}
                  className={`relative shrink-0 w-24 rounded-2xl overflow-hidden transition-all duration-300 ${isSelected ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background scale-105" : "opacity-70 hover:opacity-100 hover:scale-105"}`}
                  style={{ height: 72 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
                  <img src={imgSrc} alt={group.id} loading={idx < 3 ? "eager" : "lazy"} decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    onLoad={e => (e.currentTarget.style.opacity = "1")} style={{ opacity: 0 }} />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? "from-violet-700/90 via-black/40" : "from-black/80 via-black/30"} to-transparent`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span className="text-[11px] font-bold text-white leading-tight">{group.id}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.8)]">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">{selectedGroup} {t.exercises}</h2>
                <p className="text-xs text-muted-foreground">{filteredExercises.length} {t.exercises.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={handleStartGroup}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-[0_0_12px_rgba(124,58,237,0.35)] disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {isPending ? "Starting..." : "Start All"}
            </button>
          </div>

          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search_exercises}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/8 focus:border-violet-500 outline-none text-sm" />
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {exLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading exercises...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">No exercises found</p>
              </div>
            ) : (
              filteredExercises.map((ex, idx) => {
                const isExpanded = expandedTip === ex.id;
                return (
                  <motion.div key={ex.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                    <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors ${isExpanded ? "bg-violet-500/5" : ""}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-violet-400/70"}`}>
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{ex.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{ex.muscleGroup}</span>
                          <span className={`text-[10px] border rounded-full px-2 py-0 ${diffColor(ex.difficulty)}`}>{ex.difficulty || "Beginner"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setExpandedTip(isExpanded ? null : ex.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isExpanded ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-white/10"}`}>
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleStartWithExercise(ex.id, ex.name)} disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50">
                          <Play className="w-3 h-3 fill-current" /> Start
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && <ExerciseTip exercise={ex} onClose={() => setExpandedTip(null)} />}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Forge Workout CTA ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-black/60 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.2),transparent_70%)] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)]">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-base text-white flex items-center gap-1.5">
                Forge Workout
                <span className="text-[10px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
              </p>
              <p className="text-xs text-white/50 mt-0.5">Generate a custom workout based on your split, goals, and history</p>
            </div>
            <button
              onClick={handleForgeWorkout}
              disabled={forgeLoading}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-[0_0_16px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forgeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {forgeLoading ? "Forging..." : "Forge"}
            </button>
          </div>
        </motion.div>

        {recentWorkouts.length > 0 && (
          <div>
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Recent Workouts</h3>
            <div className="space-y-2">
              {recentWorkouts.slice(0, 4).map((workout: any) => (
                <motion.div key={workout.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{workout.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-muted-foreground">{(() => { try { return format(new Date(workout.date), "EEE, MMM d"); } catch { return workout.date; } })()}</p>
                      {workout.caloriesBurned > 0 && <span className="text-xs text-orange-400">🔥 {workout.caloriesBurned} kcal</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ {workout.muscleGroup || "Mixed"}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/30 pb-4">
          For reference only. Consult a healthcare professional before starting any program.
        </p>
      </div>

      {/* ── Forge Workout Modal ── */}
      <AnimatePresence>
        {forgeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.6)]">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                    Forge Workout
                    <span className="text-[10px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
                  </h2>
                  <p className="text-[11px] text-white/40">
                    {forgeLoading ? "Generating your workout..." : forgeDone ? "Your custom workout is ready" : forgeError ? "Something went wrong" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {forgeDone && (
                  <button
                    onClick={handleForgeWorkout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Regenerate
                  </button>
                )}
                <button
                  onClick={() => setForgeOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={forgeScrollRef} className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
              {forgeError ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400/60" />
                  <p className="text-sm text-red-400">{forgeError}</p>
                  <button
                    onClick={handleForgeWorkout}
                    className="mt-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : forgeText ? (
                <ForgeWorkoutDisplay text={forgeText} isDone={forgeDone} />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-violet-400 animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl border border-violet-500/30 animate-ping" />
                  </div>
                  <p className="text-sm text-white/50">Analysing your profile and history...</p>
                </div>
              )}
            </div>

            {/* Footer — only when done */}
            {forgeDone && (
              <div className="px-5 pb-6 pt-3 border-t border-white/8 shrink-0">
                <button
                  onClick={() => {
                    setForgeOpen(false);
                    handleStartGroup();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-[0_0_24px_rgba(124,58,237,0.5)] hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4 fill-current" /> Start This Workout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function ForgeWorkoutDisplay({ text, isDone }: { text: string; isDone: boolean }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("Workout Name:")) {
          const name = trimmed.replace("Workout Name:", "").trim();
          return (
            <div key={i} className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500/15 to-purple-500/10 border border-violet-500/25">
              <p className="text-[10px] uppercase tracking-widest text-violet-400/60 font-bold mb-1">Today's Plan</p>
              <p className="font-display font-bold text-lg text-white">{name}</p>
            </div>
          );
        }

        if (trimmed.startsWith("Feature: Forge Workout")) {
          return null;
        }

        const exerciseMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (exerciseMatch) {
          return (
            <div key={i} className="mt-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center shrink-0">
                {exerciseMatch[1]}
              </span>
              <p className="font-display font-bold text-sm text-white">{exerciseMatch[2]}</p>
            </div>
          );
        }

        if (trimmed.startsWith("Area:")) {
          return (
            <div key={i} className="ml-9 flex items-center gap-1.5 text-xs text-cyan-400/80">
              <MapPin className="w-3 h-3" />{trimmed.replace("Area:", "").trim()}
            </div>
          );
        }

        if (trimmed.startsWith("Equipment:")) {
          return (
            <div key={i} className="ml-9 flex items-center gap-1.5 text-xs text-white/40">
              <Dumbbell className="w-3 h-3" />{trimmed.replace("Equipment:", "").trim()}
            </div>
          );
        }

        if (trimmed.startsWith("Sets:") || trimmed.startsWith("Reps:") || trimmed.startsWith("Rest:")) {
          const [label, ...rest] = trimmed.split(":");
          const value = rest.join(":").trim();
          const colorMap: Record<string, string> = {
            Sets: "text-violet-400",
            Reps: "text-emerald-400",
            Rest: "text-orange-400",
          };
          return (
            <div key={i} className="ml-9 flex items-center gap-1.5 text-xs">
              <span className="text-white/30">{label}:</span>
              <span className={`font-bold ${colorMap[label] || "text-white"}`}>{value}</span>
            </div>
          );
        }

        if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          return (
            <p key={i} className="text-xs text-white/50 leading-relaxed pl-2 border-l border-white/10 ml-1 mt-3">
              {trimmed.replace(/^[-•]\s*/, "")}
            </p>
          );
        }

        return (
          <p key={i} className="text-xs text-white/50 leading-relaxed">
            {trimmed}
          </p>
        );
      })}

      {!isDone && (
        <div className="flex items-center gap-2 mt-3 text-violet-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs animate-pulse">Generating...</span>
        </div>
      )}
    </div>
  );
}
