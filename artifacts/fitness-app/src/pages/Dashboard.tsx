import { useState, useEffect, useRef } from "react";
import { useGetDashboard, useGetProfile } from "@workspace/api-client-react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { format, startOfWeek, addDays, differenceInDays, parseISO } from "date-fns";
import {
  Flame, Activity, Trophy, ArrowRight, Utensils, Droplets, Footprints,
  Target, TrendingUp, Zap, ChevronRight, UserCircle2, Crown, Brain, Globe
} from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const LANG_KEY = "cfx_language";

const LANGUAGES = [
  { code: "en", label: "English",           flag: "🇬🇧" },
  { code: "zh", label: "中文",               flag: "🇨🇳" },
  { code: "hi", label: "हिंदी",              flag: "🇮🇳" },
  { code: "es", label: "Español",           flag: "🇪🇸" },
  { code: "fr", label: "Français",          flag: "🇫🇷" },
  { code: "ar", label: "العربية",            flag: "🇸🇦" },
  { code: "bn", label: "বাংলা",              flag: "🇧🇩" },
  { code: "ru", label: "Русский",           flag: "🇷🇺" },
  { code: "pt", label: "Português",         flag: "🇧🇷" },
  { code: "ur", label: "اردو",              flag: "🇵🇰" },
];

const GREETINGS: Record<string, { morning: string; afternoon: string; evening: string; night: string }> = {
  en: { morning: "Good Morning",    afternoon: "Good Afternoon",   evening: "Good Evening",  night: "Good Night"     },
  zh: { morning: "早上好",           afternoon: "下午好",            evening: "晚上好",         night: "晚安"            },
  hi: { morning: "सुप्रभात",          afternoon: "नमस्ते",            evening: "शुभ संध्या",     night: "शुभ रात्रि"      },
  es: { morning: "Buenos días",     afternoon: "Buenas tardes",    evening: "Buenas tardes", night: "Buenas noches"  },
  fr: { morning: "Bonjour",         afternoon: "Bon après-midi",   evening: "Bonsoir",       night: "Bonne nuit"     },
  ar: { morning: "صباح الخير",       afternoon: "مساء الخير",       evening: "مساء الخير",    night: "تصبح على خير"  },
  bn: { morning: "শুভ সকাল",         afternoon: "শুভ দুপুর",        evening: "শুভ সন্ধ্যা",   night: "শুভ রাত্রি"     },
  ru: { morning: "Доброе утро",     afternoon: "Добрый день",      evening: "Добрый вечер",  night: "Спокойной ночи" },
  pt: { morning: "Bom dia",         afternoon: "Boa tarde",        evening: "Boa tarde",     night: "Boa noite"      },
  ur: { morning: "صبح بخیر",         afternoon: "دوپہر بخیر",       evening: "شام بخیر",      night: "شب بخیر"        },
};

function getGreetingText(langCode: string, period: "morning" | "afternoon" | "evening" | "night"): string {
  return GREETINGS[langCode]?.[period] ?? GREETINGS.en[period];
}

const MACRO_EMOJI: Record<string, string> = { Protein: "💪", Carbs: "🌾", Fat: "🥑" };

const COUNTRY_TIMEZONE: Record<string, string> = {
  USA: "America/New_York", India: "Asia/Kolkata", UK: "Europe/London",
  Canada: "America/Toronto", Australia: "Australia/Sydney", Japan: "Asia/Tokyo",
  Brazil: "America/Sao_Paulo", Mexico: "America/Mexico_City", Germany: "Europe/Berlin",
  France: "Europe/Paris", "South Korea": "Asia/Seoul", Nigeria: "Africa/Lagos",
  "South Africa": "Africa/Johannesburg", UAE: "Asia/Dubai", Philippines: "Asia/Manila",
};

function getLocalHourMinute(country: string): { h: number; min: number; timeStr: string } {
  const tz = COUNTRY_TIMEZONE[country] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
    const parts = formatter.formatToParts(new Date());
    const hourStr = parts.find(p => p.type === "hour")?.value || "12";
    const minStr = parts.find(p => p.type === "minute")?.value || "00";
    const period = parts.find(p => p.type === "dayPeriod")?.value || "AM";
    let h = parseInt(hourStr);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return { h, min: parseInt(minStr), timeStr: `${hourStr}:${minStr} ${period}` };
  } catch {
    const d = new Date();
    return { h: d.getHours(), min: d.getMinutes(), timeStr: "" };
  }
}

function getGreeting(country: string): { text: string; time: string; period: "morning" | "afternoon" | "evening" | "night" } {
  const { h, min, timeStr } = getLocalHourMinute(country);
  let text: string; let period: "morning" | "afternoon" | "evening" | "night";
  if (h >= 5 && h < 12) { text = "Good Morning"; period = "morning"; }
  else if (h >= 12 && (h < 16 || (h === 16 && min < 30))) { text = "Good Afternoon"; period = "afternoon"; }
  else if ((h === 16 && min >= 30) || (h >= 17 && h < 21)) { text = "Good Evening"; period = "evening"; }
  else { text = "Good Night"; period = "night"; }
  return { text, time: timeStr, period };
}

function getTimeBackground(country: string) {
  const { h, min } = getLocalHourMinute(country);
  const isNight = h >= 22 || h < 5;
  const isMorning = h >= 5 && h < 12;
  const isAfternoon = h >= 12 && (h < 16 || (h === 16 && min < 30));
  if (isNight) return {
    blobs: [{ color: "bg-indigo-900/30", pos: "top-[-10%] left-[-5%]", size: "w-[55%] h-[55%]" }, { color: "bg-blue-950/40", pos: "top-[5%] right-[-10%]", size: "w-[45%] h-[45%]" }, { color: "bg-violet-950/20", pos: "bottom-[0%] left-[20%]", size: "w-[40%] h-[30%]" }],
  };
  if (isMorning) return {
    blobs: [{ color: "bg-amber-500/20", pos: "top-[-15%] right-[-5%]", size: "w-[50%] h-[50%]" }, { color: "bg-yellow-400/15", pos: "top-[0%] left-[-10%]", size: "w-[45%] h-[40%]" }, { color: "bg-sky-500/15", pos: "bottom-[0%] right-[10%]", size: "w-[35%] h-[30%]" }],
  };
  if (isAfternoon) return {
    blobs: [{ color: "bg-orange-500/20", pos: "top-[-10%] right-[-5%]", size: "w-[50%] h-[50%]" }, { color: "bg-amber-400/15", pos: "top-[5%] left-[-8%]", size: "w-[40%] h-[40%]" }, { color: "bg-yellow-500/10", pos: "bottom-[0%] left-[30%]", size: "w-[30%] h-[25%]" }],
  };
  return {
    blobs: [{ color: "bg-rose-600/20", pos: "top-[-15%] right-[-5%]", size: "w-[55%] h-[50%]" }, { color: "bg-orange-500/15", pos: "top-[0%] left-[-10%]", size: "w-[45%] h-[40%]" }, { color: "bg-violet-600/20", pos: "bottom-[-5%] right-[5%]", size: "w-[40%] h-[35%]" }],
  };
}

interface MacroRingProps { label: string; current: number; target: number; stroke: string; track: string; }
function MacroRing({ label, current, target, stroke, track }: MacroRingProps) {
  const r = 36; const circumference = 2 * Math.PI * r; const arcPct = 0.75;
  const arcLen = circumference * arcPct; const gapLen = circumference - arcLen;
  const pct = Math.min(current / Math.max(target, 1), 1);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: "rotate(135deg)" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="9" strokeDasharray={`${arcLen} ${gapLen}`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="9" strokeDasharray={`${arcLen * pct} ${circumference - arcLen * pct}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pb-2">
          <span className="text-xl select-none">{MACRO_EMOJI[label] ?? "🍽️"}</span>
        </div>
      </div>
      <div className="text-center leading-snug">
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        <p className="text-[11px] font-bold text-white/90">{current}/{target}g</p>
      </div>
    </div>
  );
}

function CalorieCircle({ value, label, bgColor, borderColor, iconColor, textColor, glowColor, icon }: {
  value: number; label: string; bgColor: string; borderColor: string; iconColor: string; textColor: string; glowColor: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-20 h-20 rounded-full border-2 ${borderColor} ${bgColor} flex flex-col items-center justify-center`}
        style={{ boxShadow: `0 0 18px ${glowColor}` }}>
        <div className={`${iconColor} mb-0.5`}>{icon}</div>
        <p className={`text-base font-display font-bold ${textColor} leading-none`}>{value}</p>
        <p className="text-[9px] text-white/40">kcal</p>
      </div>
      <p className="text-xs font-semibold text-white/70">{label}</p>
    </div>
  );
}

function CalorieMainRing({ remaining, goal, eaten }: { remaining: number; goal: number; eaten: number }) {
  const r = 52; const stroke = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(eaten / Math.max(goal, 1), 1));
  const isOver = eaten > goal;
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Ripple rings */}
      <motion.div className="absolute inset-0 rounded-full border border-blue-500/25"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute inset-[-8px] rounded-full border border-cyan-500/15"
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0, 0.25] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
      {/* Blue fill background */}
      <div className="absolute inset-[6px] rounded-full bg-blue-500/8" />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none"
          stroke={isOver ? "#f97316" : "url(#calGrad)"}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${stroke * pct} ${stroke * (1 - pct)}`}
          style={{ transition: "stroke-dasharray 1.2s ease-out" }} />
        <defs>
          <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-display font-black text-blue-300 leading-none">{Math.abs(remaining)}</p>
        <p className="text-[10px] text-blue-400/70 mt-0.5">{remaining >= 0 ? "remaining" : "over goal"}</p>
        <p className="text-[9px] text-white/40 font-medium mt-0.5">of {goal}</p>
      </div>
    </div>
  );
}

const STEPS_KEY = "cfx_steps_today";
const STEPS_DATE_KEY = "cfx_steps_date";
const CALS_PER_STEP = 0.04;

function getStepsToday(): number {
  const d = localStorage.getItem(STEPS_DATE_KEY);
  const today = new Date().toISOString().split("T")[0];
  if (d !== today) { localStorage.setItem(STEPS_KEY, "0"); localStorage.setItem(STEPS_DATE_KEY, today); return 0; }
  return parseInt(localStorage.getItem(STEPS_KEY) || "0");
}

const PHASE_DATA = [
  { name: "Menstruation", emoji: "🌸", bgFrom: "from-rose-950/50", bgTo: "to-pink-950/40", border: "border-rose-500/25", barColor: "from-rose-500 to-pink-400", textColor: "text-rose-400", tip: "Take it easy. Gentle movement like yoga or walking is great." },
  { name: "Follicular", emoji: "🌱", bgFrom: "from-emerald-950/50", bgTo: "to-teal-950/40", border: "border-emerald-500/25", barColor: "from-emerald-500 to-teal-400", textColor: "text-emerald-400", tip: "Energy is rising! Great time for strength training." },
  { name: "Ovulation", emoji: "✨", bgFrom: "from-amber-950/50", bgTo: "to-yellow-950/40", border: "border-amber-500/25", barColor: "from-amber-500 to-yellow-400", textColor: "text-amber-400", tip: "Peak energy! Push harder — you're at your strongest." },
  { name: "Luteal", emoji: "🌙", bgFrom: "from-purple-950/50", bgTo: "to-violet-950/40", border: "border-purple-500/25", barColor: "from-purple-500 to-violet-400", textColor: "text-purple-400", tip: "Rest well and focus on light training. Cravings are normal." },
];

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetProfile({ query: { queryKey: ['fitness', 'profile'] } });
  const { data: stats, isLoading: isStatsLoading } = useGetDashboard({ query: { queryKey: ['fitness', 'dashboard-stats'] } });
  const [steps, setSteps] = useState(getStepsToday);
  const [stepsInput, setStepsInput] = useState("");
  const [showStepsInput, setShowStepsInput] = useState(false);
  const [waterMl, setWaterMl] = useState(0);
  const [macroTotals, setMacroTotals] = useState({ proteinG: 0, carbsG: 0, fatG: 0 });
  const [todayFoodCalories, setTodayFoodCalories] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const carouselRef = useRef<HTMLDivElement>(null);

  const changeLang = (code: string) => {
    setLang(code);
    localStorage.setItem(LANG_KEY, code);
    setShowLangMenu(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => { localStorage.setItem(STEPS_KEY, String(steps)); localStorage.setItem(STEPS_DATE_KEY, new Date().toISOString().split("T")[0]); }, [steps]);

  useEffect(() => {
    fetch(`${BASE}/api/diet/food-log`, { credentials: "include" })
      .then(r => r.json()).then((logs: any[]) => {
        if (!Array.isArray(logs)) return;
        const t = logs.reduce((acc, l) => ({ calories: acc.calories + (l.calories || 0), proteinG: acc.proteinG + (l.proteinG || 0), carbsG: acc.carbsG + (l.carbsG || 0), fatG: acc.fatG + (l.fatG || 0) }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
        setTodayFoodCalories(Math.round(t.calories));
        setMacroTotals({ proteinG: Math.round(t.proteinG), carbsG: Math.round(t.carbsG), fatG: Math.round(t.fatG) });
      }).catch(() => {});
    const today = new Date().toISOString().split("T")[0];
    fetch(`${BASE}/api/progress/water?date=${today}`, { credentials: "include" })
      .then(r => r.json()).then(d => { if (d && d.totalMl !== undefined) setWaterMl(d.totalMl); }).catch(() => {});
  }, []);

  if (isProfileLoading || isStatsLoading) return <LoadingState message="Loading dashboard..." />;

  const safeProfile = profile && typeof profile === "object" && !Array.isArray(profile) ? profile as any : {};
  const safeStats = stats && typeof stats === "object" && !Array.isArray(stats) ? stats as any : {
    currentStreak: 0, totalWorkouts: 0, recentWorkouts: [], personalRecords: [],
    weeklyVolume: [{ day: "Mon", volume: 0 }, { day: "Tue", volume: 0 }, { day: "Wed", volume: 0 }, { day: "Thu", volume: 0 }, { day: "Fri", volume: 0 }, { day: "Sat", volume: 0 }, { day: "Sun", volume: 0 }],
  };

  const stepCalories = Math.round(steps * CALS_PER_STEP);
  const today = new Date().toISOString().split("T")[0];
  const todayWorkoutCalories = safeStats.recentWorkouts?.filter((w: any) => w.date === today).reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0) || 0;
  const totalBurned = todayWorkoutCalories + stepCalories;

  const weightKg = safeProfile.weightKg || 70;
  const heightCm = safeProfile.heightCm || 170;
  const age = safeProfile.age || 25;
  const gender = safeProfile.gender || "male";
  const activityLevel = safeProfile.activityLevel || "moderate";
  const fitnessGoal = safeProfile.fitnessGoal || "maintenance";
  const country = safeProfile.country || "USA";

  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "female" ? -161 : 5));
  const actMul: Record<string, number> = { sedentary: 1.2, light: 1.375, "lightly active": 1.375, moderate: 1.55, "moderately active": 1.55, active: 1.725, "very active": 1.725, athlete: 1.9, "extra active": 1.9 };
  const tdee = Math.round(bmr * (actMul[activityLevel] ?? 1.55));
  const goalAdj: Record<string, number> = { "weight loss": -500, "fat loss": -500, "muscle gain": 300, "athletic performance": 200, "recomposition": -100, "maintenance": 0, "general fitness": 0, "flexibility": 0 };
  const calTarget = tdee + (goalAdj[fitnessGoal] ?? 0);
  const proteinTarget = Math.round(weightKg * 2.2);
  const fatTarget = Math.round(weightKg * 0.9);
  const carbsTarget = Math.max(0, Math.round((calTarget - proteinTarget * 4 - fatTarget * 9) / 4));

  const waterPct = Math.min(waterMl / 3000, 1);
  const waterGlasses = Math.round(waterMl / 250);
  const remaining = calTarget - todayFoodCalories;

  const greeting = getGreeting(country);
  const timeBg = getTimeBackground(country);
  const isFemale = gender === "female";
  const periodStartDate: string | null = (safeProfile as any).periodStartDate || null;
  const periodEndDate: string | null = (safeProfile as any).periodEndDate || null;

  let cycleInfo: any = null;
  if (isFemale && periodStartDate) {
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const start = parseISO(periodStartDate);
    const cycleDay = differenceInDays(todayDate, start) + 1;
    const clampedDay = Math.max(1, ((cycleDay - 1) % 28) + 1);
    const periodDuration = periodEndDate ? differenceInDays(parseISO(periodEndDate), start) + 1 : 5;
    const nextPeriodStart = addDays(start, Math.ceil(cycleDay / 28) * 28);
    const nextPeriodDays = differenceInDays(nextPeriodStart, todayDate);
    let phaseIdx = 3;
    if (clampedDay <= periodDuration) phaseIdx = 0;
    else if (clampedDay <= 13) phaseIdx = 1;
    else if (clampedDay <= 16) phaseIdx = 2;
    cycleInfo = { cycleDay: clampedDay, phase: PHASE_DATA[phaseIdx].name, phaseIdx, phaseTip: PHASE_DATA[phaseIdx].tip, nextPeriodDays: Math.max(0, nextPeriodDays), cycleProgress: Math.round((clampedDay / 28) * 100) };
  }

  const logWater = async (ml: number) => {
    const newVal = Math.min(waterMl + ml, 3000);
    setWaterMl(newVal);
    try {
      const r = await fetch(`${BASE}/api/progress/water`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMl: ml, date: new Date().toISOString().split("T")[0] }) });
      const d = await r.json();
      if (d && d.totalMl !== undefined) setWaterMl(d.totalMl);
    } catch {}
  };

  return (
    <PageTransition>
      <div className="space-y-4 max-w-5xl mx-auto">

        {/* Dynamic background blobs */}
        <div className="relative">
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none -z-10">
            {timeBg.blobs.map((blob, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: i * 0.3 }}
                className={`absolute ${blob.color} ${blob.pos} ${blob.size} rounded-full blur-[100px]`} />
            ))}
          </div>
          <header className="flex items-start justify-between gap-3 pt-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{format(new Date(), "EEEE, MMMM do")}</span>
                {greeting.time && <><span className="text-white/30">·</span><span className="text-violet-400 font-medium">{greeting.time}</span></>}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mt-0.5 text-white">
                {getGreetingText(lang, greeting.period)}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{safeProfile.name?.split(" ")[0] || "Champ"}</span>{" "}
                {greeting.period === "morning" ? "☀️" : greeting.period === "afternoon" ? "🌤️" : greeting.period === "evening" ? "🌅" : "🌙"}
              </h1>
              <div className="flex gap-2 mt-3">
                <Link href="/workout" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors shadow-[0_0_16px_rgba(124,58,237,0.4)] hover:shadow-[0_0_24px_rgba(124,58,237,0.6)]">
                  <Activity className="w-4 h-4" /> Workout
                </Link>
                <Link href="/diet" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                  <Utensils className="w-4 h-4" /> Log Food
                </Link>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {/* Language selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(v => !v)}
                  className="flex items-center gap-1 px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                  title="Change language"
                >
                  <span className="text-base leading-none">{currentLang.flag}</span>
                  <Globe className="w-3 h-3 text-white/40" />
                </button>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-44">
                      {LANGUAGES.map(l => (
                        <button
                          key={l.code}
                          onClick={() => changeLang(l.code)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/8 transition-colors text-left ${lang === l.code ? "bg-violet-500/15 text-violet-300" : "text-white/70"}`}
                        >
                          <span className="text-base">{l.flag}</span>
                          <span className="font-medium">{l.label}</span>
                          {lang === l.code && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setShowUpgrade(true)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                <Crown className="w-4 h-4" /> <span className="hidden sm:inline">Premium</span>
              </button>
              <Link href="/profile" className="shrink-0 w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center hover:bg-violet-600/40 transition-colors">
                <UserCircle2 className="w-5 h-5 text-violet-400" />
              </Link>
            </div>
          </header>
        </div>

        {isFemale && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            {!cycleInfo ? (
              <Link href="/profile">
                <div className="rounded-2xl border border-pink-500/25 bg-gradient-to-r from-pink-950/50 to-purple-950/40 px-4 py-3 flex items-center justify-between hover:border-pink-500/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🌸</span>
                    <div><p className="text-sm font-semibold text-pink-200">Cycle Tracker</p><p className="text-xs text-white/40">Tap to set your period dates</p></div>
                  </div>
                  <span className="text-xs text-pink-400 border border-pink-500/30 px-2.5 py-1 rounded-full">Set up →</span>
                </div>
              </Link>
            ) : (
              <div className={`rounded-xl border ${PHASE_DATA[cycleInfo.phaseIdx].border} px-3 py-2`}
                style={{ background: "linear-gradient(135deg, rgba(15,3,8,0.9), rgba(20,4,10,0.85))" }}>
                <div className="flex items-center gap-3">
                  <div className="grid grid-cols-4 gap-1 flex-1">
                    {PHASE_DATA.map((ph, i) => {
                      const isActive = i === cycleInfo.phaseIdx;
                      return (
                        <div key={ph.name} className={`rounded-lg px-1 py-1 text-center border transition-all ${isActive ? ph.border : "border-white/5"}`}
                          style={isActive ? { background: "rgba(255,255,255,0.08)" } : { background: "rgba(255,255,255,0.02)" }}>
                          <div className="text-xs">{ph.emoji}</div>
                          <div className={`text-[8px] font-bold leading-tight mt-0.5 ${isActive ? ph.textColor : "text-white/25"}`}>{ph.name.slice(0, 5)}</div>
                          {isActive && <div className={`h-px rounded-full mt-0.5 bg-gradient-to-r ${ph.barColor}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${PHASE_DATA[cycleInfo.phaseIdx].textColor}`}>Day {cycleInfo.cycleDay}</div>
                    <div className="text-[9px] text-white/30">Next {cycleInfo.nextPeriodDays}d</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Horizontal carousel: Calories + Macros only */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="font-display font-bold text-base text-white/90">Today's Overview</h3>
            <span className="text-xs text-muted-foreground">Swipe →</span>
          </div>
          <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>

            {/* ── Calories card: circular design with ripple ── */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] glass-card rounded-2xl p-4 border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Calories</h4>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Today</span>
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <CalorieCircle
                  value={todayFoodCalories} label="Eaten"
                  bgColor="bg-green-500/15" borderColor="border-green-500/50"
                  iconColor="text-green-400" textColor="text-green-300"
                  glowColor="rgba(34,197,94,0.25)"
                  icon={<Utensils className="w-3.5 h-3.5" />}
                />
                <CalorieMainRing remaining={remaining} goal={calTarget} eaten={todayFoodCalories} />
                <CalorieCircle
                  value={totalBurned} label="Burned"
                  bgColor="bg-orange-500/15" borderColor="border-orange-500/50"
                  iconColor="text-orange-400" textColor="text-orange-300"
                  glowColor="rgba(249,115,22,0.25)"
                  icon={<Zap className="w-3.5 h-3.5" />}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target: <span className="text-white/60 font-semibold">{calTarget} kcal</span></span>
                  <span className="capitalize text-violet-400 font-medium">{fitnessGoal === "weight loss" ? "Cut" : fitnessGoal === "muscle gain" ? "Bulk" : "Maintain"}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(todayFoodCalories / Math.max(calTarget, 1), 1) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
                </div>
              </div>
            </div>

            {/* ── Macros card ── */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] glass-card rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-1.5"><Activity className="w-4 h-4 text-violet-400" /> Macros</h4>
                <Link href="/diet" className="text-xs text-violet-400 hover:underline flex items-center gap-1">Diet <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="flex justify-around py-2">
                <MacroRing label="Protein" current={macroTotals.proteinG} target={proteinTarget} stroke="#4A90D9" track="rgba(74,144,217,0.15)" />
                <MacroRing label="Carbs" current={macroTotals.carbsG} target={carbsTarget} stroke="#34C759" track="rgba(52,199,89,0.15)" />
                <MacroRing label="Fat" current={macroTotals.fatG} target={fatTarget} stroke="#FF9500" track="rgba(255,149,0,0.15)" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: "Protein", eaten: macroTotals.proteinG, target: proteinTarget, color: "bg-blue-400", text: "text-blue-400" },
                  { label: "Carbs", eaten: macroTotals.carbsG, target: carbsTarget, color: "bg-green-400", text: "text-green-400" },
                  { label: "Fat", eaten: macroTotals.fatG, target: fatTarget, color: "bg-orange-400", text: "text-orange-400" },
                ].map(({ label, eaten, target, color, text }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className={`font-semibold ${text}`}>{label}</span>
                      <span className="text-muted-foreground">{eaten}g</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${Math.min(eaten / Math.max(target, 1), 1) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Future Body Simulator Banner */}
          <Link href="/future-body">
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="relative w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mt-2 overflow-hidden cursor-pointer group"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.12) 100%)",
                border: "1px solid rgba(124,58,237,0.35)",
                boxShadow: "0 0 20px rgba(124,58,237,0.25), 0 0 40px rgba(6,182,212,0.1)",
              }}
            >
              {/* animated glow pulse */}
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: "inset 0 0 20px rgba(124,58,237,0.15)" }}
              />
              <span className="flex items-center gap-2.5 text-sm font-bold text-white">
                <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40">
                  <Brain className="w-4 h-4 text-violet-300" />
                  <motion.span
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl border border-violet-400/50"
                  />
                </span>
                <span>
                  <span className="block text-white">Future Body Simulator</span>
                  <span className="text-[11px] font-normal text-violet-300/80">See your body in 7, 30 & 90 days</span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </motion.div>
          </Link>

        </motion.div>

        {/* ── Hydration + Workout & Streaks (Hydration first / on top) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hydration */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 border border-cyan-500/15 bg-cyan-500/3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-400" /> Hydration</h3>
              <span className="text-xs text-cyan-400 font-semibold">{waterMl} / 3000 ml</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="6" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke="url(#wGrad)" strokeWidth="6" strokeLinecap="round"
                    style={{ strokeDasharray: `${2 * Math.PI * 24}`, strokeDashoffset: `${2 * Math.PI * 24 * (1 - waterPct)}`, transition: "stroke-dashoffset 1s ease" }} />
                  <defs><linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-display font-bold text-cyan-400">{waterGlasses}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000" style={{ width: `${waterPct * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[250, 500].map(ml => (
                    <button key={ml} onClick={() => logWater(ml)} className="py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3" /> +{ml}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-1 flex-wrap">
              {Array.from({ length: 12 }).map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full transition-all ${i < waterGlasses ? "bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.5)]" : "bg-white/10"}`} />))}
            </div>
          </motion.div>

          {/* Workout & Streaks (circular) */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
            <h3 className="font-display font-bold text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Workout & Streaks</h3>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-orange-500/40 bg-orange-500/10 flex flex-col items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.2)]">
                  <p className="text-xl font-display font-black text-orange-400 leading-none">{safeStats.currentStreak}</p>
                  <p className="text-[9px] text-orange-400/70">days</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Streak 🔥</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/40 bg-violet-500/10 flex flex-col items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.2)]">
                  <p className="text-xl font-display font-black text-violet-400 leading-none">{safeStats.totalWorkouts}</p>
                  <p className="text-[9px] text-violet-400/70">total</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Workouts</p>
              </div>
            </div>
            {(() => {
              const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
              const workoutDateSet = new Set((safeStats.recentWorkouts || []).map((w: any) => (w.date || "").split("T")[0]));
              const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
              const weekDays = dayLabels.map((lbl, i) => ({ lbl, dateStr: format(addDays(weekStart, i), "yyyy-MM-dd"), isToday: format(addDays(weekStart, i), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") }));
              return (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {weekDays.map(({ dateStr, isToday }, i) => {
                      const done = workoutDateSet.has(dateStr);
                      return <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${done ? "bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_6px_rgba(124,58,237,0.5)]" : isToday ? "bg-white/20" : "bg-white/10"}`} />;
                    })}
                  </div>
                  <div className="flex gap-1 justify-between">
                    {weekDays.map(({ lbl, isToday }, i) => (<span key={i} className={`flex-1 text-center text-[9px] ${isToday ? "text-violet-400 font-semibold" : "text-muted-foreground"}`}>{lbl}</span>))}
                  </div>
                </div>
              );
            })()}
            <Link href="/workout" className="flex items-center justify-between p-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 transition-colors border border-violet-500/20 group">
              <span className="text-xs font-semibold text-violet-300">Start Workout</span>
              <ChevronRight className="w-3.5 h-3.5 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Step Count — below hydration */}
        <div>
          <button onClick={() => setShowStepsInput(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-violet-500/8 border border-violet-500/20 hover:bg-violet-500/15 transition-colors">
            <span className="flex items-center gap-2 text-sm font-semibold text-violet-300">
              <Footprints className="w-4 h-4 text-violet-400" /> Step Count
            </span>
            <span className="text-sm font-display font-bold text-violet-400">{steps.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">≈ {stepCalories} kcal</span></span>
          </button>
          {showStepsInput && (
            <div className="flex gap-2 mt-2">
              <input type="number" value={stepsInput} onChange={e => setStepsInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (() => { const n = parseInt(stepsInput); if (!isNaN(n) && n >= 0) setSteps(n); setStepsInput(""); setShowStepsInput(false); })()}
                placeholder="Enter today's step count" className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-violet-500 outline-none text-sm" />
              <button onClick={() => { const n = parseInt(stepsInput); if (!isNaN(n) && n >= 0) setSteps(n); setStepsInput(""); setShowStepsInput(false); }}
                className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">Save</button>
            </div>
          )}
        </div>

        {/* Weekly Volume full width */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-violet-400" /> Weekly Volume</h3>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeStats.weeklyVolume} barSize={24} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", fontSize: "12px" }} />
                <Bar dataKey="volume" radius={[8, 8, 2, 2]}>
                  {safeStats.weeklyVolume.map((entry: any, index: number) => (<Cell key={index} fill={entry.volume > 0 ? "url(#barGrad)" : "rgba(255,255,255,0.05)"} stroke={entry.volume > 0 ? "rgba(124,58,237,0.3)" : "transparent"} />))}
                </Bar>
                <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Personal Records</h3>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{safeStats.personalRecords.length} PRs</span>
          </div>
          {safeStats.personalRecords.length === 0 ? (
            <div className="text-center py-5 text-muted-foreground"><Trophy className="w-7 h-7 mx-auto mb-2 opacity-20" /><p className="text-sm">Log workouts to track your PRs</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {safeStats.personalRecords.slice(0, 4).map((pr: any, i: number) => (
                <motion.div key={pr.exerciseId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-yellow-500" /></div>
                    <div><p className="font-semibold text-sm">{pr.exerciseName}</p><p className="text-xs text-muted-foreground">{format(new Date(pr.date), "MMM d, yyyy")}</p></div>
                  </div>
                  <div className="text-right"><p className="font-display font-bold text-yellow-500 text-lg">{pr.weightKg}</p><p className="text-xs text-muted-foreground">kg</p></div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm">Recent Workouts</h3>
            <Link href="/workout" className="text-xs text-violet-400 hover:underline flex items-center gap-1">See all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {safeStats.recentWorkouts.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-white/10 rounded-2xl text-muted-foreground">
              <p className="text-sm">No workouts yet.</p>
              <Link href="/workout" className="text-violet-400 text-sm font-medium mt-2 inline-block hover:underline">Start your first workout!</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {safeStats.recentWorkouts.slice(0, 3).map((workout: any, i: number) => (
                <Link key={workout.id} href={`/workout/active/${workout.id}`} className="block group">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-violet-500/30 transition-all group-hover:bg-black/60 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-xs text-muted-foreground mb-1">{format(new Date(workout.date), "MMM d")}</p>
                    <h4 className="font-semibold text-sm group-hover:text-violet-400 transition-colors">{workout.name}</h4>
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {workout.exerciseCount} ex</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {workout.caloriesBurned || 0} kcal</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{workout.muscleGroup || "Mixed"}</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {showUpgrade && <UpgradeModal trigger="general" onClose={() => setShowUpgrade(false)} onSuccess={() => setShowUpgrade(false)} />}
    </PageTransition>
  );
}
