import { useState } from "react";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/ui/LoadingState";
import { useCreateWorkout } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Dumbbell, Activity, Play, Calendar } from "lucide-react";

const muscleGroups = [
  { id: "Chest", color: "from-blue-500 to-cyan-500", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop" },
  { id: "Back", color: "from-violet-500 to-purple-500", image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=500&h=300&fit=crop" },
  { id: "Legs", color: "from-orange-500 to-red-500", image: "https://images.unsplash.com/photo-1434652092654-250ad142a5bc?w=500&h=300&fit=crop" },
  { id: "Shoulders", color: "from-emerald-500 to-teal-500", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=300&fit=crop" },
  { id: "Arms", color: "from-pink-500 to-rose-500", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop" },
  { id: "Core", color: "from-yellow-500 to-orange-500", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=300&fit=crop" },
  { id: "Full Body", color: "from-gray-700 to-gray-900", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=500&h=300&fit=crop" }
];

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<string>("Chest");
  const [workoutName, setWorkoutName] = useState("");

  const { mutate: createWorkout, isPending } = useCreateWorkout({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/workout/active/${data.id}`);
      }
    }
  });

  const handleStart = () => {
    createWorkout({
      data: {
        name: workoutName || `${selectedGroup} Day`,
        muscleGroup: selectedGroup,
        date: new Date().toISOString(),
        durationMinutes: 0,
        caloriesBurned: 0,
        notes: ""
      }
    });
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Start Workout</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </header>

        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Workout Name (Optional)</label>
            <input 
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder={`${selectedGroup} Day`}
              className="w-full px-5 py-4 rounded-2xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Target Muscle Group
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">{selectedGroup} Selected</span>
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {muscleGroups.map((group, idx) => {
                const isSelected = selectedGroup === group.id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`
                      relative h-32 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.98]' : 'hover:scale-105 opacity-70 hover:opacity-100'}
                    `}
                  >
                    {/* Unsplash image placeholder for muscle group visual */}
                    <img src={group.image} alt={group.id} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? 'from-primary/80 via-black/50' : 'from-black/90 via-black/40'} to-transparent`} />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <h3 className="font-display font-bold text-white text-lg">{group.id}</h3>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-[0_0_10px_rgba(124,58,237,0.8)]">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              onClick={handleStart}
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
            >
              {isPending ? "Starting..." : "Begin Session"}
              <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
