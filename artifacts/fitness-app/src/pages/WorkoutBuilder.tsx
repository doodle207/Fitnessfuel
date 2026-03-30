import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/ui/LoadingState";
import { useCreateWorkout, useGetExercises, useGetWorkouts } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Dumbbell, Play, Calendar, X, Target, Info, Zap, Search, AlertCircle, Star, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

import imgChest from "@assets/IMG_5147_1774142427972.png";
import imgBack from "@assets/IMG_5146_1774142427972.png";
import imgLegs from "@assets/IMG_5144_1774142427972.jpeg";
import imgShoulders from "@assets/IMG_5148_1774142427972.png";
import imgArms from "@assets/IMG_5151_1774142427972.jpeg";
import imgCore from "@assets/IMG_5152_1774142427972.jpeg";
import imgCardio from "@assets/IMG_5149_1774142427972.png";
import imgFullBody from "@assets/IMG_5153_1774142427972.jpeg";

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
    </PageTransition>
  );
}
