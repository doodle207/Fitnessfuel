import { useState, useEffect } from "react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Apple, Flame, Droplets, Plus, RefreshCw, X, Globe, Trash2, ChevronDown, Sparkles, UtensilsCrossed, Coffee, Sun, Moon, Sandwich, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ImageFoodAnalyzer from "@/components/ImageFoodAnalyzer";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_FOODS: Record<string, { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sodiumMg: number; amount: string; mealType: string }[]> = {
  India: [
    { name: "Idli (3 pieces)", calories: 120, proteinG: 4, carbsG: 24, fatG: 1, fiberG: 1, sodiumMg: 180, amount: "3 pieces", mealType: "breakfast" },
    { name: "Sambar", calories: 130, proteinG: 6, carbsG: 22, fatG: 1.5, fiberG: 3, sodiumMg: 350, amount: "1 bowl", mealType: "breakfast" },
    { name: "Poha", calories: 250, proteinG: 5, carbsG: 45, fatG: 4, fiberG: 2, sodiumMg: 280, amount: "1 bowl", mealType: "breakfast" },
    { name: "Masala Oats", calories: 220, proteinG: 7, carbsG: 38, fatG: 3, fiberG: 4, sodiumMg: 200, amount: "1 bowl", mealType: "breakfast" },
    { name: "Whole Wheat Paratha", calories: 130, proteinG: 3, carbsG: 20, fatG: 4, fiberG: 2, sodiumMg: 120, amount: "1 piece", mealType: "breakfast" },
    { name: "Curd (Dahi)", calories: 98, proteinG: 8, carbsG: 6, fatG: 4, fiberG: 0, sodiumMg: 90, amount: "1 cup", mealType: "snack" },
    { name: "Dal Tadka", calories: 220, proteinG: 13, carbsG: 35, fatG: 2.5, fiberG: 6, sodiumMg: 400, amount: "1 bowl", mealType: "lunch" },
    { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup", mealType: "lunch" },
    { name: "Chicken Curry", calories: 280, proteinG: 30, carbsG: 5, fatG: 15, fiberG: 1, sodiumMg: 500, amount: "200g", mealType: "lunch" },
    { name: "Rajma", calories: 230, proteinG: 15, carbsG: 40, fatG: 2, fiberG: 8, sodiumMg: 350, amount: "1 bowl", mealType: "lunch" },
    { name: "Paneer Bhurji", calories: 280, proteinG: 18, carbsG: 5, fatG: 20, fiberG: 0.5, sodiumMg: 380, amount: "100g", mealType: "lunch" },
    { name: "Roti (Whole Wheat)", calories: 90, proteinG: 3, carbsG: 18, fatG: 1, fiberG: 2, sodiumMg: 80, amount: "1 piece", mealType: "lunch" },
    { name: "Roasted Chana", calories: 180, proteinG: 10, carbsG: 28, fatG: 3, fiberG: 7, sodiumMg: 80, amount: "50g", mealType: "snack" },
    { name: "Sprouted Moong Salad", calories: 120, proteinG: 9, carbsG: 18, fatG: 1, fiberG: 4, sodiumMg: 100, amount: "1 cup", mealType: "snack" },
    { name: "Banana", calories: 89, proteinG: 1, carbsG: 23, fatG: 0.3, fiberG: 2.5, sodiumMg: 1, amount: "1 medium", mealType: "snack" },
    { name: "Lassi (Plain)", calories: 150, proteinG: 7, carbsG: 22, fatG: 3.5, fiberG: 0, sodiumMg: 130, amount: "1 glass", mealType: "snack" },
    { name: "Dal Khichdi", calories: 300, proteinG: 11, carbsG: 55, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "1 bowl", mealType: "dinner" },
    { name: "Grilled Fish", calories: 200, proteinG: 35, carbsG: 0, fatG: 6, fiberG: 0, sodiumMg: 350, amount: "150g", mealType: "dinner" },
    { name: "Egg Bhurji", calories: 210, proteinG: 14, carbsG: 4, fatG: 15, fiberG: 0.5, sodiumMg: 300, amount: "2 eggs", mealType: "dinner" },
    { name: "Mixed Veg Sabzi", calories: 120, proteinG: 4, carbsG: 18, fatG: 4, fiberG: 4, sodiumMg: 200, amount: "1 bowl", mealType: "dinner" },
    { name: "Chicken Biryani", calories: 400, proteinG: 25, carbsG: 55, fatG: 8, fiberG: 2, sodiumMg: 650, amount: "1 portion", mealType: "dinner" },
  ],
  USA: [
    { name: "Oatmeal with Berries", calories: 220, proteinG: 7, carbsG: 40, fatG: 3, fiberG: 5, sodiumMg: 100, amount: "1 bowl", mealType: "breakfast" },
    { name: "Scrambled Eggs (3)", calories: 210, proteinG: 18, carbsG: 2, fatG: 15, fiberG: 0, sodiumMg: 300, amount: "3 eggs", mealType: "breakfast" },
    { name: "Greek Yogurt", calories: 130, proteinG: 17, carbsG: 9, fatG: 0.5, fiberG: 0, sodiumMg: 90, amount: "170g", mealType: "breakfast" },
    { name: "Whole Wheat Toast", calories: 140, proteinG: 5, carbsG: 27, fatG: 2, fiberG: 3, sodiumMg: 260, amount: "2 slices", mealType: "breakfast" },
    { name: "Grilled Chicken Breast", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5, fiberG: 0, sodiumMg: 350, amount: "100g", mealType: "lunch" },
    { name: "Brown Rice", calories: 215, proteinG: 5, carbsG: 45, fatG: 1.5, fiberG: 2, sodiumMg: 10, amount: "1 cup", mealType: "lunch" },
    { name: "Turkey Wrap", calories: 350, proteinG: 30, carbsG: 35, fatG: 8, fiberG: 3, sodiumMg: 700, amount: "1 wrap", mealType: "lunch" },
    { name: "Tuna Salad", calories: 180, proteinG: 30, carbsG: 2, fatG: 5, fiberG: 0, sodiumMg: 400, amount: "150g", mealType: "lunch" },
    { name: "Almonds", calories: 170, proteinG: 6, carbsG: 6, fatG: 15, fiberG: 3, sodiumMg: 0, amount: "30g", mealType: "snack" },
    { name: "Protein Shake", calories: 130, proteinG: 25, carbsG: 5, fatG: 1.5, fiberG: 0, sodiumMg: 160, amount: "1 scoop", mealType: "snack" },
    { name: "Apple", calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 4, sodiumMg: 2, amount: "1 medium", mealType: "snack" },
    { name: "Salmon Fillet", calories: 208, proteinG: 28, carbsG: 0, fatG: 10, fiberG: 0, sodiumMg: 280, amount: "150g", mealType: "dinner" },
    { name: "Quinoa", calories: 222, proteinG: 8, carbsG: 39, fatG: 3.5, fiberG: 5, sodiumMg: 15, amount: "1 cup", mealType: "dinner" },
    { name: "Ground Beef (lean)", calories: 176, proteinG: 26, carbsG: 0, fatG: 8, fiberG: 0, sodiumMg: 220, amount: "100g", mealType: "dinner" },
    { name: "Mixed Greens Salad", calories: 45, proteinG: 2, carbsG: 8, fatG: 0.5, fiberG: 2.5, sodiumMg: 50, amount: "2 cups", mealType: "dinner" },
  ],
  UK: [
    { name: "Porridge with Honey", calories: 240, proteinG: 6, carbsG: 44, fatG: 4, fiberG: 4, sodiumMg: 60, amount: "1 bowl", mealType: "breakfast" },
    { name: "Scrambled Eggs on Toast", calories: 280, proteinG: 15, carbsG: 28, fatG: 10, fiberG: 2, sodiumMg: 380, amount: "2 eggs", mealType: "breakfast" },
    { name: "Smoked Salmon Bagel", calories: 350, proteinG: 22, carbsG: 42, fatG: 8, fiberG: 2, sodiumMg: 620, amount: "1 bagel", mealType: "breakfast" },
    { name: "Chicken Tikka Masala", calories: 320, proteinG: 28, carbsG: 12, fatG: 16, fiberG: 2, sodiumMg: 550, amount: "300g", mealType: "lunch" },
    { name: "Tuna Jacket Potato", calories: 340, proteinG: 25, carbsG: 55, fatG: 3, fiberG: 5, sodiumMg: 420, amount: "1 potato", mealType: "lunch" },
    { name: "Cheddar Cheese", calories: 110, proteinG: 7, carbsG: 0.1, fatG: 9, fiberG: 0, sodiumMg: 170, amount: "30g", mealType: "snack" },
    { name: "Roast Chicken Breast", calories: 180, proteinG: 33, carbsG: 0, fatG: 4, fiberG: 0, sodiumMg: 330, amount: "150g", mealType: "dinner" },
    { name: "Roasted Vegetables", calories: 120, proteinG: 3, carbsG: 22, fatG: 3, fiberG: 5, sodiumMg: 150, amount: "1 cup", mealType: "dinner" },
    { name: "Baked Cod with Peas", calories: 240, proteinG: 35, carbsG: 15, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "200g", mealType: "dinner" },
  ],
  Japan: [
    { name: "Miso Soup", calories: 40, proteinG: 3, carbsG: 5, fatG: 1, fiberG: 1, sodiumMg: 550, amount: "1 bowl", mealType: "breakfast" },
    { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup", mealType: "breakfast" },
    { name: "Grilled Salmon", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, fiberG: 0, sodiumMg: 280, amount: "150g", mealType: "breakfast" },
    { name: "Chicken Katsu", calories: 300, proteinG: 28, carbsG: 15, fatG: 12, fiberG: 1, sodiumMg: 450, amount: "150g", mealType: "lunch" },
    { name: "Soba Noodles", calories: 220, proteinG: 9, carbsG: 44, fatG: 1, fiberG: 3, sodiumMg: 400, amount: "1 bowl", mealType: "lunch" },
    { name: "Edamame", calories: 120, proteinG: 11, carbsG: 9, fatG: 5, fiberG: 5, sodiumMg: 5, amount: "1 cup", mealType: "snack" },
    { name: "Onigiri (Tuna)", calories: 180, proteinG: 9, carbsG: 33, fatG: 2, fiberG: 0.5, sodiumMg: 280, amount: "1 piece", mealType: "snack" },
    { name: "Yakitori Chicken", calories: 90, proteinG: 12, carbsG: 4, fatG: 2.5, fiberG: 0, sodiumMg: 300, amount: "1 skewer", mealType: "dinner" },
    { name: "Gyudon Beef Bowl", calories: 420, proteinG: 22, carbsG: 60, fatG: 10, fiberG: 1, sodiumMg: 680, amount: "1 bowl", mealType: "dinner" },
  ],
  Brazil: [
    { name: "Açaí Bowl", calories: 280, proteinG: 4, carbsG: 50, fatG: 8, fiberG: 6, sodiumMg: 30, amount: "1 bowl", mealType: "breakfast" },
    { name: "Pão de Queijo", calories: 210, proteinG: 8, carbsG: 28, fatG: 8, fiberG: 0.5, sodiumMg: 200, amount: "3 pieces", mealType: "breakfast" },
    { name: "Rice & Black Beans", calories: 350, proteinG: 14, carbsG: 65, fatG: 2, fiberG: 10, sodiumMg: 350, amount: "1 plate", mealType: "lunch" },
    { name: "Grilled Picanha", calories: 300, proteinG: 28, carbsG: 0, fatG: 20, fiberG: 0, sodiumMg: 350, amount: "150g", mealType: "lunch" },
    { name: "Coconut Water", calories: 45, proteinG: 0.5, carbsG: 11, fatG: 0, fiberG: 0, sodiumMg: 100, amount: "1 cup", mealType: "snack" },
    { name: "Moqueca Fish Stew", calories: 280, proteinG: 28, carbsG: 8, fatG: 14, fiberG: 2, sodiumMg: 450, amount: "300g", mealType: "dinner" },
  ],
  Mexico: [
    { name: "Huevos Rancheros", calories: 320, proteinG: 18, carbsG: 28, fatG: 14, fiberG: 4, sodiumMg: 600, amount: "2 eggs", mealType: "breakfast" },
    { name: "Avocado Toast", calories: 230, proteinG: 6, carbsG: 22, fatG: 13, fiberG: 6, sodiumMg: 280, amount: "1 toast", mealType: "breakfast" },
    { name: "Grilled Chicken Tacos", calories: 260, proteinG: 22, carbsG: 22, fatG: 8, fiberG: 3, sodiumMg: 480, amount: "2 tacos", mealType: "lunch" },
    { name: "Black Beans", calories: 220, proteinG: 14, carbsG: 40, fatG: 1, fiberG: 14, sodiumMg: 300, amount: "1 cup", mealType: "lunch" },
    { name: "Guacamole", calories: 150, proteinG: 2, carbsG: 8, fatG: 13, fiberG: 5, sodiumMg: 200, amount: "100g", mealType: "snack" },
    { name: "Carne Asada", calories: 250, proteinG: 30, carbsG: 0, fatG: 13, fiberG: 0, sodiumMg: 420, amount: "150g", mealType: "dinner" },
    { name: "Chicken Enchilada", calories: 320, proteinG: 24, carbsG: 30, fatG: 10, fiberG: 3, sodiumMg: 750, amount: "2 pieces", mealType: "dinner" },
  ],
};

const COUNTRIES = Object.keys(COUNTRY_FOODS);
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
  fiberG?: number | null;
  sodiumMg?: number | null;
  mealType: string;
  loggedAt: string;
}

export default function Diet() {
  const [country, setCountry] = useState(() => localStorage.getItem("fittrack_country") || "India");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [activeMealTab, setActiveMealTab] = useState("breakfast");
  const [foodSearch, setFoodSearch] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "" });
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [waterData, setWaterData] = useState<{ totalMl: number; goalMl: number; logs: any[] }>({ totalMl: 0, goalMl: WATER_GOAL, logs: [] });
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setFoodLog(d)).catch(() => {});
    fetch(`${BASE}/api/progress/water`, { credentials: "include" })
      .then(r => r.json()).then(d => d.totalMl !== undefined && setWaterData(d)).catch(() => {});
    fetch(`${BASE}/api/diet/meal-plan`, { credentials: "include" })
      .then(r => r.json()).then(d => d.meals && setMealPlan(d)).catch(() => {});
    fetch(`${BASE}/api/workouts`, { credentials: "include" })
      .then(r => r.json()).then((ws: any[]) => {
        if (!Array.isArray(ws)) return;
        const todayBurned = ws.filter(w => w.date === today).reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
        setCaloriesBurned(todayBurned);
      }).catch(() => {});
  }, []);

  const saveCountry = async (c: string) => {
    setCountry(c);
    localStorage.setItem("fittrack_country", c);
    setShowCountryPicker(false);
    // Auto-regenerate the meal plan for the new country
    setIsGenerating(true);
    try {
      const r = await fetch(`${BASE}/api/diet/meal-plan`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country: c }) });
      const d = await r.json();
      if (d && d.meals) setMealPlan(d);
      else setMealPlan(buildLocalPlan(c));
    } catch {
      setMealPlan(buildLocalPlan(c));
    } finally {
      setIsGenerating(false);
    }
  };

  const buildLocalPlan = (c: string) => {
    const foods = COUNTRY_FOODS[c] || COUNTRY_FOODS.USA;
    const bf = foods.filter(f => f.mealType === "breakfast").slice(0, 2);
    const ln = foods.filter(f => f.mealType === "lunch").slice(0, 2);
    const dn = foods.filter(f => f.mealType === "dinner").slice(0, 2);
    const sum = (arr: typeof bf, key: keyof typeof bf[0]) => arr.reduce((s, f) => s + (Number(f[key]) || 0), 0);
    const all = [...bf, ...ln, ...dn];
    return {
      dailyCalories: sum(all, "calories"),
      proteinG: sum(all, "proteinG"),
      carbsG: sum(all, "carbsG"),
      fatG: sum(all, "fatG"),
      meals: [
        { id: 1, mealType: "breakfast", name: "Breakfast", calories: sum(bf, "calories"), proteinG: sum(bf, "proteinG"), foods: bf.map(f => ({ name: f.name, amount: f.amount, calories: f.calories })) },
        { id: 2, mealType: "lunch",     name: "Lunch",     calories: sum(ln, "calories"), proteinG: sum(ln, "proteinG"), foods: ln.map(f => ({ name: f.name, amount: f.amount, calories: f.calories })) },
        { id: 3, mealType: "dinner",    name: "Dinner",    calories: sum(dn, "calories"), proteinG: sum(dn, "proteinG"), foods: dn.map(f => ({ name: f.name, amount: f.amount, calories: f.calories })) },
      ]
    };
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const r = await fetch(`${BASE}/api/diet/meal-plan`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country }) });
      const d = await r.json();
      if (d && d.meals) {
        setMealPlan(d);
      } else {
        setMealPlan(buildLocalPlan(country));
      }
    } catch {
      setMealPlan(buildLocalPlan(country));
    } finally {
      setIsGenerating(false);
    }
  };

  const addFoodToLog = (entry: FoodLogEntry) => {
    setFoodLog(prev => {
      const next = [...prev, entry];
      localStorage.setItem("fittrack_food_cal_today", String(next.reduce((s, f) => s + f.calories, 0)));
      return next;
    });
  };

  const logFood = async (food: any, mealType: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tempId = Date.now();
    const tempEntry: FoodLogEntry = {
      id: tempId, foodName: food.name, calories: food.calories,
      proteinG: food.proteinG ?? 0, carbsG: food.carbsG ?? 0, fatG: food.fatG ?? 0,
      fiberG: food.fiberG ?? 0, sodiumMg: food.sodiumMg ?? 0,
      mealType, loggedAt: today,
    };
    addFoodToLog(tempEntry);
    setShowFoodModal(false);
    try {
      const r = await fetch(`${BASE}/api/diet/food-log`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, foodName: food.name, calories: food.calories, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG, fiberG: food.fiberG, sodiumMg: food.sodiumMg, servingSize: food.amount, mealType }),
      });
      const d = await r.json();
      if (d && d.id) {
        setFoodLog(prev => prev.map(e => e.id === tempId ? d : e));
      }
    } catch {}
  };

  const logCustomFood = async () => {
    const today = new Date().toISOString().split("T")[0];
    if (!customFood.name || !customFood.calories) return;
    const tempId = Date.now();
    const tempEntry: FoodLogEntry = {
      id: tempId, foodName: customFood.name,
      calories: parseInt(customFood.calories) || 0,
      proteinG: parseFloat(customFood.proteinG) || 0,
      carbsG: parseFloat(customFood.carbsG) || 0,
      fatG: parseFloat(customFood.fatG) || 0,
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
      if (d && d.id) {
        setFoodLog(prev => prev.map(e => e.id === tempId ? d : e));
      }
    } catch {}
  };

  const deleteFood = async (id: number) => {
    setFoodLog(prev => {
      const next = prev.filter(f => f.id !== id);
      localStorage.setItem("fittrack_food_cal_today", String(next.reduce((s, f) => s + f.calories, 0)));
      return next;
    });
    try {
      await fetch(`${BASE}/api/diet/food-log/${id}`, { method: "DELETE", credentials: "include" });
    } catch {}
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
  const targetCal = mealPlan?.dailyCalories || 2200;
  const targetProtein = mealPlan?.proteinG || 0;
  const targetCarbs = mealPlan?.carbsG || 0;
  const targetFat = mealPlan?.fatG || 0;
  const waterPct = Math.min(waterData.totalMl / WATER_GOAL, 1);
  const countryFoods = COUNTRY_FOODS[country] || COUNTRY_FOODS.USA;
  const filteredFoods = countryFoods.filter(f =>
    f.mealType === activeMealTab && (!foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="space-y-5 max-w-5xl mx-auto pb-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Nutrition</h1>
            <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE, MMMM do")}</p>
          </div>
        </header>

        {/* Calorie Summary */}
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
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.min(eatenCalories / targetCal, 1) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-violet-500"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Target: {targetCal} kcal/day</p>

          {/* Macro progress bars */}
          {targetProtein > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Protein", eaten: eatenProtein, target: targetProtein, color: "bg-blue-400", text: "text-blue-400" },
                { label: "Carbs", eaten: eatenCarbs, target: targetCarbs, color: "bg-green-400", text: "text-green-400" },
                { label: "Fat", eaten: eatenFat, target: targetFat, color: "bg-orange-400", text: "text-orange-400" },
              ].map(({ label, eaten, target, color, text }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={`font-semibold ${text}`}>{label}</span>
                    <span className="text-muted-foreground">{eaten}/{target}g</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-1000`}
                      style={{ width: `${Math.min(eaten / Math.max(target, 1), 1) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Food Log - Left 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Food Log Header with Country Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display font-bold text-lg flex-1">Today's Log</h2>
              <button
                onClick={() => setShowCountryPicker(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Globe className="w-4 h-4 text-violet-400" /> {country} <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowImageAnalyzer(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] backdrop-blur-sm"
                title="Scan food with AI"
              >
                <Camera className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_0_6px_rgba(124,58,237,0.6)]" />
              </button>
              <button
                onClick={() => { setShowFoodModal(true); setShowCustomForm(false); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-[0_0_10px_rgba(124,58,237,0.3)]"
              >
                <Plus className="w-4 h-4" /> Add Food
              </button>
            </div>

            {/* Country Picker Inline */}
            <AnimatePresence>
              {showCountryPicker && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Select Country</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COUNTRIES.map(c => (
                        <button key={c} onClick={() => saveCountry(c)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${country === c ? "bg-violet-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]" : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Meal Type Tabs */}
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

            {/* Entries for selected meal */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
              {(() => {
                const mealEntries = foodLog.filter(f => f.mealType === activeMealTab);
                const mt = MEAL_TYPES.find(m => m.id === activeMealTab)!;
                return (
                  <>
                    <div className={`px-4 py-3 flex items-center justify-between border-b border-white/5`}>
                      <div className="flex items-center gap-2">
                        <mt.icon className={`w-4 h-4 ${mt.color}`} />
                        <span className="font-semibold text-sm">{mt.label}</span>
                        <span className="text-xs text-muted-foreground">({mealEntries.length} items)</span>
                      </div>
                      <span className={`text-sm font-bold ${mt.color}`}>
                        {mealEntries.reduce((s, f) => s + f.calories, 0)} kcal
                      </span>
                    </div>
                    {mealEntries.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <mt.icon className={`w-8 h-8 mx-auto mb-2 opacity-20 ${mt.color}`} />
                        <p className="text-sm">No {mt.label.toLowerCase()} logged</p>
                        <button onClick={() => setShowFoodModal(true)} className={`text-xs mt-2 ${mt.color} hover:underline font-medium`}>
                          + Add {mt.label}
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/3">
                        {mealEntries.map(entry => (
                          <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{entry.foodName}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.proteinG ? `P: ${entry.proteinG}g` : ""}{entry.carbsG ? ` C: ${entry.carbsG}g` : ""}{entry.fatG ? ` F: ${entry.fatG}g` : ""}
                              </p>
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
          </div>

          {/* Right sidebar - Hydration + AI Plan */}
          <div className="space-y-4">
            {/* Hydration */}
            <div className="glass-card rounded-3xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" /> Hydration
                </h3>
                <span className="text-xs text-cyan-400 font-semibold">{waterData.totalMl} / {WATER_GOAL} ml</span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${waterPct * 100}%` }}
                  transition={{ duration: 1 }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
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

            {/* AI Meal Plan */}
            <div className="glass-card rounded-3xl p-5 border border-white/5">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> AI Meal Plan
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Generate a personalized meal plan based on <span className="text-violet-400 font-medium">{country}</span> foods.</p>
              <button
                onClick={generatePlan}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? "Generating..." : "Generate Plan"}
              </button>

              {mealPlan && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[["Cal", mealPlan.dailyCalories, "kcal", "text-violet-400"], ["Protein", mealPlan.proteinG, "g", "text-blue-400"], ["Carbs", mealPlan.carbsG, "g", "text-green-400"]].map(([k, v, u, c]) => (
                      <div key={k as string} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                        <p className={`font-bold text-sm ${c}`}>{v}</p>
                        <p className="text-[10px] text-muted-foreground">{k} {u}</p>
                      </div>
                    ))}
                  </div>
                  {mealPlan.meals?.slice(0, 3).map((meal: any) => (
                    <div key={meal.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs font-semibold text-violet-400 capitalize">{meal.mealType}</p>
                      <p className="font-medium text-sm mt-0.5">{meal.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {meal.calories} kcal · {meal.proteinG}g protein
                      </p>
                      {meal.foods?.slice(0, 3).map((food: any) => (
                        <div key={food.name} className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{food.name} ({food.amount})</span>
                          <span>{food.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Image Food Analyzer */}
        <AnimatePresence>
          {showImageAnalyzer && (
            <ImageFoodAnalyzer
              activeMealTab={activeMealTab}
              onFoodLogged={(entry) => {
                addFoodToLog(entry);
              }}
              onClose={() => setShowImageAnalyzer(false)}
            />
          )}
        </AnimatePresence>

        {/* Food Log Modal */}
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

                <div className="p-4 border-b border-white/5">
                  <div className="flex gap-2">
                    <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                      placeholder={`Search ${country} ${activeMealTab} foods...`}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    <button onClick={() => setShowCustomForm(v => !v)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${showCustomForm ? "bg-violet-600/20 border-violet-500/30 text-violet-400" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                      Custom
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {showCustomForm ? (
                    <div className="p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Food</p>
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
                        className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 transition-colors disabled:opacity-50">
                        Add to {MEAL_TYPES.find(m => m.id === activeMealTab)?.label}
                      </button>
                    </div>
                  ) : filteredFoods.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No foods found for this meal type</p>
                      <button onClick={() => setShowCustomForm(true)} className="text-violet-400 text-xs mt-2 hover:underline">Add custom food</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/3">
                      {filteredFoods.map(food => (
                        <button key={food.name}
                          onClick={() => logFood(food, activeMealTab)}
                          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-violet-500/8 transition-colors text-left group">
                          <div>
                            <p className="font-medium text-sm group-hover:text-violet-400 transition-colors">{food.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{food.amount} · P:{food.proteinG}g C:{food.carbsG}g F:{food.fatG}g</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-sm">{food.calories}</span>
                            <span className="text-xs text-muted-foreground">kcal</span>
                            <Plus className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
