import { useState, useEffect } from "react";
import { PageTransition } from "@/components/ui/LoadingState";
import { useGetProfile } from "@workspace/api-client-react";
import { Apple, Flame, Droplets, Plus, X, Trash2, ChevronDown, UtensilsCrossed, Coffee, Sun, Moon, Sandwich, Camera, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ImageFoodAnalyzer from "@/components/ImageFoodAnalyzer";
import AdBanner from "@/components/AdBanner";
import UpgradeModal from "@/components/UpgradeModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { id: "lunch", label: "Lunch", icon: Sun, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { id: "snack", label: "Snacks", icon: Sandwich, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { id: "dinner", label: "Dinner", icon: Moon, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
];
const WATER_GOAL = 3000;

interface FoodLogEntry {
  id: number;
  foodName: string;
  calories: number;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  mealType: string;
  loggedAt: string;
}

export default function Diet() {
  const { data: rawProfile } = useGetProfile({ query: { queryKey: ['fitness', 'profile-diet'] } });
  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile) ? rawProfile as any : null;

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [activeMealTab, setActiveMealTab] = useState("breakfast");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "" });
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [waterData, setWaterData] = useState<{ totalMl: number; goalMl: number; logs: any[] }>({ totalMl: 0, goalMl: WATER_GOAL, logs: [] });
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [smartFoodName, setSmartFoodName] = useState("");
  const [smartFoodWeight, setSmartFoodWeight] = useState("");
  const [smartEstimate, setSmartEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setFoodLog(d)).catch(() => {});
    fetch(`${BASE}/api/progress/water`, { credentials: "include" })
      .then(r => r.json()).then(d => d.totalMl !== undefined && setWaterData(d)).catch(() => {});
    fetch(`${BASE}/api/workouts`, { credentials: "include" })
      .then(r => r.json()).then((ws: any[]) => {
        if (!Array.isArray(ws)) return;
        const todayBurned = ws.filter(w => w.date === today).reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
        setCaloriesBurned(todayBurned);
      }).catch(() => {});
  }, []);

  const addFoodToLog = (entry: FoodLogEntry) => {
    setFoodLog(prev => [...prev, entry]);
  };

  const estimateFood = async () => {
    if (!smartFoodName.trim()) return;
    setIsEstimating(true);
    try {
      const r = await fetch(`${BASE}/api/diet/estimate-food`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: smartFoodName.trim(), weightGrams: smartFoodWeight ? parseInt(smartFoodWeight) : undefined }),
      });
      const d = await r.json();
      if (d && d.calories) setSmartEstimate(d);
    } catch {}
    setIsEstimating(false);
  };

  const logEstimatedFood = async () => {
    if (!smartEstimate) return;
    const today = new Date().toISOString().split("T")[0];
    const tempId = Date.now();
    const tempEntry: FoodLogEntry = {
      id: tempId, foodName: smartEstimate.foodName, calories: smartEstimate.calories,
      proteinG: smartEstimate.proteinG, carbsG: smartEstimate.carbsG, fatG: smartEstimate.fatG,
      mealType: activeMealTab, loggedAt: today,
    };
    addFoodToLog(tempEntry);
    setSmartFoodName(""); setSmartFoodWeight(""); setSmartEstimate(null);
    setShowFoodModal(false);
    try {
      const r = await fetch(`${BASE}/api/diet/food-log`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, foodName: smartEstimate.foodName, calories: smartEstimate.calories, proteinG: smartEstimate.proteinG, carbsG: smartEstimate.carbsG, fatG: smartEstimate.fatG, mealType: activeMealTab }),
      });
      const d = await r.json();
      if (d && d.id) setFoodLog(prev => prev.map(e => e.id === tempId ? d : e));
    } catch {}
  };

  const logCustomFood = async () => {
    const today = new Date().toISOString().split("T")[0];
    if (!customFood.name || !customFood.calories) return;
    const tempId = Date.now();
    const tempEntry: FoodLogEntry = {
      id: tempId, foodName: customFood.name, calories: parseInt(customFood.calories) || 0,
      proteinG: parseFloat(customFood.proteinG) || 0, carbsG: parseFloat(customFood.carbsG) || 0, fatG: parseFloat(customFood.fatG) || 0,
      mealType: activeMealTab, loggedAt: today,
    };
    addFoodToLog(tempEntry);
    setShowFoodModal(false);
    setCustomFood({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "" });
    try {
      const r = await fetch(`${BASE}/api/diet/food-log`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, foodName: customFood.name, calories: parseInt(customFood.calories) || 0, proteinG: parseFloat(customFood.proteinG) || 0, carbsG: parseFloat(customFood.carbsG) || 0, fatG: parseFloat(customFood.fatG) || 0, mealType: activeMealTab }),
      });
      const d = await r.json();
      if (d && d.id) setFoodLog(prev => prev.map(e => e.id === tempId ? d : e));
    } catch {}
  };

  const deleteFood = async (id: number) => {
    setFoodLog(prev => prev.filter(f => f.id !== id));
    try { await fetch(`${BASE}/api/diet/food-log/${id}`, { method: "DELETE", credentials: "include" }); } catch {}
  };

  const logWater = async (ml: number) => {
    setWaterData(prev => ({ ...prev, totalMl: prev.totalMl + ml }));
    try {
      const today = new Date().toISOString().split("T")[0];
      const r = await fetch(`${BASE}/api/progress/water`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMl: ml, date: today }) });
      const d = await r.json();
      if (d && d.totalMl !== undefined) setWaterData(d);
    } catch {}
  };

  const eatenCalories = foodLog.reduce((s, l) => s + l.calories, 0);
  const eatenProtein = Math.round(foodLog.reduce((s, l) => s + (l.proteinG || 0), 0));
  const eatenCarbs = Math.round(foodLog.reduce((s, l) => s + (l.carbsG || 0), 0));
  const eatenFat = Math.round(foodLog.reduce((s, l) => s + (l.fatG || 0), 0));

  const weightKg = profile?.weightKg || 70;
  const heightCm = profile?.heightCm || 170;
  const age = profile?.age || 25;
  const gender = profile?.gender || "male";
  const activityLevel = profile?.activityLevel || "moderate";
  const fitnessGoal = profile?.fitnessGoal || "maintenance";

  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "female" ? -161 : 5));
  const actMult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, "very active": 1.725, athlete: 1.9 };
  const tdee = Math.round(bmr * (actMult[activityLevel] ?? 1.55));
  const goalAdj: Record<string, number> = { "weight loss": -500, "muscle gain": 300, "athletic performance": 200, "recomposition": -100 };
  const targetCal = tdee + (goalAdj[fitnessGoal] ?? 0);
  const proteinTarget = Math.round(weightKg * 2.2);
  const fatTarget = Math.round(weightKg * 0.9);
  const carbsTarget = Math.max(0, Math.round((targetCal - proteinTarget * 4 - fatTarget * 9) / 4));

  const waterPct = Math.min(waterData.totalMl / WATER_GOAL, 1);

  return (
    <PageTransition>
      <div className="space-y-5 max-w-5xl mx-auto pb-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Nutrition</h1>
            <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE, MMMM do")}</p>
          </div>
        </header>

        <div className="glass-card rounded-3xl p-5 border border-white/5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Apple className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-green-400">{eatenCalories}</p>
              <p className="text-[10px] text-muted-foreground">Eaten kcal</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-orange-400">{caloriesBurned}</p>
              <p className="text-[10px] text-muted-foreground">Burned kcal</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <UtensilsCrossed className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xl font-display font-bold text-violet-400">{Math.max(0, targetCal - eatenCalories)}</p>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(eatenCalories / targetCal, 1) * 100}%` }} transition={{ duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-violet-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Target: {targetCal} kcal/day</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Protein", eaten: eatenProtein, target: proteinTarget, color: "bg-blue-400", text: "text-blue-400" },
              { label: "Carbs", eaten: eatenCarbs, target: carbsTarget, color: "bg-green-400", text: "text-green-400" },
              { label: "Fat", eaten: eatenFat, target: fatTarget, color: "bg-orange-400", text: "text-orange-400" },
            ].map(({ label, eaten, target, color, text }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className={`font-semibold ${text}`}>{label}</span>
                  <span className="text-muted-foreground">{eaten}/{target}g</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${Math.min(eaten / Math.max(target, 1), 1) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display font-bold text-lg flex-1">Today's Log</h2>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(({ id, label, icon: Icon, color, bg }) => {
                const count = foodLog.filter(f => f.mealType === id).length;
                const cals = foodLog.filter(f => f.mealType === id).reduce((s, f) => s + f.calories, 0);
                const isActive = activeMealTab === id;
                return (
                  <button key={id} onClick={() => { setActiveMealTab(id); setShowFoodModal(false); }}
                    className={`p-3 rounded-2xl border text-center transition-all ${isActive ? `${bg} border-opacity-50` : "bg-white/3 border-white/5 hover:bg-white/8"}`}>
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${isActive ? color : "text-muted-foreground"}`} />
                    <p className={`text-xs font-semibold ${isActive ? color : "text-muted-foreground"}`}>{label}</p>
                    {count > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{cals} kcal</p>}
                  </button>
                );
              })}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
              {(() => {
                const mealEntries = foodLog.filter(f => f.mealType === activeMealTab);
                const mt = MEAL_TYPES.find(m => m.id === activeMealTab)!;
                return (
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <mt.icon className={`w-4 h-4 ${mt.color}`} />
                        <span className="font-semibold text-sm">{mt.label}</span>
                        <span className="text-xs text-muted-foreground">({mealEntries.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${mt.color}`}>{mealEntries.reduce((s, f) => s + f.calories, 0)} kcal</span>
                        <button onClick={() => { setActiveMealTab(mt.id); setShowImageAnalyzer(true); }}
                          className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                          title="Scan food with AI camera">
                          <Camera className="w-3.5 h-3.5" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                        </button>
                        <button onClick={() => { setActiveMealTab(mt.id); setShowFoodModal(true); setShowCustomForm(false); }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mt.bg} ${mt.color} border border-opacity-30 hover:opacity-80`}>
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>

                    {mealEntries.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <mt.icon className={`w-8 h-8 mx-auto mb-2 opacity-20 ${mt.color}`} />
                        <p className="text-sm">No {mt.label.toLowerCase()} logged</p>
                        <button onClick={() => setShowFoodModal(true)} className={`text-xs mt-2 ${mt.color} hover:underline font-medium`}>+ Add {mt.label}</button>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/3">
                        {mealEntries.map(entry => (
                          <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{entry.foodName}</p>
                              <div className="flex gap-2 mt-1">
                                {entry.proteinG ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">P: {Math.round(Number(entry.proteinG))}g</span> : null}
                                {entry.carbsG ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">C: {Math.round(Number(entry.carbsG))}g</span> : null}
                                {entry.fatG ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">F: {Math.round(Number(entry.fatG))}g</span> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm">{entry.calories} kcal</span>
                              <button onClick={() => deleteFood(entry.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Smart Food Log — integrated into Today's Log with glow accent */}
            <div className="relative rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-cyan-950/20 p-4 shadow-[0_0_24px_rgba(124,58,237,0.12)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/5 to-cyan-600/5 pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-[0_0_14px_rgba(124,58,237,0.5)] shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Smart Food Log</h3>
                  <p className="text-[11px] text-violet-400/80">AI-estimated macros from food name</p>
                </div>
              </div>
              <div className="space-y-2">
                <input value={smartFoodName} onChange={e => setSmartFoodName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && estimateFood()}
                  placeholder="e.g. Chicken breast, 200g rice..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-violet-500/20 focus:border-violet-500 outline-none text-sm placeholder:text-white/25" />
                <div className="flex gap-2">
                  <input type="number" value={smartFoodWeight} onChange={e => setSmartFoodWeight(e.target.value)} placeholder="Weight (g) optional"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-violet-500/20 focus:border-violet-500 outline-none text-sm placeholder:text-white/25" />
                  <button onClick={estimateFood} disabled={!smartFoodName.trim() || isEstimating}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-[0_0_14px_rgba(124,58,237,0.35)]">
                    {isEstimating ? <Search className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
                    {isEstimating ? "..." : "Estimate"}
                  </button>
                </div>
              </div>
              {smartEstimate && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-violet-500/15">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-white">{smartEstimate.foodName}</p>
                      {smartEstimate.weightGrams && <p className="text-[10px] text-muted-foreground">{smartEstimate.weightGrams}g</p>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { val: smartEstimate.calories, unit: "kcal", color: "text-violet-400" },
                        { val: `${smartEstimate.proteinG}g`, unit: "Protein", color: "text-blue-400" },
                        { val: `${smartEstimate.carbsG}g`, unit: "Carbs", color: "text-green-400" },
                        { val: `${smartEstimate.fatG}g`, unit: "Fat", color: "text-orange-400" },
                      ].map(({ val, unit, color }, i) => (
                        <div key={i} className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                          <p className={`text-sm font-bold ${color}`}>{val}</p>
                          <p className="text-[9px] text-muted-foreground">{unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={logEstimatedFood}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(124,58,237,0.35)]">
                    <Plus className="w-4 h-4" /> Add to {MEAL_TYPES.find(m => m.id === activeMealTab)?.label}
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-400" /> Hydration</h3>
                <span className="text-xs text-cyan-400 font-semibold">{waterData.totalMl} / {WATER_GOAL} ml</span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${waterPct * 100}%` }} transition={{ duration: 1 }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[150, 250, 350, 500].map(ml => (
                  <button key={ml} onClick={() => logWater(ml)}
                    className="py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> +{ml}ml
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < Math.round(waterData.totalMl / 250) ? "bg-cyan-400" : "bg-white/10"}`} />
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">{Math.round(waterData.totalMl / 250)} / 12 glasses</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showImageAnalyzer && (
            <ImageFoodAnalyzer activeMealTab={activeMealTab} onFoodLogged={(entry) => addFoodToLog(entry)} onClose={() => setShowImageAnalyzer(false)} onLimitReached={() => { setShowImageAnalyzer(false); setShowUpgrade(true); }} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFoodModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4"
              onClick={() => setShowFoodModal(false)}>
              <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#0d0d14] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg">Add Food</h3>
                    <div className="flex gap-1.5 mt-2">
                      {MEAL_TYPES.map(({ id, label, color }) => (
                        <button key={id} onClick={() => setActiveMealTab(id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${activeMealTab === id ? `${color} bg-white/10` : "text-muted-foreground hover:bg-white/5"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowFoodModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-4" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Smart Estimate (AI)</p>
                    <input value={smartFoodName} onChange={e => setSmartFoodName(e.target.value)} placeholder="Food name (e.g. Dal Tadka)"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    <input type="number" value={smartFoodWeight} onChange={e => setSmartFoodWeight(e.target.value)} placeholder="Weight in grams (optional)"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    <button onClick={estimateFood} disabled={!smartFoodName.trim() || isEstimating}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                      {isEstimating ? "Estimating..." : <><Sparkles className="w-4 h-4" /> Estimate Macros</>}
                    </button>
                    {smartEstimate && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                        <p className="font-semibold text-sm">{smartEstimate.foodName}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[["Cal", smartEstimate.calories, "text-violet-400"], ["P", `${smartEstimate.proteinG}g`, "text-blue-400"], ["C", `${smartEstimate.carbsG}g`, "text-green-400"], ["F", `${smartEstimate.fatG}g`, "text-orange-400"]].map(([k, v, c]) => (
                            <div key={k as string} className="text-center">
                              <p className={`text-sm font-bold ${c}`}>{v}</p>
                              <p className="text-[9px] text-muted-foreground">{k}</p>
                            </div>
                          ))}
                        </div>
                        <button onClick={logEstimatedFood} className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500">
                          <Plus className="w-3 h-3 inline mr-1" /> Log This
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or Enter Manually</p>
                      <button onClick={logCustomFood} disabled={!customFood.name || !customFood.calories}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors disabled:opacity-40 shrink-0">
                        <Plus className="w-3 h-3" /> Add Food
                      </button>
                    </div>
                    <input value={customFood.name} onChange={e => setCustomFood(p => ({ ...p, name: e.target.value }))}
                      placeholder="Food name *" className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={customFood.calories} onChange={e => setCustomFood(p => ({ ...p, calories: e.target.value }))}
                        placeholder="Calories *" className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                      <input type="number" value={customFood.proteinG} onChange={e => setCustomFood(p => ({ ...p, proteinG: e.target.value }))}
                        placeholder="Protein (g)" className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                      <input type="number" value={customFood.carbsG} onChange={e => setCustomFood(p => ({ ...p, carbsG: e.target.value }))}
                        placeholder="Carbs (g)" className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                      <input type="number" value={customFood.fatG} onChange={e => setCustomFood(p => ({ ...p, fatG: e.target.value }))}
                        placeholder="Fat (g)" className="px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    </div>
                    <button onClick={logCustomFood} disabled={!customFood.name || !customFood.calories}
                      className="w-full py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors disabled:opacity-40">
                      <Plus className="w-3 h-3 inline mr-1" /> Log Custom Food
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showUpgrade && (
        <UpgradeModal
          trigger="scan"
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => setShowUpgrade(false)}
        />
      )}
    </PageTransition>
  );
}
