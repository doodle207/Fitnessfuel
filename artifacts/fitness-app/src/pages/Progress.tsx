import { useState } from "react";
import { useGetBodyweightLogs, useAddBodyweightLog, useGetAchievements } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Scale, Plus, Award, Target, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function Progress() {
  const [weight, setWeight] = useState("");
  const queryClient = useQueryClient();

  const { data: weightLogs, isLoading: isWeightLoading } = useGetBodyweightLogs();
  const { data: achievements, isLoading: isAchLoading } = useGetAchievements();

  const { mutate: logWeight, isPending: isLogging } = useAddBodyweightLog({
    mutation: {
      onSuccess: () => {
        setWeight("");
        queryClient.invalidateQueries({ queryKey: [`/api/progress/bodyweight`] });
      }
    }
  });

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    logWeight({
      data: {
        weightKg: parseFloat(weight),
        date: new Date().toISOString()
      }
    });
  };

  if (isWeightLoading || isAchLoading) return <LoadingState message="Loading progress..." />;

  // Prepare chart data
  const chartData = [...(weightLogs || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(log => ({
    ...log,
    displayDate: format(new Date(log.date), 'MMM d')
  }));

  return (
    <PageTransition>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Your Progress</h1>
          <p className="text-muted-foreground mt-2">Track your transformation over time.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-semibold text-xl flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" /> Body Weight
                  </h3>
                  {chartData.length > 0 && (
                    <p className="text-3xl font-bold mt-2">
                      {chartData[chartData.length - 1].weightKg} <span className="text-base font-normal text-muted-foreground">kg</span>
                    </p>
                  )}
                </div>
                
                <form onSubmit={handleLogWeight} className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <input 
                    type="number" 
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="New weight"
                    className="w-24 bg-transparent px-3 py-2 outline-none text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={isLogging || !weight}
                    className="bg-primary text-white p-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weightKg" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorWeight)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-muted-foreground">
                    Log your weight to see the chart
                  </div>
                )}
              </div>
            </div>
            
            {/* Visual Progress Placeholder */}
            <div className="glass-card rounded-3xl p-6 border border-accent/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
              <h3 className="font-display font-semibold text-xl mb-4 relative z-10">Photos</h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="aspect-[3/4] rounded-2xl bg-black/50 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer">
                  <Plus className="w-8 h-8 mb-2" />
                  <span>Before</span>
                </div>
                <div className="aspect-[3/4] rounded-2xl bg-black/50 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors cursor-pointer">
                  <Plus className="w-8 h-8 mb-2" />
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Side */}
          <div className="space-y-6">
            <h3 className="font-display font-bold text-2xl flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" /> Trophies
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {achievements?.map((ach, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={ach.id} 
                  className={`
                    p-4 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden
                    ${ach.earnedAt 
                      ? 'bg-card border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                      : 'bg-black/40 border-white/5 opacity-60 grayscale'}
                  `}
                >
                  {/* Using requested AI images for badges based on category */}
                  <div className="w-16 h-16 mb-3 relative">
                    <img 
                      src={`${import.meta.env.BASE_URL}images/badge-${ach.category.toLowerCase()}.png`} 
                      alt={ach.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to icon if image fails to load during dev
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-primary/20 rounded-full flex items-center justify-center"><span class="text-2xl">🏆</span></div>`;
                      }}
                    />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{ach.name}</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">{ach.description}</p>
                  
                  {!ach.earnedAt && ach.target > 1 && (
                    <div className="w-full mt-3 h-1.5 bg-black rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(ach.progress / ach.target) * 100}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
