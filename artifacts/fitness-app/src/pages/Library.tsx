import { useState } from "react";
import { useGetExercises, useToggleFavoriteExercise } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Search, Heart, Dumbbell, ChevronDown, X, Target, Timer, Zap, RotateCcw, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const groups = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body"];

const repSchemes: Record<string, { sets: string; reps: string; rest: string; focus: string; tempo: string }> = {
  Beginner:     { sets: "3", reps: "12–15", rest: "60 sec",    focus: "Learn the movement with light weight and perfect form.", tempo: "2-0-2" },
  Intermediate: { sets: "4", reps: "8–12",  rest: "60–90 sec", focus: "Hypertrophy — control the negative, squeeze at top.", tempo: "3-1-2" },
  Advanced:     { sets: "5", reps: "4–8",   rest: "2–3 min",   focus: "Strength — maximal load, explosive concentric.", tempo: "2-1-1" },
};

// Step-by-step exercise image maps using fitness illustration URLs
const exerciseImages: Record<string, string[]> = {
  default: [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop",
  ],
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
  const diffColor = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10 border-red-500/20" : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-green-400 bg-green-500/10 border-green-500/20";
  const images = exerciseImages[exercise.name] || exerciseImages.default;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#0f0f12] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        {/* Hero image strip */}
        <div className="flex gap-1 overflow-hidden rounded-t-3xl h-36">
          {images.slice(0, 4).map((src, i) => (
            <div key={i} className="flex-1 relative overflow-hidden">
              <img src={src} alt={`Step ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-2">
                <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">Step {i + 1}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-display font-bold text-2xl">{exercise.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-3 py-1 flex items-center gap-1"><Target className="w-3 h-3" />{exercise.muscleGroup}</span>
                {exercise.secondaryMuscles?.split(",").slice(0, 2).map(m => (
                  <span key={m} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-1 text-muted-foreground">{m.trim()}</span>
                ))}
                {exercise.equipment && <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-1">{exercise.equipment}</span>}
                <span className={`text-xs border rounded-full px-2 py-1 ${diffColor}`}>{exercise.difficulty}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Step by step */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Info className="w-3 h-3" /> Step-by-Step Instructions</h4>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.trim()}{step.endsWith('.') ? '' : '.'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Sets</p>
              <p className="font-bold text-xl">{scheme.sets}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Reps</p>
              <p className="font-bold text-lg">{scheme.reps}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Timer className="w-3 h-3" />Rest</p>
              <p className="font-bold text-sm">{scheme.rest}</p>
            </div>
          </div>

          {/* Hypertrophy tip */}
          <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-4">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Hypertrophy Focus</p>
            <p className="text-sm text-white/90">{scheme.focus} Tempo: <span className="font-bold text-cyan-400">{scheme.tempo}</span> for maximum time under tension.</p>
          </div>
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
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/exercises`] }) }
  });

  if (isLoading && !exercises) return <LoadingState message="Loading exercises..." />;

  const displayed = activeTab === "favorites" ? (exercises?.filter(e => e.isFavorite) ?? []) : (exercises ?? []);

  return (
    <PageTransition>
      <div className="space-y-5 pb-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Exercise Library</h1>
          <p className="text-muted-foreground mt-1">Discover movements, perfect your form, save your favourites.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-3">
          <button onClick={() => setActiveTab("all")} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "all" ? "bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]" : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"}`}>
            All Exercises
          </button>
          <button onClick={() => setActiveTab("favorites")} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "favorites" ? "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"}`}>
            <Heart className={`w-4 h-4 ${activeTab === "favorites" ? "fill-current" : ""}`} /> Favourites
            {exercises?.filter(e => e.isFavorite).length ? (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "favorites" ? "bg-white/20" : "bg-red-500/20 text-red-400"}`}>
                {exercises.filter(e => e.isFavorite).length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary outline-none transition-all text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {groups.map(group => (
              <button key={group} onClick={() => setFilterGroup(group)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterGroup === group ? "bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]" : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"}`}>{group}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{activeTab === "favorites" ? "No favourites yet. Tap the heart on any exercise!" : "No exercises found."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((exercise, idx) => {
              const diffColor = exercise.difficulty === "Advanced" ? "text-red-400 bg-red-500/10" : exercise.difficulty === "Intermediate" ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10";
              return (
                <motion.div key={exercise.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="glass-card rounded-2xl overflow-hidden group relative cursor-pointer hover:border-primary/30 border border-white/5 transition-all" onClick={() => setExpandedEx(exercise)}>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-black/40 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleFav({ id: exercise.id }); }} className={`p-2 rounded-full transition-all ${exercise.isFavorite ? "bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-black/20 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"}`}>
                        <Heart className={`w-4 h-4 ${exercise.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">{exercise.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">{exercise.muscleGroup}</span>
                      <span className="text-xs px-2 py-1 bg-white/5 text-muted-foreground rounded-md">{exercise.equipment}</span>
                      <span className={`text-xs px-2 py-1 rounded-md ${diffColor}`}>{exercise.difficulty}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{exercise.instructions}</p>
                  </div>
                  <div className="px-5 pb-4">
                    <div className="w-full py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl text-xs font-medium text-primary text-center transition-colors flex items-center justify-center gap-1.5">
                      <Info className="w-3 h-3" /> View Details & Steps
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Exercise detail modal */}
        <AnimatePresence>
          {expandedEx && <ExerciseModal exercise={expandedEx} onClose={() => setExpandedEx(null)} />}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
