import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetWorkout, useGetExercises, useAddSet } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Dumbbell, Plus, Check, X, Timer, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ActiveWorkout() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workoutId = parseInt(id || "0");
  const queryClient = useQueryClient();

  const { data: workout, isLoading: isWorkoutLoading } = useGetWorkout(workoutId);
  const { data: exercises, isLoading: isExLoading } = useGetExercises();
  
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");

  const { mutate: addSet, isPending: isAddingSet } = useAddSet({
    mutation: {
      onSuccess: () => {
        // Invalidate to refresh the workout details
        queryClient.invalidateQueries({ queryKey: [`/api/workouts/${workoutId}`] });
      }
    }
  });

  if (isWorkoutLoading || isExLoading) return <LoadingState message="Loading session..." />;
  if (!workout) return <div>Workout not found</div>;

  // Group existing sets by exercise
  const setsByExercise = workout.sets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<number, typeof workout.sets>);

  const handleAddSet = (exerciseId: number) => {
    const existingSets = setsByExercise[exerciseId] || [];
    addSet({
      workoutId,
      data: {
        exerciseId,
        setNumber: existingSets.length + 1,
        reps: parseInt(reps),
        weightKg: parseFloat(weight),
        notes: ""
      }
    });
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
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

        {/* Existing Exercises & Sets */}
        <div className="space-y-6">
          {Object.entries(setsByExercise).map(([exIdStr, sets]) => {
            const exId = parseInt(exIdStr);
            const exercise = exercises?.find(e => e.id === exId);
            if (!exercise) return null;

            const isExpanded = activeExerciseId === exId;

            return (
              <div key={exId} className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <div 
                  className="p-4 bg-black/40 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => setActiveExerciseId(isExpanded ? null : exId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">{sets.length} sets completed</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 bg-black/20">
                        {/* Headers */}
                        <div className="flex text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                          <div className="w-12 text-center">Set</div>
                          <div className="flex-1 text-center">kg</div>
                          <div className="flex-1 text-center">Reps</div>
                          <div className="w-10"></div>
                        </div>

                        {/* Completed Sets */}
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

                        {/* Add New Set Form */}
                        <div className="flex items-center bg-primary/10 rounded-xl p-2 px-4 border border-primary/20 mt-4">
                          <div className="w-12 text-center font-bold text-primary">{sets.length + 1}</div>
                          <div className="flex-1 px-2">
                            <input 
                              type="number" 
                              value={weight}
                              onChange={e => setWeight(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-2 focus:border-primary outline-none"
                              placeholder="kg"
                            />
                          </div>
                          <div className="flex-1 px-2">
                            <input 
                              type="number" 
                              value={reps}
                              onChange={e => setReps(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg text-center py-2 focus:border-primary outline-none"
                              placeholder="reps"
                            />
                          </div>
                          <div className="w-10 flex justify-center">
                            <button 
                              onClick={() => handleAddSet(exId)}
                              disabled={isAddingSet}
                              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/80 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Add Exercise Button */}
        {!showExerciseSelector ? (
          <button 
            onClick={() => setShowExerciseSelector(true)}
            className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary rounded-2xl flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> Add Exercise
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Select Exercise</h3>
              <button onClick={() => setShowExerciseSelector(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {exercises?.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setActiveExerciseId(ex.id);
                    setShowExerciseSelector(false);
                    // Automatically add the first empty set input area by making it active
                  }}
                  className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-primary/20 border border-white/5 hover:border-primary/50 rounded-xl transition-all text-left group"
                >
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                  </div>
                  <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
