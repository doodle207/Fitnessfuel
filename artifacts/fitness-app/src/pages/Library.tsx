import { useState } from "react";
import { useGetExercises, useToggleFavoriteExercise } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Search, Heart, Filter, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

export default function Library() {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("All");
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useGetExercises({ 
    search: search || undefined,
    muscleGroup: filterGroup !== "All" ? filterGroup : undefined
  });

  const { mutate: toggleFav } = useToggleFavoriteExercise({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/exercises`] })
    }
  });

  const groups = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

  if (isLoading && !exercises) return <LoadingState message="Loading exercises..." />;

  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Exercise Library</h1>
          <p className="text-muted-foreground mt-2">Discover new movements and perfect your form.</p>
        </header>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="overflow-x-auto hide-scrollbar flex gap-2 pb-2 md:pb-0 max-w-full">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setFilterGroup(group)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterGroup === group 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]" 
                  : "bg-card border border-border text-muted-foreground hover:bg-white/5"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises?.map((exercise, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={exercise.id}
              className="glass-card p-5 rounded-2xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-black/40 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <button 
                  onClick={() => toggleFav({ id: exercise.id })}
                  className={`p-2 rounded-full transition-colors ${
                    exercise.isFavorite 
                    ? "bg-red-500/20 text-red-500" 
                    : "bg-black/20 text-muted-foreground hover:text-white"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${exercise.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold font-display mb-1">{exercise.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                    {exercise.muscleGroup}
                  </span>
                  <span className="text-xs px-2 py-1 bg-white/5 text-muted-foreground rounded-md border border-white/10">
                    {exercise.equipment}
                  </span>
                  <span className="text-xs px-2 py-1 bg-white/5 text-muted-foreground rounded-md border border-white/10">
                    {exercise.difficulty}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {exercise.instructions}
                </p>
              </div>
            </motion.div>
          ))}
          {exercises?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No exercises found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
