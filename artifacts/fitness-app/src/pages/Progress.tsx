import { useState, useEffect, useRef } from "react";
import { useGetBodyweightLogs, useAddBodyweightLog, useGetProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { format, addDays } from "date-fns";
import { Scale, Plus, Award, Camera, Trash2, TrendingUp, X, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#7c3aed",
  Back: "#06b6d4",
  Legs: "#f97316",
  Shoulders: "#10b981",
  Arms: "#ec4899",
  Core: "#eab308",
  "Full Body": "#a78bfa",
};

const BADGE_CONFIG = [
  { key: "first_workout", emoji: "🏋️", name: "First Step", desc: "Completed your first workout", color: "from-violet-500/20 to-purple-500/20 border-violet-500/30" },
  { key: "week_streak", emoji: "🔥", name: "Week Warrior", desc: "7-day workout streak", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
  { key: "first_pr", emoji: "💪", name: "PR Crusher", desc: "Set your first personal record", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  { key: "10_workouts", emoji: "⚡", name: "Dedicated Lifter", desc: "Completed 10 workouts", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
  { key: "25_workouts", emoji: "🦾", name: "Iron Veteran", desc: "Completed 25 workouts", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
  { key: "100_workouts", emoji: "🏆", name: "Elite Athlete", desc: "Completed 100 workouts", color: "from-pink-500/20 to-rose-500/20 border-pink-500/30" },
  { key: "first_log", emoji: "🥗", name: "Nutrition Starter", desc: "Logged your first meal", color: "from-green-500/20 to-lime-500/20 border-green-500/30" },
  { key: "water_goal", emoji: "💧", name: "Hydration Hero", desc: "Hit 3000 ml water in a day", color: "from-sky-500/20 to-blue-500/20 border-sky-500/30" },
];

interface Photo { id: number; photoDataUrl: string; label: string | null; date: string; }
interface StrengthData { [muscle: string]: { date: string; maxWeight: number; exercise: string }[] }

export default function Progress() {
  const [weight, setWeight] = useState("");
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: rawWeightLogs, isLoading } = useGetBodyweightLogs({ query: { queryKey: ['fitness', 'bodyweight-logs'] } });
  const weightLogs = Array.isArray(rawWeightLogs) ? rawWeightLogs : [];

  const { mutate: logWeight, isPending: isLogging } = useAddBodyweightLog({
    mutation: {
      onSuccess: () => {
        setWeight("");
        queryClient.invalidateQueries({ queryKey: ['fitness', 'bodyweight-logs'] });
        toast({ title: "Weight logged!", description: "Your weight has been recorded." });
      },
      onError: () => {
        toast({ title: "Couldn't log weight", description: "Server unavailable. Try again later.", variant: "destructive" });
      }
    }
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [strengthData, setStrengthData] = useState<StrengthData>({});
  const [achievements, setAchievements] = useState<{ key: string; earnedAt?: string | null }[]>([]);
  const [photoLabel, setPhotoLabel] = useState("");
  const [activeTab, setActiveTab] = useState<"weight" | "strength" | "photos" | "badges">("weight");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(["Chest", "Back", "Legs"]);

  useEffect(() => {
    fetch(`${BASE}/api/progress/photos`, { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setPhotos(d)).catch(() => {});
    fetch(`${BASE}/api/progress/strength`, { credentials: "include" })
      .then(r => r.json()).then(d => d && typeof d === "object" && !Array.isArray(d) && setStrengthData(d)).catch(() => {});
    fetch(`${BASE}/api/achievements`, { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setAchievements(d)).catch(() => {});
  }, []);

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    logWeight({ data: { weightKg: parseFloat(weight), date: new Date().toISOString().split("T")[0] } });
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const today = new Date().toISOString().split("T")[0];
      try {
        const r = await fetch(`${BASE}/api/progress/photos`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoDataUrl: dataUrl, label: photoLabel || format(new Date(), "MMM d, yyyy"), date: today })
        });
        const d = await r.json();
        if (d.id) setPhotos(prev => [d, ...prev]);
        else {
          const tempPhoto: Photo = { id: Date.now(), photoDataUrl: dataUrl, label: photoLabel || format(new Date(), "MMM d, yyyy"), date: today };
          setPhotos(prev => [tempPhoto, ...prev]);
        }
      } catch {
        const tempPhoto: Photo = { id: Date.now(), photoDataUrl: dataUrl, label: photoLabel || format(new Date(), "MMM d, yyyy"), date: today };
        setPhotos(prev => [tempPhoto, ...prev]);
      }
      setPhotoLabel("");
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = async (id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`${BASE}/api/progress/photos/${id}`, { method: "DELETE", credentials: "include" });
    } catch {}
  };

  const { data: rawProfile } = useGetProfile({ query: { queryKey: ["fitness", "profile"] } });
  const safeProfile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile) ? rawProfile as any : {};

  if (isLoading) return <LoadingState message="Loading progress..." />;

  const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const actualData = sortedLogs.map(log => ({
    ...log,
    date: log.date.toString(),
    displayDate: (() => { try { return format(new Date(log.date), 'MMM d'); } catch { return String(log.date); } })(),
    actual: log.weightKg,
    predicted: undefined as number | undefined,
  }));

  // Compute 7-day prediction from last entry
  let predictionData: { displayDate: string; actual?: number; predicted: number }[] = [];
  if (actualData.length >= 1) {
    const lastEntry = actualData[actualData.length - 1];
    const lastWeight = lastEntry.weightKg;
    // Rate of change: avg daily change over all entries, else use TDEE-based estimate
    let dailyChange = 0;
    if (actualData.length >= 2) {
      const first = actualData[0];
      const daysDiff = Math.max(1, Math.round((new Date(lastEntry.date).getTime() - new Date(first.date).getTime()) / 86400000));
      dailyChange = (lastWeight - first.weightKg) / daysDiff;
    } else {
      // Use profile TDEE to estimate
      const wkg = safeProfile.weightKg || lastWeight;
      const hcm = safeProfile.heightCm || 170;
      const age = safeProfile.age || 25;
      const gender = safeProfile.gender || "male";
      const act = safeProfile.activityLevel || "moderate";
      const actMul: Record<string, number> = { sedentary: 1.2, light: 1.375, "lightly active": 1.375, moderate: 1.55, "moderately active": 1.55, active: 1.725, "very active": 1.725 };
      const bmr = 10 * wkg + 6.25 * hcm - 5 * age + (gender === "female" ? -161 : 5);
      const tdee = bmr * (actMul[act] || 1.55);
      const goal = safeProfile.fitnessGoal || "maintenance";
      const goalAdj: Record<string, number> = { "weight loss": -500, "fat loss": -500, "muscle gain": 300, maintenance: 0, "general fitness": 0 };
      const dailyCals = tdee + (goalAdj[goal] || 0);
      dailyChange = (dailyCals - tdee) / 7700;
    }

    const lastDate = new Date(lastEntry.date);
    for (let d = 1; d <= 7; d++) {
      const futureDate = addDays(lastDate, d);
      predictionData.push({
        displayDate: format(futureDate, "MMM d"),
        actual: undefined,
        predicted: parseFloat((lastWeight + dailyChange * d).toFixed(2)),
      });
    }
  }

  // Merge: actual entries + last actual point anchor + prediction dots
  const chartData: any[] = [
    ...actualData,
    // anchor the last point for both lines
    ...(actualData.length >= 1 ? [{ ...actualData[actualData.length - 1], predicted: actualData[actualData.length - 1].weightKg }] : []),
    ...predictionData,
  ];

  const allDates = [...new Set(
    selectedMuscles.flatMap(mg => (strengthData[mg] || []).map(e => e.date))
  )].sort();

  const strengthChartData = allDates.map(date => {
    const row: Record<string, string | number> = {
      date: (() => { try { return format(new Date(date), "MMM d"); } catch { return date; } })()
    };
    for (const mg of selectedMuscles) {
      const entry = (strengthData[mg] || []).find(e => e.date === date);
      if (entry) row[mg] = entry.maxWeight;
    }
    return row;
  });

  const earnedKeys = new Set(achievements.filter(a => a.earnedAt).map(a => a.key));

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Your Progress</h1>
          <p className="text-muted-foreground mt-1">Track your transformation over time.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([["weight", "⚖️ Body Weight"], ["strength", "💪 Strength"], ["photos", "📸 Photos"], ["badges", "🏆 Badges"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]' : 'bg-card border border-white/10 text-muted-foreground hover:bg-white/5'}`}>
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "weight" && (
            <motion.div key="weight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              <div className="glass-card rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-semibold text-xl flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Body Weight</h3>
                    {chartData.length > 0 && (
                      <p className="text-3xl font-bold mt-1">
                        {chartData[chartData.length - 1].weightKg} <span className="text-base font-normal text-muted-foreground">kg</span>
                      </p>
                    )}
                  </div>
                  <form onSubmit={handleLogWeight} className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" className="w-20 bg-transparent px-3 py-2 outline-none text-sm" />
                    <button type="submit" disabled={isLogging || !weight} className="bg-primary text-white p-2 rounded-lg disabled:opacity-50 hover:bg-primary/80 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                <div className="h-[300px]">
                  {actualData.length >= 1 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            formatter={(v: any, name: string) => [v ? `${v} kg` : null, name === "actual" ? "Actual" : "Predicted (7d)"]}
                          />
                          {/* Actual weight — dark solid line */}
                          <Line
                            type="monotone" dataKey="actual" connectNulls={false}
                            stroke="#1e1e2e" strokeWidth={3.5}
                            dot={{ fill: '#ffffff', stroke: '#1e1e2e', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#7c3aed' }}
                          />
                          {/* Predicted — dotted violet line */}
                          <Line
                            type="monotone" dataKey="predicted" connectNulls={false}
                            stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 4"
                            dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 justify-center mt-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="w-5 h-0.5 bg-[#1e1e2e] border border-white/20 rounded inline-block" /> Actual weight
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="w-5 h-0.5 bg-violet-500 rounded inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 5px, transparent 5px, transparent 9px)" }} /> 7-day prediction
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-muted-foreground text-sm">
                      Log your weight to see the chart
                    </div>
                  )}
                </div>

                {actualData.length >= 1 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[["Start", actualData[0].weightKg], ["Current", actualData[actualData.length - 1].weightKg], ["Change", `${(actualData[actualData.length - 1].weightKg - actualData[0].weightKg).toFixed(1)} kg`]].map(([label, val]) => (
                      <div key={label as string} className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="font-bold">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "strength" && (
            <motion.div key="strength" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-semibold text-xl flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Strength Progress</h3>
                  <span className="text-xs text-muted-foreground">Max weight per muscle group</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {Object.keys(MUSCLE_COLORS).map(mg => (
                    <button key={mg} onClick={() => setSelectedMuscles(prev => prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedMuscles.includes(mg) ? 'text-white border-transparent' : 'bg-black/30 text-muted-foreground border-white/10'}`}
                      style={selectedMuscles.includes(mg) ? { backgroundColor: MUSCLE_COLORS[mg] + "40", borderColor: MUSCLE_COLORS[mg] + "60" } : {}}>
                      {mg}
                    </button>
                  ))}
                </div>

                <div className="h-[350px]">
                  {strengthChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={strengthChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} unit=" kg" />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                        {selectedMuscles.map(mg => (
                          <Line key={mg} type="monotone" dataKey={mg} stroke={MUSCLE_COLORS[mg]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-2xl gap-3">
                      <BarChart2 className="w-10 h-10 opacity-30" />
                      <p className="text-sm">Complete workouts with weight to see strength progress</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "photos" && (
            <motion.div key="photos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
              <div className="glass-card rounded-3xl p-6">
                <h3 className="font-display font-semibold text-xl flex items-center gap-2 mb-5"><Camera className="w-5 h-5 text-accent" /> Progress Photos</h3>

                <div className="flex gap-3 mb-6">
                  <input value={photoLabel} onChange={e => setPhotoLabel(e.target.value)} placeholder="Label (e.g. Week 1 Front)" className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm focus:border-primary outline-none" />
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                    <Camera className="w-4 h-4" /> Upload
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                </div>

                {photos.length === 0 ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl py-16 text-center text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Upload progress photos to track your visual transformation</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map(photo => (
                      <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-black/40">
                        <img src={photo.photoDataUrl} alt={photo.label || ""} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-sm font-medium text-white">{photo.label}</p>
                          <p className="text-xs text-white/60">{(() => { try { return format(new Date(photo.date), 'MMM d, yyyy'); } catch { return photo.date; } })()}</p>
                          <button onClick={() => deletePhoto(photo.id)} className="mt-2 w-full py-1.5 bg-red-500/80 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 hover:bg-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "badges" && (
            <motion.div key="badges" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
              <div className="glass-card rounded-3xl p-6">
                <h3 className="font-display font-semibold text-xl flex items-center gap-2 mb-5"><Award className="w-5 h-5 text-yellow-500" /> Achievements & Trophies</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {BADGE_CONFIG.map((badge, idx) => {
                    const earned = earnedKeys.has(badge.key);
                    return (
                      <motion.div key={badge.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        onClick={() => { if (!earned) { toast({ title: "🔒 Badge Locked", description: `${badge.name}: ${badge.desc}`, }); } }}
                        className={`p-4 rounded-2xl border flex flex-col items-center text-center relative transition-all ${earned ? `bg-gradient-to-br ${badge.color}` : 'bg-black/30 border-white/5 opacity-50 grayscale cursor-pointer hover:opacity-60'}`}>
                        <div className="text-4xl mb-2">{badge.emoji}</div>
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        <p className="text-[11px] text-muted-foreground leading-tight">{badge.desc}</p>
                        {earned && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        {!earned && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
                            <span className="text-[9px]">🔒</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-center text-xs text-muted-foreground/50 mt-6">
                  {earnedKeys.size} / {BADGE_CONFIG.length} badges earned
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
