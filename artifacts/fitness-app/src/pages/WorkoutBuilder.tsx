import { useState } from "react";
import { useLocation } from "wouter";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { useCreateWorkout, useGetExercises, useGetWorkouts } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Dumbbell, Play, Calendar, X, Target, Info, Zap, Timer, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const muscleGroups = [
  { id: "Chest", color: "from-blue-500/80 to-cyan-500/80", emoji: "💪", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=220&fit=crop" },
  { id: "Back", color: "from-violet-500/80 to-purple-500/80", emoji: "🏋️", image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=220&fit=crop" },
  { id: "Legs", color: "from-orange-500/80 to-red-500/80", emoji: "🦵", image: "https://images.unsplash.com/photo-1434652092654-250ad142a5bc?w=400&h=220&fit=crop" },
  { id: "Shoulders", color: "from-emerald-500/80 to-teal-500/80", emoji: "🎯", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=220&fit=crop" },
  { id: "Arms", color: "from-pink-500/80 to-rose-500/80", emoji: "💪", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=220&fit=crop" },
  { id: "Core", color: "from-yellow-500/80 to-orange-500/80", emoji: "⚡", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=220&fit=crop" },
  { id: "Cardio", color: "from-cyan-500/80 to-sky-500/80", emoji: "🏃", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=220&fit=crop" },
  { id: "Full Body", color: "from-gray-600/80 to-gray-800/80", emoji: "🔥", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=220&fit=crop" },
];

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string; rom: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",    focus: "Learn the movement. Light weight, perfect form.", tempo: "2-0-2", rom: "Full range — slow and controlled." },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — constant tension every rep.",        tempo: "3-1-2", rom: "Full stretch at bottom, hard squeeze at top." },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength & power. Maximal load, perfect form.",    tempo: "2-1-1", rom: "Controlled eccentric, explosive concentric." },
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

function ExerciseTip({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const scheme = repSchemes[exercise.difficulty ?? "Intermediate"] ?? repSchemes.Intermediate;
  const steps = (exercise.instructions ?? "").split(". ").filter(Boolean).slice(0, 4);
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
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
  const { toast } = useToast();

  const { data: rawExercises, isLoading: exLoading } = useGetExercises({ muscleGroup: selectedGroup });
  const { data: rawWorkouts } = useGetWorkouts();

  const exercises: Exercise[] = Array.isArray(rawExercises) ? rawExercises : [];
  const recentWorkouts = Array.isArray(rawWorkouts) ? rawWorkouts : [];

  const { mutate: createWorkout, isPending } = useCreateWorkout({
    mutation: {
      onSuccess: (data: any) => {
        if (data && typeof data === "object" && data.id) {
          setLocation(`/workout/active/${data.id}`);
        } else {
          toast({
            title: "Backend unavailable",
            description: "Workout tracking requires the server. Run the API server to save workouts.",
            variant: "destructive",
          });
        }
      },
      onError: () => {
        toast({
          title: "Couldn't start workout",
          description: "Unable to connect to the server. Check that the API is running.",
          variant: "destructive",
        });
      }
    }
  });

  const handleStartWithExercise = (exerciseId: number, exerciseName: string) => {
    createWorkout({
      data: {
        name: `${exerciseName} & More`,
        muscleGroup: selectedGroup,
        date: new Date().toISOString(),
        durationMinutes: 0,
        caloriesBurned: 0,
        notes: String(exerciseId)
      }
    });
  };

  const handleStartGroup = () => {
    createWorkout({
      data: {
        name: `${selectedGroup} Day`,
        muscleGroup: selectedGroup,
        date: new Date().toISOString(),
        durationMinutes: 0,
        caloriesBurned: 0,
        notes: ""
      }
    });
  };

  const filteredExercises = exercises.filter(ex =>
    !search || ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const diffColor = (d?: string | null) =>
    d === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : d === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-green-400 bg-green-500/10 border-green-500/20";

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Workout</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" /> {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </header>

        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Muscle Group</p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {muscleGroups.map((group, idx) => {
              const isSelected = selectedGroup === group.id;
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  onClick={() => { setSelectedGroup(group.id); setExpandedTip(null); setSearch(""); }}
                  className={`relative shrink-0 w-28 h-20 rounded-2xl overflow-hidden transition-all duration-300 ${isSelected ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background scale-105" : "opacity-70 hover:opacity-100 hover:scale-105"}`}
                >
                  <img src={group.image} alt={group.id} className="absolute inset-0 w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? "from-violet-700/90 via-black/40" : "from-black/80 via-black/30"} to-transparent`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span className="text-[11px] font-bold text-white leading-tight">{group.id}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.8)]">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </motion.button>
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
                <h2 className="font-display font-bold text-base">{selectedGroup} Exercises</h2>
                <p className="text-xs text-muted-foreground">{filteredExercises.length} exercises</p>
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
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/8 focus:border-violet-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                        <button
                          onClick={() => setExpandedTip(isExpanded ? null : ex.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isExpanded ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-white/10"}`}
                          title="Exercise tips"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartWithExercise(ex.id, ex.name)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
                        >
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
            <h3 className="font-display font-semibold text-base text-muted-foreground uppercase tracking-wider mb-3">Recent Workouts</h3>
            <div className="space-y-2">
              {recentWorkouts.slice(0, 5).map((workout: any) => (
                <motion.div key={workout.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-violet-500/20 transition-colors group cursor-pointer"
                  onClick={() => setLocation(`/workout/active/${workout.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm group-hover:text-violet-400 transition-colors">{workout.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-muted-foreground">{(() => { try { return format(new Date(workout.date), "EEE, MMM d, yyyy"); } catch { return workout.date; } })()}</p>
                      {workout.caloriesBurned > 0 && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          🔥 {workout.caloriesBurned} kcal
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {workout.muscleGroup || "Mixed"}
                  </span>
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
