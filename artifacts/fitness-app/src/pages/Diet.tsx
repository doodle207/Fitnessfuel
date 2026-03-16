import { useState, useEffect } from "react";
import { useGetMealPlan, useGetFoodLog, useGetWaterLog, useLogWater } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { Apple, Flame, Droplets, Plus, RefreshCw, X, ChevronDown, Check, Globe, Trash2, Utensils, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Country food database (frontend)
const COUNTRY_FOODS: Record<string, { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sodiumMg: number; amount: string; mealType: string }[]> = {
  India: [
    { name: "Idli (3 pieces)", calories: 120, proteinG: 4, carbsG: 24, fatG: 1, fiberG: 1, sodiumMg: 180, amount: "3 pieces", mealType: "breakfast" },
    { name: "Sambar", calories: 130, proteinG: 6, carbsG: 22, fatG: 1.5, fiberG: 3, sodiumMg: 350, amount: "1 bowl", mealType: "breakfast" },
    { name: "Poha", calories: 250, proteinG: 5, carbsG: 45, fatG: 4, fiberG: 2, sodiumMg: 280, amount: "1 bowl", mealType: "breakfast" },
    { name: "Masala Oats", calories: 220, proteinG: 7, carbsG: 38, fatG: 3, fiberG: 4, sodiumMg: 200, amount: "1 bowl", mealType: "breakfast" },
    { name: "Upma", calories: 200, proteinG: 5, carbsG: 33, fatG: 5, fiberG: 2, sodiumMg: 300, amount: "1 bowl", mealType: "breakfast" },
    { name: "Whole Wheat Paratha", calories: 130, proteinG: 3, carbsG: 20, fatG: 4, fiberG: 2, sodiumMg: 120, amount: "1 piece", mealType: "breakfast" },
    { name: "Curd (Dahi)", calories: 98, proteinG: 8, carbsG: 6, fatG: 4, fiberG: 0, sodiumMg: 90, amount: "1 cup", mealType: "breakfast" },
    { name: "Dal Tadka", calories: 220, proteinG: 13, carbsG: 35, fatG: 2.5, fiberG: 6, sodiumMg: 400, amount: "1 bowl", mealType: "lunch" },
    { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup", mealType: "lunch" },
    { name: "Chicken Curry", calories: 280, proteinG: 30, carbsG: 5, fatG: 15, fiberG: 1, sodiumMg: 500, amount: "200g", mealType: "lunch" },
    { name: "Rajma", calories: 230, proteinG: 15, carbsG: 40, fatG: 2, fiberG: 8, sodiumMg: 350, amount: "1 bowl", mealType: "lunch" },
    { name: "Paneer Bhurji", calories: 280, proteinG: 18, carbsG: 5, fatG: 20, fiberG: 0.5, sodiumMg: 380, amount: "100g", mealType: "lunch" },
    { name: "Roti (Whole Wheat)", calories: 90, proteinG: 3, carbsG: 18, fatG: 1, fiberG: 2, sodiumMg: 80, amount: "1 piece", mealType: "lunch" },
    { name: "Chole (Chickpeas)", calories: 270, proteinG: 14, carbsG: 45, fatG: 4, fiberG: 9, sodiumMg: 420, amount: "1 bowl", mealType: "lunch" },
    { name: "Roasted Chana", calories: 180, proteinG: 10, carbsG: 28, fatG: 3, fiberG: 7, sodiumMg: 80, amount: "50g", mealType: "snack" },
    { name: "Sprouted Moong Salad", calories: 120, proteinG: 9, carbsG: 18, fatG: 1, fiberG: 4, sodiumMg: 100, amount: "1 cup", mealType: "snack" },
    { name: "Roasted Peanuts", calories: 170, proteinG: 7, carbsG: 5, fatG: 14, fiberG: 2, sodiumMg: 50, amount: "30g", mealType: "snack" },
    { name: "Banana", calories: 89, proteinG: 1, carbsG: 23, fatG: 0.3, fiberG: 2.5, sodiumMg: 1, amount: "1 medium", mealType: "snack" },
    { name: "Lassi (Plain)", calories: 150, proteinG: 7, carbsG: 22, fatG: 3.5, fiberG: 0, sodiumMg: 130, amount: "1 glass", mealType: "snack" },
    { name: "Dal Khichdi", calories: 300, proteinG: 11, carbsG: 55, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "1 bowl", mealType: "dinner" },
    { name: "Grilled Fish (Pomfret)", calories: 200, proteinG: 35, carbsG: 0, fatG: 6, fiberG: 0, sodiumMg: 350, amount: "150g", mealType: "dinner" },
    { name: "Egg Bhurji", calories: 210, proteinG: 14, carbsG: 4, fatG: 15, fiberG: 0.5, sodiumMg: 300, amount: "2 eggs", mealType: "dinner" },
    { name: "Mixed Veg Sabzi", calories: 120, proteinG: 4, carbsG: 18, fatG: 4, fiberG: 4, sodiumMg: 200, amount: "1 bowl", mealType: "dinner" },
    { name: "Chicken Biryani", calories: 400, proteinG: 25, carbsG: 55, fatG: 8, fiberG: 2, sodiumMg: 650, amount: "1 portion", mealType: "dinner" },
  ],
  USA: [
    { name: "Oatmeal with Berries", calories: 220, proteinG: 7, carbsG: 40, fatG: 3, fiberG: 5, sodiumMg: 100, amount: "1 bowl", mealType: "breakfast" },
    { name: "Scrambled Eggs (3)", calories: 210, proteinG: 18, carbsG: 2, fatG: 15, fiberG: 0, sodiumMg: 300, amount: "3 eggs", mealType: "breakfast" },
    { name: "Greek Yogurt (Non-fat)", calories: 130, proteinG: 17, carbsG: 9, fatG: 0.5, fiberG: 0, sodiumMg: 90, amount: "170g", mealType: "breakfast" },
    { name: "Whole Wheat Toast", calories: 140, proteinG: 5, carbsG: 27, fatG: 2, fiberG: 3, sodiumMg: 260, amount: "2 slices", mealType: "breakfast" },
    { name: "Protein Pancakes", calories: 300, proteinG: 25, carbsG: 35, fatG: 5, fiberG: 2, sodiumMg: 350, amount: "3 pancakes", mealType: "breakfast" },
    { name: "Grilled Chicken Breast", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5, fiberG: 0, sodiumMg: 350, amount: "100g", mealType: "lunch" },
    { name: "Brown Rice", calories: 215, proteinG: 5, carbsG: 45, fatG: 1.5, fiberG: 2, sodiumMg: 10, amount: "1 cup", mealType: "lunch" },
    { name: "Steamed Broccoli", calories: 55, proteinG: 4, carbsG: 11, fatG: 0.5, fiberG: 5, sodiumMg: 30, amount: "1 cup", mealType: "lunch" },
    { name: "Turkey Wrap", calories: 350, proteinG: 30, carbsG: 35, fatG: 8, fiberG: 3, sodiumMg: 700, amount: "1 wrap", mealType: "lunch" },
    { name: "Tuna Salad", calories: 180, proteinG: 30, carbsG: 2, fatG: 5, fiberG: 0, sodiumMg: 400, amount: "150g", mealType: "lunch" },
    { name: "Sweet Potato", calories: 103, proteinG: 2, carbsG: 24, fatG: 0.1, fiberG: 3.5, sodiumMg: 40, amount: "1 medium", mealType: "lunch" },
    { name: "Almonds", calories: 170, proteinG: 6, carbsG: 6, fatG: 15, fiberG: 3, sodiumMg: 0, amount: "30g", mealType: "snack" },
    { name: "Protein Shake", calories: 130, proteinG: 25, carbsG: 5, fatG: 1.5, fiberG: 0, sodiumMg: 160, amount: "1 scoop", mealType: "snack" },
    { name: "Apple", calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 4, sodiumMg: 2, amount: "1 medium", mealType: "snack" },
    { name: "Cottage Cheese", calories: 110, proteinG: 14, carbsG: 5, fatG: 2.5, fiberG: 0, sodiumMg: 380, amount: "1/2 cup", mealType: "snack" },
    { name: "Peanut Butter", calories: 190, proteinG: 8, carbsG: 7, fatG: 16, fiberG: 2, sodiumMg: 150, amount: "2 tbsp", mealType: "snack" },
    { name: "Salmon Fillet", calories: 208, proteinG: 28, carbsG: 0, fatG: 10, fiberG: 0, sodiumMg: 280, amount: "150g", mealType: "dinner" },
    { name: "Quinoa", calories: 222, proteinG: 8, carbsG: 39, fatG: 3.5, fiberG: 5, sodiumMg: 15, amount: "1 cup", mealType: "dinner" },
    { name: "Ground Beef (90% lean)", calories: 176, proteinG: 26, carbsG: 0, fatG: 8, fiberG: 0, sodiumMg: 220, amount: "100g", mealType: "dinner" },
    { name: "Mixed Greens Salad", calories: 45, proteinG: 2, carbsG: 8, fatG: 0.5, fiberG: 2.5, sodiumMg: 50, amount: "2 cups", mealType: "dinner" },
  ],
  UK: [
    { name: "Porridge with Honey", calories: 240, proteinG: 6, carbsG: 44, fatG: 4, fiberG: 4, sodiumMg: 60, amount: "1 bowl", mealType: "breakfast" },
    { name: "Scrambled Eggs on Toast", calories: 280, proteinG: 15, carbsG: 28, fatG: 10, fiberG: 2, sodiumMg: 380, amount: "2 eggs + 2 toast", mealType: "breakfast" },
    { name: "Smoked Salmon Bagel", calories: 350, proteinG: 22, carbsG: 42, fatG: 8, fiberG: 2, sodiumMg: 620, amount: "1 bagel", mealType: "breakfast" },
    { name: "Chicken Tikka Masala", calories: 320, proteinG: 28, carbsG: 12, fatG: 16, fiberG: 2, sodiumMg: 550, amount: "300g", mealType: "lunch" },
    { name: "Tuna Jacket Potato", calories: 340, proteinG: 25, carbsG: 55, fatG: 3, fiberG: 5, sodiumMg: 420, amount: "1 potato", mealType: "lunch" },
    { name: "Prawn Salad", calories: 180, proteinG: 20, carbsG: 8, fatG: 7, fiberG: 2, sodiumMg: 350, amount: "1 bowl", mealType: "lunch" },
    { name: "Cheddar Cheese", calories: 110, proteinG: 7, carbsG: 0.1, fatG: 9, fiberG: 0, sodiumMg: 170, amount: "30g", mealType: "snack" },
    { name: "Digestive Biscuit", calories: 70, proteinG: 1, carbsG: 10, fatG: 3, fiberG: 0.5, sodiumMg: 50, amount: "1 biscuit", mealType: "snack" },
    { name: "Roast Chicken Breast", calories: 180, proteinG: 33, carbsG: 0, fatG: 4, fiberG: 0, sodiumMg: 330, amount: "150g", mealType: "dinner" },
    { name: "Roasted Vegetables", calories: 120, proteinG: 3, carbsG: 22, fatG: 3, fiberG: 5, sodiumMg: 150, amount: "1 cup", mealType: "dinner" },
    { name: "Baked Cod with Peas", calories: 240, proteinG: 35, carbsG: 15, fatG: 4, fiberG: 5, sodiumMg: 300, amount: "200g", mealType: "dinner" },
  ],
  Japan: [
    { name: "Miso Soup", calories: 40, proteinG: 3, carbsG: 5, fatG: 1, fiberG: 1, sodiumMg: 550, amount: "1 bowl", mealType: "breakfast" },
    { name: "Steamed Rice", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, fiberG: 0.5, sodiumMg: 5, amount: "1 cup", mealType: "breakfast" },
    { name: "Grilled Salmon (朝食)", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, fiberG: 0, sodiumMg: 280, amount: "150g", mealType: "breakfast" },
    { name: "Tamago Tofu", calories: 90, proteinG: 8, carbsG: 3, fatG: 5, fiberG: 0, sodiumMg: 150, amount: "100g", mealType: "breakfast" },
    { name: "Chicken Katsu", calories: 300, proteinG: 28, carbsG: 15, fatG: 12, fiberG: 1, sodiumMg: 450, amount: "150g", mealType: "lunch" },
    { name: "Soba Noodles", calories: 220, proteinG: 9, carbsG: 44, fatG: 1, fiberG: 3, sodiumMg: 400, amount: "1 bowl", mealType: "lunch" },
    { name: "Edamame", calories: 120, proteinG: 11, carbsG: 9, fatG: 5, fiberG: 5, sodiumMg: 5, amount: "1 cup", mealType: "snack" },
    { name: "Onigiri (Tuna)", calories: 180, proteinG: 9, carbsG: 33, fatG: 2, fiberG: 0.5, sodiumMg: 280, amount: "1 piece", mealType: "snack" },
    { name: "Yakitori Chicken", calories: 90, proteinG: 12, carbsG: 4, fatG: 2.5, fiberG: 0, sodiumMg: 300, amount: "1 skewer", mealType: "dinner" },
    { name: "Tofu Steak", calories: 160, proteinG: 14, carbsG: 5, fatG: 9, fiberG: 1, sodiumMg: 200, amount: "150g", mealType: "dinner" },
    { name: "Gyudon Beef Bowl", calories: 420, proteinG: 22, carbsG: 60, fatG: 10, fiberG: 1, sodiumMg: 680, amount: "1 bowl", mealType: "dinner" },
  ],
  Brazil: [
    { name: "Pão de Queijo (3)", calories: 210, proteinG: 8, carbsG: 28, fatG: 8, fiberG: 0.5, sodiumMg: 200, amount: "3 pieces", mealType: "breakfast" },
    { name: "Açaí Bowl", calories: 280, proteinG: 4, carbsG: 50, fatG: 8, fiberG: 6, sodiumMg: 30, amount: "1 bowl", mealType: "breakfast" },
    { name: "Rice & Feijão (Black Beans)", calories: 350, proteinG: 14, carbsG: 65, fatG: 2, fiberG: 10, sodiumMg: 350, amount: "1 plate", mealType: "lunch" },
    { name: "Grilled Picanha", calories: 300, proteinG: 28, carbsG: 0, fatG: 20, fiberG: 0, sodiumMg: 350, amount: "150g", mealType: "lunch" },
    { name: "Farofa", calories: 150, proteinG: 1, carbsG: 30, fatG: 4, fiberG: 2, sodiumMg: 200, amount: "50g", mealType: "lunch" },
    { name: "Coconut Water", calories: 45, proteinG: 0.5, carbsG: 11, fatG: 0, fiberG: 0, sodiumMg: 100, amount: "1 cup", mealType: "snack" },
    { name: "Moqueca (Fish Stew)", calories: 280, proteinG: 28, carbsG: 8, fatG: 14, fiberG: 2, sodiumMg: 450, amount: "300g", mealType: "dinner" },
    { name: "Chicken Strogonoff", calories: 350, proteinG: 28, carbsG: 15, fatG: 18, fiberG: 1, sodiumMg: 550, amount: "300g", mealType: "dinner" },
  ],
  Mexico: [
    { name: "Huevos Rancheros", calories: 320, proteinG: 18, carbsG: 28, fatG: 14, fiberG: 4, sodiumMg: 600, amount: "2 eggs", mealType: "breakfast" },
    { name: "Avocado Toast (Aguacate)", calories: 230, proteinG: 6, carbsG: 22, fatG: 13, fiberG: 6, sodiumMg: 280, amount: "1 toast", mealType: "breakfast" },
    { name: "Chilaquiles", calories: 380, proteinG: 14, carbsG: 50, fatG: 14, fiberG: 4, sodiumMg: 650, amount: "1 bowl", mealType: "breakfast" },
    { name: "Grilled Chicken Tacos", calories: 260, proteinG: 22, carbsG: 22, fatG: 8, fiberG: 3, sodiumMg: 480, amount: "2 tacos", mealType: "lunch" },
    { name: "Black Beans (Frijoles)", calories: 220, proteinG: 14, carbsG: 40, fatG: 1, fiberG: 14, sodiumMg: 300, amount: "1 cup", mealType: "lunch" },
    { name: "Guacamole", calories: 150, proteinG: 2, carbsG: 8, fatG: 13, fiberG: 5, sodiumMg: 200, amount: "100g", mealType: "snack" },
    { name: "Corn Tortilla", calories: 58, proteinG: 1.5, carbsG: 12, fatG: 0.5, fiberG: 1.5, sodiumMg: 30, amount: "1 piece", mealType: "snack" },
    { name: "Carne Asada (Lean)", calories: 250, proteinG: 30, carbsG: 0, fatG: 13, fiberG: 0, sodiumMg: 420, amount: "150g", mealType: "dinner" },
    { name: "Chicken Enchilada", calories: 320, proteinG: 24, carbsG: 30, fatG: 10, fiberG: 3, sodiumMg: 750, amount: "2 pieces", mealType: "dinner" },
  ],
};

const COUNTRIES = ["India", "USA", "UK", "Japan", "Brazil", "Mexico"];
const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"];
const WATER_GOAL = 3000;
const WATER_GLASSES = [150, 250, 350, 500];

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

function MacroRing({ value, max, color, label, subLabel }: { value: number; max: number; color: string; label: string; subLabel: string }) {
  const r = 32; const c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(max, 1), 1);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-white/10" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" className={color}
            style={{ strokeDasharray: c, strokeDashoffset: c - pct * c, transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute flex flex-col items-center text-center">
          <span className="font-bold text-sm leading-none">{Math.round(value)}</span>
          <span className="text-[9px] text-muted-foreground">{subLabel}</span>
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Diet() {
  const queryClient = useQueryClient();
  const [country, setCountry] = useState(() => localStorage.getItem("fittrack_country") || "India");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [customFood, setCustomFood] = useState({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "", fiberG: "", sodiumMg: "", servingSize: "" });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [waterData, setWaterData] = useState<{ totalMl: number; goalMl: number; logs: { id: number; amountMl: number; loggedAt: string }[] }>({ totalMl: 0, goalMl: WATER_GOAL, logs: [] });
  const [mealPlan, setMealPlan] = useState<{ dailyCalories: number; proteinG: number; carbsG: number; fatG: number; meals: { id: number; mealType: string; name: string; calories: number; proteinG: number; carbsG: number; fatG: number; foods: { name: string; amount: string; calories: number }[] }[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  // Load food log, water, meal plan, and workout calories
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setFoodLog(d)).catch(() => {});
    fetch(`${BASE}/api/progress/water`, { credentials: "include" })
      .then(r => r.json()).then(d => d.totalMl !== undefined && setWaterData(d)).catch(() => {});
    fetch(`${BASE}/api/diet/meal-plan`, { credentials: "include" })
      .then(r => r.json()).then(d => d.meals && setMealPlan(d)).catch(() => {});
    fetch(`${BASE}/api/workouts`, { credentials: "include" })
      .then(r => r.json()).then((ws: { date: string; caloriesBurned?: number }[]) => {
        if (!Array.isArray(ws)) return;
        const todayBurned = ws.filter(w => w.date === today).reduce((s, w) => s + (w.caloriesBurned || 0), 0);
        setCaloriesBurned(todayBurned);
      }).catch(() => {});
  }, []);

  const saveCountry = (c: string) => {
    setCountry(c);
    localStorage.setItem("fittrack_country", c);
    setShowCountryPicker(false);
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const r = await fetch(`${BASE}/api/diet/meal-plan`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country }) });
      const d = await r.json();
      if (d.meals) setMealPlan(d);
    } finally { setIsGenerating(false); }
  };

  const logFood = async (food: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sodiumMg: number; amount: string }, mealType: string) => {
    const today = new Date().toISOString().split("T")[0];
    const r = await fetch(`${BASE}/api/diet/food-log`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, foodName: food.name, calories: food.calories, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG, fiberG: food.fiberG, sodiumMg: food.sodiumMg, servingSize: food.amount, mealType }),
    });
    const d = await r.json();
    if (d.id) setFoodLog(prev => [...prev, d]);
    setShowFoodModal(false);
  };

  const logCustomFood = async () => {
    const today = new Date().toISOString().split("T")[0];
    const r = await fetch(`${BASE}/api/diet/food-log`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, foodName: customFood.name, calories: parseInt(customFood.calories) || 0, proteinG: parseFloat(customFood.proteinG) || 0, carbsG: parseFloat(customFood.carbsG) || 0, fatG: parseFloat(customFood.fatG) || 0, fiberG: parseFloat(customFood.fiberG) || 0, sodiumMg: parseFloat(customFood.sodiumMg) || 0, servingSize: customFood.servingSize, mealType: selectedMealType }),
    });
    const d = await r.json();
    if (d.id) { setFoodLog(prev => [...prev, d]); setShowFoodModal(false); setCustomFood({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "", fiberG: "", sodiumMg: "", servingSize: "" }); }
  };

  const deleteFood = async (id: number) => {
    await fetch(`${BASE}/api/diet/food-log/${id}`, { method: "DELETE", credentials: "include" });
    setFoodLog(prev => prev.filter(f => f.id !== id));
  };

  const logWater = async (ml: number) => {
    const today = new Date().toISOString().split("T")[0];
    const r = await fetch(`${BASE}/api/progress/water`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMl: ml, date: today }) });
    const d = await r.json();
    if (d.totalMl !== undefined) setWaterData(d);
  };

  // Computed macros
  const eatenCalories = foodLog.reduce((s, l) => s + l.calories, 0);
  const eatenProtein = foodLog.reduce((s, l) => s + (l.proteinG || 0), 0);
  const eatenCarbs = foodLog.reduce((s, l) => s + (l.carbsG || 0), 0);
  const eatenFat = foodLog.reduce((s, l) => s + (l.fatG || 0), 0);
  const targetCal = mealPlan?.dailyCalories || 2200;
  const targetProtein = mealPlan?.proteinG || 150;
  const targetCarbs = mealPlan?.carbsG || 220;
  const targetFat = mealPlan?.fatG || 70;

  // BMR estimate (Mifflin-St Jeor, ~1800 default)
  const bmrEstimate = 1800;
  const netCalories = eatenCalories - caloriesBurned;
  const waterPct = Math.min(waterData.totalMl / WATER_GOAL, 1);

  const filteredFoods = (COUNTRY_FOODS[country] || COUNTRY_FOODS.USA).filter(f =>
    (!foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Nutrition</h1>
            <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM do")}</p>
          </div>
          <button onClick={() => setShowCountryPicker(true)} className="flex items-center gap-2 px-4 py-2 bg-card border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
            <Globe className="w-4 h-4 text-primary" /> {country} <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </header>

        {/* Calorie Balance Bar */}
        <div className="glass-card rounded-3xl p-5 border-t-4 border-t-accent">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Apple className="w-3 h-3 text-green-400" /> Eaten</p>
              <p className="text-2xl font-bold text-green-400">{eatenCalories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Burned</p>
              <p className="text-2xl font-bold text-orange-400">{caloriesBurned}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3 text-blue-400" /> BMR</p>
              <p className="text-2xl font-bold text-blue-400">{bmrEstimate}</p>
              <p className="text-xs text-muted-foreground">kcal/day</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily balance</span>
            <span className={`text-sm font-bold ${netCalories < 0 ? 'text-blue-400' : netCalories > targetCal ? 'text-red-400' : 'text-green-400'}`}>
              {netCalories > 0 ? '+' : ''}{netCalories} kcal
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-accent rounded-full transition-all duration-700" style={{ width: `${Math.min(eatenCalories / targetCal, 1) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{Math.max(0, targetCal - eatenCalories)} kcal remaining of {targetCal} target</p>

          {/* Macro rings */}
          <div className="flex justify-around mt-5 pt-4 border-t border-white/10">
            <MacroRing value={eatenProtein} max={targetProtein} color="text-primary" label="Protein" subLabel={`/${targetProtein}g`} />
            <MacroRing value={eatenCarbs} max={targetCarbs} color="text-accent" label="Carbs" subLabel={`/${targetCarbs}g`} />
            <MacroRing value={eatenFat} max={targetFat} color="text-yellow-500" label="Fat" subLabel={`/${targetFat}g`} />
            <MacroRing value={foodLog.reduce((s, l) => s + (l.fiberG || 0), 0)} max={30} color="text-green-500" label="Fiber" subLabel="/30g" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Food Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Today's Log</h3>
              <button onClick={() => setShowFoodModal(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-primary text-white rounded-lg shadow-[0_0_10px_rgba(124,58,237,0.4)] hover:bg-primary/90 transition-colors">
                <Plus className="w-3 h-3" /> Add Food
              </button>
            </div>

            <div className="glass-card rounded-2xl divide-y divide-white/5 overflow-hidden">
              {MEAL_TYPES.map(mealType => {
                const entries = foodLog.filter(f => f.mealType === mealType);
                const mealCals = entries.reduce((s, f) => s + f.calories, 0);
                return (
                  <div key={mealType} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-semibold capitalize text-primary">{mealType}</h4>
                      <span className="text-xs text-muted-foreground">{mealCals} kcal</span>
                    </div>
                    {entries.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50">Nothing logged</p>
                    ) : (
                      <div className="space-y-1">
                        {entries.map(f => (
                          <div key={f.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
                            <div>
                              <p className="text-sm font-medium">{f.foodName}</p>
                              <p className="text-xs text-muted-foreground">
                                {f.proteinG || 0}P · {f.carbsG || 0}C · {f.fatG || 0}F
                                {f.fiberG ? ` · ${f.fiberG}g fiber` : ""}
                                <span className="ml-2 opacity-50">{format(new Date(f.loggedAt), "HH:mm")}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-primary">{f.calories}</span>
                              <button onClick={() => deleteFood(f.id)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Water Tracker */}
            <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10 text-blue-400"><Droplets className="w-36 h-36" /></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-blue-300 flex items-center gap-2"><Droplets className="w-5 h-5" /> Hydration</h3>
                  <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full">Goal: {WATER_GOAL} ml</span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold">{waterData.totalMl}</span>
                  <span className="text-blue-300">/ {WATER_GOAL} ml</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-blue-900/40 rounded-full overflow-hidden mb-4">
                  <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${waterPct * 100}%` }} transition={{ duration: 0.7 }} />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {WATER_GLASSES.map(ml => (
                    <button key={ml} onClick={() => logWater(ml)} className="flex-1 min-w-[60px] py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-xs font-medium text-blue-300 transition-colors">
                      +{ml}ml
                    </button>
                  ))}
                </div>

                {waterPct >= 1 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                    <Check className="w-4 h-4" /> Goal reached! Great hydration today.
                  </div>
                )}
              </div>
            </div>

            {/* Meal Plan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><Apple className="w-5 h-5 text-green-500" /> {country} Meal Plan</h3>
                <button onClick={generatePlan} disabled={isGenerating} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-card border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {mealPlan ? (
                <div className="space-y-3">
                  {mealPlan.meals.map((meal, i) => (
                    <motion.div key={meal.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 rounded-2xl">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-semibold capitalize text-primary">{meal.mealType}</h4>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded-md">{meal.calories} kcal</span>
                      </div>
                      <div className="space-y-1">
                        {meal.foods.map((f, j) => (
                          <div key={j} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{f.amount} <span className="text-foreground">{f.name}</span></span>
                            <span className="text-muted-foreground">{f.calories} c</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex gap-3 text-xs text-muted-foreground">
                        <span>P: {meal.proteinG}g</span><span>C: {meal.carbsG}g</span><span>F: {meal.fatG}g</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 rounded-2xl text-center border-dashed border-white/20">
                  <p className="text-muted-foreground mb-4">Generate a {country} meal plan</p>
                  <button onClick={generatePlan} className="bg-primary text-white px-6 py-2 rounded-xl font-medium text-sm shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all">
                    Generate Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Country Picker Modal */}
        <AnimatePresence>
          {showCountryPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCountryPicker(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-card border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-display font-bold text-xl">Select Country</h3>
                  <button onClick={() => setShowCountryPicker(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {COUNTRIES.map(c => (
                    <button key={c} onClick={() => saveCountry(c)} className={`py-3 rounded-xl text-sm font-medium transition-all border ${country === c ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'bg-black/30 border-white/10 hover:border-primary/30'}`}>
                      {c === "India" ? "🇮🇳" : c === "USA" ? "🇺🇸" : c === "UK" ? "🇬🇧" : c === "Japan" ? "🇯🇵" : c === "Brazil" ? "🇧🇷" : "🇲🇽"} {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Food Modal */}
        <AnimatePresence>
          {showFoodModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowFoodModal(false)}>
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} onClick={e => e.stopPropagation()} className="bg-card border border-white/10 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-display font-bold text-lg">Log Food — {country}</h3>
                  <button onClick={() => setShowFoodModal(false)}><X className="w-5 h-5" /></button>
                </div>

                {/* Meal type */}
                <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
                  {MEAL_TYPES.map(t => (
                    <button key={t} onClick={() => setSelectedMealType(t)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${selectedMealType === t ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>{t}</button>
                  ))}
                </div>

                {/* Search */}
                <div className="px-4 pt-3">
                  <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder={`Search ${country} foods...`}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-sm focus:border-primary outline-none" />
                </div>

                {/* Food list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 custom-scrollbar">
                  {filteredFoods.map((f, i) => (
                    <button key={i} onClick={() => logFood(f, selectedMealType)} className="w-full flex items-center justify-between p-3 bg-black/30 hover:bg-primary/10 border border-white/5 hover:border-primary/30 rounded-xl transition-all text-left group">
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.amount} · P:{f.proteinG}g C:{f.carbsG}g F:{f.fatG}g</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{f.calories} kcal</span>
                    </button>
                  ))}
                </div>

                {/* Custom food toggle */}
                <div className="px-4 pb-4">
                  <button onClick={() => setShowCustomForm(!showCustomForm)} className="w-full py-2.5 text-sm text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors font-medium">
                    {showCustomForm ? "Hide Custom" : "+ Add Custom Food"}
                  </button>
                  <AnimatePresence>
                    {showCustomForm && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <input className="col-span-2 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-primary" placeholder="Food name *" value={customFood.name} onChange={e => setCustomFood(p => ({ ...p, name: e.target.value }))} />
                          {[["calories", "Calories *"], ["proteinG", "Protein (g)"], ["carbsG", "Carbs (g)"], ["fatG", "Fat (g)"], ["fiberG", "Fiber (g)"], ["sodiumMg", "Sodium (mg)"]].map(([k, label]) => (
                            <input key={k} className="px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-primary" placeholder={label} type="number" value={(customFood as Record<string, string>)[k]} onChange={e => setCustomFood(p => ({ ...p, [k]: e.target.value }))} />
                          ))}
                        </div>
                        <button onClick={logCustomFood} disabled={!customFood.name || !customFood.calories} className="w-full mt-2 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
                          Log Custom Food
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
