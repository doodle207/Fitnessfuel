import { useState } from "react";
import { useGetMealPlan, useGenerateMealPlan, useGetFoodLog, useAddFoodLog } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Apple, Flame, Droplets, Plus, RefreshCw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Diet() {
  const queryClient = useQueryClient();
  const { data: mealPlan, isLoading: isPlanLoading } = useGetMealPlan();
  const { data: foodLog, isLoading: isLogLoading } = useGetFoodLog();

  const { mutate: generatePlan, isPending: isGenerating } = useGenerateMealPlan({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/diet/meal-plan`] })
    }
  });

  if (isPlanLoading || isLogLoading) return <LoadingState message="Loading nutrition data..." />;

  // Simple macro calculation logic
  const targetCalories = mealPlan?.dailyCalories || 2500;
  const targetProtein = mealPlan?.proteinG || 160;
  const targetCarbs = mealPlan?.carbsG || 250;
  const targetFat = mealPlan?.fatG || 80;

  const consumedCalories = foodLog?.reduce((sum, item) => sum + item.calories, 0) || 0;
  
  // Custom SVG Ring Component
  const MacroRing = ({ value, max, color, label, subLabel }: any) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(value / max, 1);
    const dashoffset = circumference - percent * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
            {/* Progress circle */}
            <circle 
              cx="50" cy="50" r={radius} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              strokeLinecap="round"
              className={color}
              style={{ strokeDasharray: circumference, strokeDashoffset: dashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-bold text-lg">{value}</span>
            <span className="text-[10px] text-muted-foreground">{subLabel}</span>
          </div>
        </div>
        <span className="mt-2 text-sm font-medium">{label}</span>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Nutrition</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            Fuel your body for performance.
          </p>
        </header>

        {/* Macro Summary */}
        <div className="glass-card rounded-3xl p-6 lg:p-8 border-t-4 border-t-accent">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-muted-foreground font-medium mb-1">Calories Today</h3>
              <div className="text-5xl font-display font-bold flex items-baseline gap-2">
                {consumedCalories} <span className="text-xl text-muted-foreground font-sans">/ {targetCalories} kcal</span>
              </div>
              <p className="text-sm text-accent mt-2 font-medium">
                {targetCalories - consumedCalories} remaining
              </p>
            </div>
            
            <div className="flex gap-4 sm:gap-8">
              <MacroRing value={0} max={targetProtein} color="text-primary" label="Protein" subLabel={`/ ${targetProtein}g`} />
              <MacroRing value={0} max={targetCarbs} color="text-accent" label="Carbs" subLabel={`/ ${targetCarbs}g`} />
              <MacroRing value={0} max={targetFat} color="text-yellow-500" label="Fat" subLabel={`/ ${targetFat}g`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meal Plan */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-2xl flex items-center gap-2">
                <Apple className="w-6 h-6 text-green-500" /> AI Meal Plan
              </h3>
              <button 
                onClick={() => generatePlan()}
                disabled={isGenerating}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> Generate New
              </button>
            </div>

            {mealPlan?.meals ? (
              <div className="space-y-4">
                {mealPlan.meals.map((meal, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={meal.id} 
                    className="glass-card p-4 rounded-2xl group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-primary">{meal.mealType}</h4>
                      <span className="text-sm font-medium bg-white/5 px-2 py-1 rounded-md">{meal.calories} kcal</span>
                    </div>
                    <ul className="space-y-2">
                      {meal.foods.map((food, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{food.amount} <span className="text-foreground">{food.name}</span></span>
                          <span className="text-muted-foreground">{food.calories} c</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-4 text-xs font-medium text-muted-foreground">
                      <span>P: {meal.proteinG}g</span>
                      <span>C: {meal.carbsG}g</span>
                      <span>F: {meal.fatG}g</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 rounded-2xl text-center border-dashed border-white/20">
                <p className="text-muted-foreground mb-4">No meal plan generated yet.</p>
                <button 
                  onClick={() => generatePlan()}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-medium shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all"
                >
                  Generate Plan
                </button>
              </div>
            )}
          </div>

          {/* Today's Log */}
          <div className="space-y-6">
            <h3 className="font-display font-bold text-2xl flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" /> Today's Log
            </h3>
            
            <div className="glass-card p-6 rounded-3xl space-y-4">
              {foodLog?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No food logged today.
                </div>
              ) : (
                foodLog?.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                    <div>
                      <p className="font-medium">{log.foodName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{log.mealType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{log.calories} kcal</p>
                    </div>
                  </div>
                ))
              )}

              <button className="w-full py-4 mt-4 border-2 border-dashed border-white/10 hover:border-accent/50 text-muted-foreground hover:text-accent rounded-2xl flex items-center justify-center gap-2 transition-colors font-medium">
                <Plus className="w-5 h-5" /> Add Food Entry
              </button>
            </div>

            {/* Water Tracker mini */}
            <div className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-20 text-blue-500">
                <Droplets className="w-40 h-40" />
              </div>
              <h3 className="font-display font-semibold text-xl text-blue-400 mb-2 relative z-10">Water Intake</h3>
              <div className="flex items-end gap-2 mb-4 relative z-10">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-blue-200 mb-1">/ 2000 ml</span>
              </div>
              <button className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                + 250 ml Glass
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
