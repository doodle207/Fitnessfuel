import { useGetDashboard, useGetProfile } from "@workspace/api-client-react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { format } from "date-fns";
import { Flame, Activity, Zap, Trophy, ArrowRight, Play, Utensils, Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  const { data: stats, isLoading: isStatsLoading } = useGetDashboard();

  if (isProfileLoading || isStatsLoading) return <LoadingState message="Loading dashboard..." />;
  if (!stats || !profile) return null;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{profile.name.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM do')} • Ready to crush it today?
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <QuickAction href="/workout" icon={Play} label="Start" color="bg-primary text-white" />
            <QuickAction href="/diet" icon={Utensils} label="Food" color="bg-card text-foreground border border-white/10" />
            <QuickAction href="/progress" icon={Activity} label="Weight" color="bg-card text-foreground border border-white/10" />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Current Streak" 
            value={stats.currentStreak.toString()} 
            suffix="days" 
            icon={Flame} 
            color="text-orange-500" 
            delay={0.1} 
          />
          <StatCard 
            title="Total Workouts" 
            value={stats.totalWorkouts.toString()} 
            icon={Activity} 
            color="text-primary" 
            delay={0.2} 
          />
          <StatCard 
            title="Calories Burned" 
            value={stats.totalCaloriesBurned.toString()} 
            suffix="kcal" 
            icon={Zap} 
            color="text-accent" 
            delay={0.3} 
          />
          <StatCard 
            title="PRs Set" 
            value={stats.personalRecords.length.toString()} 
            icon={Trophy} 
            color="text-yellow-400" 
            delay={0.4} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-xl">Weekly Volume</h3>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                  Last 7 Days
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyVolume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                      {stats.weeklyVolume.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.volume > 0 ? 'hsl(262 83% 58%)' : 'hsl(240 4% 16%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Personal Records */}
            {stats.personalRecords.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Recent PRs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stats.personalRecords.map((pr, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      key={pr.exerciseId} 
                      className="glass-card p-4 rounded-2xl flex justify-between items-center border-l-4 border-l-yellow-500"
                    >
                      <div>
                        <p className="font-medium">{pr.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(pr.date), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="text-xl font-display font-bold text-yellow-500">
                        {pr.weightKg} <span className="text-sm font-sans text-muted-foreground">kg</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-xl">Recent Workouts</h3>
                <Link href="/workout" className="text-primary text-sm font-medium hover:underline flex items-center">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {stats.recentWorkouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                    <p>No workouts yet.</p>
                    <Link href="/workout" className="text-primary font-medium mt-2 inline-block hover:underline">Start your first one!</Link>
                  </div>
                ) : (
                  stats.recentWorkouts.map((workout) => (
                    <Link key={workout.id} href={`/workout/${workout.id}`} className="block group">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/50 transition-colors group-hover:bg-black/60 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="font-semibold group-hover:text-primary transition-colors">{workout.name}</h4>
                        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                          <span>{workout.muscleGroup || "Mixed"}</span>
                          <span>{format(new Date(workout.date), 'MMM d')}</span>
                        </div>
                        <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-xs font-medium">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-accent" /> {workout.exerciseCount} exercises</span>
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> {workout.caloriesBurned || 0} kcal</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Promo / Quote */}
            <div className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              {/* Using generated hero image with overlay */}
              <div className="absolute inset-0 z-0 opacity-20">
                <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Background" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-2xl mb-2 text-white neon-text-primary">Keep pushing.</h3>
                <p className="text-white/80 text-sm">"The only bad workout is the one that didn't happen."</p>
                <Link href="/workout" className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-white text-primary font-semibold rounded-xl hover:scale-105 transition-transform text-sm">
                  Let's Go
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ title, value, suffix, icon: Icon, color, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="glass-card p-5 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-colors"
    >
      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-current opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity ${color}`} />
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg bg-black/50 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <h4 className="text-3xl font-display font-bold">{value}</h4>
        {suffix && <span className="text-sm text-muted-foreground font-medium mb-1">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-transform hover:scale-105 active:scale-95 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
