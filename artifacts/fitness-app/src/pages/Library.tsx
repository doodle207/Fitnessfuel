import { useState } from "react";
import { useGetExercises, useToggleFavoriteExercise } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Search, Heart, Dumbbell, X, Target, Timer, Zap, Info, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const groups = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body"];

const groupColors: Record<string, { from: string; to: string; light: string }> = {
  Chest:     { from: "from-blue-600",    to: "to-cyan-500",    light: "text-blue-400" },
  Back:      { from: "from-violet-600",  to: "to-purple-500",  light: "text-violet-400" },
  Legs:      { from: "from-orange-600",  to: "to-red-500",     light: "text-orange-400" },
  Shoulders: { from: "from-emerald-600", to: "to-teal-500",    light: "text-emerald-400" },
  Arms:      { from: "from-pink-600",    to: "to-rose-500",    light: "text-pink-400" },
  Core:      { from: "from-yellow-600",  to: "to-orange-500",  light: "text-yellow-400" },
  Cardio:    { from: "from-cyan-600",    to: "to-sky-500",     light: "text-cyan-400" },
  "Full Body": { from: "from-gray-600",  to: "to-slate-500",   light: "text-gray-400" },
};

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",    focus: "Learn the movement with light weight and perfect form.", tempo: "2-0-2" },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — control the negative, squeeze at top.", tempo: "3-1-2" },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength — maximal load, explosive concentric.", tempo: "2-1-1" },
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

function ExerciseModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const scheme = repSchemes[exercise.difficulty ?? "Intermediate"] ?? repSchemes.Intermediate;
  const steps = (exercise.instructions ?? "").split(". ").filter(Boolean);
  const diffColor = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-green-400 bg-green-500/10 border-green-500/20";
  const gc = groupColors[exercise.muscleGroup] || groupColors.Chest;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-lg p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0a0a12] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        {/* Gradient header */}
        <div className={`h-28 bg-gradient-to-br ${gc.from} ${gc.to} relative overflow-hidden rounded-t-3xl`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-end justify-between w-full">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`text-[10px] border rounded-full px-2 py-0.5 ${diffColor}`}>{exercise.difficulty}</span>
                  {exercise.equipment && <span className="text-[10px] bg-black/40 text-white/80 border border-white/20 rounded-full px-2 py-0.5">{exercise.equipment}</span>}
                </div>
                <h2 className="font-display font-black text-2xl text-white drop-shadow-lg">{exercise.name}</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-black/30 hover:bg-black/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Muscle tags */}
          <div className="flex flex-wrap gap-2">
            <span className={`flex items-center gap-1 text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full px-3 py-1`}>
              <Target className="w-3 h-3" /> {exercise.muscleGroup}
            </span>
            {exercise.secondaryMuscles?.split(",").slice(0, 3).map(m => (
              <span key={m} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-1 text-muted-foreground">{m.trim()}</span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sets", value: scheme.sets, icon: null },
              { label: "Reps", value: scheme.reps, icon: null },
              { label: "Rest", value: scheme.rest, icon: Timer },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-3.5 text-center border border-white/8">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  {Icon && <Icon className="w-3 h-3" />}{label}
                </p>
                <p className="font-display font-bold text-lg">{value}</p>
              </div>
            ))}
          </div>

          {/* Hypertrophy tip */}
          <div className="bg-gradient-to-r from-violet-500/12 to-cyan-500/12 border border-violet-500/25 rounded-2xl p-4">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Hypertrophy Focus
            </p>
            <p className="text-sm text-white/85">{scheme.focus}</p>
            <p className="text-xs text-cyan-400 mt-1.5 font-semibold">Tempo: {scheme.tempo} — time under tension</p>
          </div>

          {/* Instructions */}
          {steps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Step-by-Step Guide
              </h4>
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gc.from} ${gc.to} flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5 shadow-sm`}>{i + 1}</div>
                    <p className="text-sm text-white/75 leading-relaxed">{step.trim()}{step.endsWith(".") ? "" : "."}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Library() {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [expandedEx, setExpandedEx] = useState<Exercise | null>(null);
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useGetExercises({
    search: search || undefined,
    muscleGroup: filterGroup !== "All" ? filterGroup : undefined,
  });

  const { mutate: toggleFav } = useToggleFavoriteExercise({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/exercises"] }) }
  });

  if (isLoading && !exercises) return <LoadingState message="Loading library..." />;

  const displayed = activeTab === "favorites" ? (exercises?.filter(e => e.isFavorite) ?? []) : (exercises ?? []);
  const favCount = exercises?.filter(e => e.isFavorite).length ?? 0;

  return (
    <PageTransition>
      <div className="space-y-5 pb-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
            Exercise Library
            <span className="text-sm font-sans font-normal px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
              {displayed.length} exercises
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Discover movements, perfect your form, save favourites.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === "all" ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]" : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"}`}>
            <Dumbbell className="w-4 h-4" /> All Exercises
          </button>
          <button onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === "favorites" ? "bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.35)]" : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"}`}>
            <Heart className={`w-4 h-4 ${activeTab === "favorites" ? "fill-current" : ""}`} />
            Favourites
            {favCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "favorites" ? "bg-white/25" : "bg-red-500/20 text-red-400"}`}>{favCount}</span>}
          </button>
        </div>

        {/* Search + Group filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises by name..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none transition-all text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {groups.map(group => {
              const gc = groupColors[group];
              const isActive = filterGroup === group;
              return (
                <button key={group} onClick={() => setFilterGroup(group)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${isActive
                    ? gc ? `bg-gradient-to-r ${gc.from} ${gc.to} text-white border-transparent shadow-lg` : "bg-violet-600 text-white border-transparent"
                    : "bg-white/4 border-white/10 text-muted-foreground hover:bg-white/10"
                  }`}>
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {activeTab === "favorites" ? (
              <>
                <Heart className="w-14 h-14 mx-auto mb-4 opacity-15" />
                <p className="font-medium">No favourites yet</p>
                <p className="text-sm mt-1 opacity-60">Tap the heart icon on any exercise to save it</p>
              </>
            ) : (
              <>
                <Dumbbell className="w-14 h-14 mx-auto mb-4 opacity-15" />
                <p className="font-medium">No exercises found</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((exercise, idx) => {
              const gc = groupColors[exercise.muscleGroup] || groupColors.Chest;
              const diffBadge = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10"
                : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10"
                : "text-green-400 bg-green-500/10";

              return (
                <motion.div key={exercise.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.025 }}
                  className="group relative glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 border border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => setExpandedEx(exercise)}
                >
                  {/* Top gradient accent */}
                  <div className={`h-1 w-full bg-gradient-to-r ${gc.from} ${gc.to} opacity-80`} />

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gc.from} ${gc.to} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleFav({ id: exercise.id }); }}
                        className={`p-2 rounded-full transition-all ${exercise.isFavorite ? "bg-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]" : "bg-black/20 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"}`}
                      >
                        <Heart className={`w-4 h-4 ${exercise.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <h3 className={`font-display font-bold text-base mb-2 transition-colors group-hover:${gc.light}`}>{exercise.name}</h3>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold ${gc.light} bg-current/10`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <span className={gc.light}>{exercise.muscleGroup}</span>
                      </span>
                      {exercise.equipment && (
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 text-muted-foreground">{exercise.equipment}</span>
                      )}
                      <span className={`text-[11px] px-2.5 py-1 rounded-xl ${diffBadge}`}>{exercise.difficulty}</span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{exercise.instructions}</p>
                  </div>

                  <div className="px-5 pb-4">
                    <div className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${gc.light} bg-white/5 border-white/8 group-hover:bg-gradient-to-r group-hover:text-white group-hover:border-transparent group-hover:shadow-md`}
                      style={{}}>
                      <Info className="w-3 h-3" />
                      <span className="group-hover:hidden">View Details</span>
                      <span className="hidden group-hover:inline">View Details & Steps</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {expandedEx && <ExerciseModal exercise={expandedEx} onClose={() => setExpandedEx(null)} />}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
