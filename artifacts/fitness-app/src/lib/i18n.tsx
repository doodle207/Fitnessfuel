import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export const LANG_KEY = "cfx_language";

export const LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧", dir: "ltr" as const },
  { code: "zh", label: "中文",       flag: "🇨🇳", dir: "ltr" as const },
  { code: "hi", label: "हिंदी",      flag: "🇮🇳", dir: "ltr" as const },
  { code: "es", label: "Español",   flag: "🇪🇸", dir: "ltr" as const },
  { code: "fr", label: "Français",  flag: "🇫🇷", dir: "ltr" as const },
  { code: "ar", label: "العربية",    flag: "🇸🇦", dir: "rtl" as const },
  { code: "de", label: "Deutsch",   flag: "🇩🇪", dir: "ltr" as const },
  { code: "ru", label: "Русский",   flag: "🇷🇺", dir: "ltr" as const },
  { code: "pt", label: "Português", flag: "🇧🇷", dir: "ltr" as const },
  { code: "ja", label: "日本語",     flag: "🇯🇵", dir: "ltr" as const },
];

export type LangCode = typeof LANGUAGES[number]["code"];

export interface Translations {
  // Navigation
  nav_dashboard: string;
  nav_workout: string;
  nav_diet: string;
  nav_progress: string;
  nav_ai_coach: string;
  nav_premium: string;
  nav_profile: string;

  // Greeting
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  greeting_night: string;

  // Dashboard
  todays_overview: string;
  swipe: string;
  calories: string;
  today: string;
  eaten: string;
  burned: string;
  target: string;
  cut: string;
  bulk: string;
  maintain: string;
  macros: string;
  protein: string;
  carbs: string;
  fat: string;
  diet: string;
  hydration: string;
  glasses: string;
  steps: string;
  step_calories: string;
  weekly_volume: string;
  workouts: string;
  recent_workouts: string;
  no_workouts: string;
  start_now: string;
  top_records: string;
  no_records: string;
  streak: string;
  day: string;
  next: string;
  cycle_tracker: string;
  cycle_setup: string;
  cycle_setup_desc: string;
  set_up: string;
  kcal: string;
  log_food: string;
  workout_btn: string;
  add_water: string;
  add_steps: string;
  save: string;
  cancel: string;
  sets: string;
  reps: string;
  kg: string;
  total_workouts: string;
  days_streak: string;
  future_body: string;
  future_body_desc: string;
  try_now: string;
}

const T: Record<LangCode, Translations> = {
  en: {
    nav_dashboard: "Dashboard", nav_workout: "Workout", nav_diet: "Diet",
    nav_progress: "Progress", nav_ai_coach: "AI Coach", nav_premium: "Premium", nav_profile: "Profile",
    greeting_morning: "Good Morning", greeting_afternoon: "Good Afternoon",
    greeting_evening: "Good Evening", greeting_night: "Good Night",
    todays_overview: "Today's Overview", swipe: "Swipe →",
    calories: "Calories", today: "Today", eaten: "Eaten", burned: "Burned", target: "Target",
    cut: "Cut", bulk: "Bulk", maintain: "Maintain",
    macros: "Macros", protein: "Protein", carbs: "Carbs", fat: "Fat",
    diet: "Diet", hydration: "Hydration", glasses: "glasses", steps: "Steps",
    step_calories: "Step calories", weekly_volume: "Weekly Volume",
    workouts: "Workouts", recent_workouts: "Recent Workouts",
    no_workouts: "No workouts yet", start_now: "Start now",
    top_records: "Top Records", no_records: "No records yet",
    streak: "Streak", day: "Day", next: "Next",
    cycle_tracker: "Cycle Tracker", cycle_setup: "Cycle Tracker",
    cycle_setup_desc: "Tap to set your period dates", set_up: "Set up →",
    kcal: "kcal", log_food: "Log Food", workout_btn: "Workout",
    add_water: "Add Water", add_steps: "Add Steps", save: "Save", cancel: "Cancel",
    sets: "sets", reps: "reps", kg: "kg",
    total_workouts: "Total Workouts", days_streak: "day streak",
    future_body: "Future Body Simulator", future_body_desc: "See your transformation in 90 days",
    try_now: "Try now",
  },
  zh: {
    nav_dashboard: "仪表盘", nav_workout: "锻炼", nav_diet: "饮食",
    nav_progress: "进度", nav_ai_coach: "AI教练", nav_premium: "高级版", nav_profile: "个人资料",
    greeting_morning: "早上好", greeting_afternoon: "下午好",
    greeting_evening: "晚上好", greeting_night: "晚安",
    todays_overview: "今日概览", swipe: "滑动 →",
    calories: "卡路里", today: "今天", eaten: "已吃", burned: "已燃烧", target: "目标",
    cut: "减脂", bulk: "增肌", maintain: "保持",
    macros: "宏量素", protein: "蛋白质", carbs: "碳水", fat: "脂肪",
    diet: "饮食", hydration: "补水", glasses: "杯", steps: "步数",
    step_calories: "步行卡路里", weekly_volume: "每周训练量",
    workouts: "锻炼", recent_workouts: "最近锻炼",
    no_workouts: "暂无锻炼记录", start_now: "立即开始",
    top_records: "最佳记录", no_records: "暂无记录",
    streak: "连续", day: "天", next: "下次",
    cycle_tracker: "周期追踪", cycle_setup: "周期追踪",
    cycle_setup_desc: "点击设置月经日期", set_up: "设置 →",
    kcal: "千卡", log_food: "记录食物", workout_btn: "锻炼",
    add_water: "添加水", add_steps: "添加步数", save: "保存", cancel: "取消",
    sets: "组", reps: "次", kg: "公斤",
    total_workouts: "总锻炼次数", days_streak: "天连续",
    future_body: "未来体型模拟器", future_body_desc: "90天后你的样子",
    try_now: "立即体验",
  },
  hi: {
    nav_dashboard: "डैशबोर्ड", nav_workout: "व्यायाम", nav_diet: "आहार",
    nav_progress: "प्रगति", nav_ai_coach: "AI कोच", nav_premium: "प्रीमियम", nav_profile: "प्रोफ़ाइल",
    greeting_morning: "सुप्रभात", greeting_afternoon: "नमस्ते",
    greeting_evening: "शुभ संध्या", greeting_night: "शुभ रात्रि",
    todays_overview: "आज का सारांश", swipe: "स्वाइप करें →",
    calories: "कैलोरी", today: "आज", eaten: "खाया", burned: "जलाया", target: "लक्ष्य",
    cut: "कटिंग", bulk: "बल्किंग", maintain: "बनाए रखें",
    macros: "मैक्रोज़", protein: "प्रोटीन", carbs: "कार्ब्स", fat: "वसा",
    diet: "आहार", hydration: "हाइड्रेशन", glasses: "गिलास", steps: "कदम",
    step_calories: "कदम कैलोरी", weekly_volume: "साप्ताहिक वॉल्यूम",
    workouts: "व्यायाम", recent_workouts: "हालिया व्यायाम",
    no_workouts: "अभी तक कोई व्यायाम नहीं", start_now: "अभी शुरू करें",
    top_records: "शीर्ष रिकॉर्ड", no_records: "अभी तक कोई रिकॉर्ड नहीं",
    streak: "स्ट्रीक", day: "दिन", next: "अगला",
    cycle_tracker: "साइकल ट्रैकर", cycle_setup: "साइकल ट्रैकर",
    cycle_setup_desc: "अपनी माहवारी तिथियाँ सेट करें", set_up: "सेट करें →",
    kcal: "किलो कैलोरी", log_food: "खाना दर्ज करें", workout_btn: "व्यायाम",
    add_water: "पानी जोड़ें", add_steps: "कदम जोड़ें", save: "सहेजें", cancel: "रद्द करें",
    sets: "सेट", reps: "रेप", kg: "किग्रा",
    total_workouts: "कुल व्यायाम", days_streak: "दिन की स्ट्रीक",
    future_body: "भविष्य का शरीर सिमुलेटर", future_body_desc: "90 दिनों में आपका बदलाव",
    try_now: "अभी आज़माएं",
  },
  es: {
    nav_dashboard: "Tablero", nav_workout: "Ejercicio", nav_diet: "Dieta",
    nav_progress: "Progreso", nav_ai_coach: "Entrenador IA", nav_premium: "Premium", nav_profile: "Perfil",
    greeting_morning: "Buenos días", greeting_afternoon: "Buenas tardes",
    greeting_evening: "Buenas tardes", greeting_night: "Buenas noches",
    todays_overview: "Resumen de hoy", swipe: "Deslizar →",
    calories: "Calorías", today: "Hoy", eaten: "Comido", burned: "Quemado", target: "Meta",
    cut: "Déficit", bulk: "Volumen", maintain: "Mantener",
    macros: "Macros", protein: "Proteína", carbs: "Carbos", fat: "Grasa",
    diet: "Dieta", hydration: "Hidratación", glasses: "vasos", steps: "Pasos",
    step_calories: "Cal. de pasos", weekly_volume: "Volumen semanal",
    workouts: "Entrenamientos", recent_workouts: "Entrenamientos recientes",
    no_workouts: "Sin entrenamientos aún", start_now: "Empezar ahora",
    top_records: "Mejores marcas", no_records: "Sin récords aún",
    streak: "Racha", day: "Día", next: "Próximo",
    cycle_tracker: "Seguimiento del ciclo", cycle_setup: "Seguimiento del ciclo",
    cycle_setup_desc: "Toca para establecer tus fechas", set_up: "Configurar →",
    kcal: "kcal", log_food: "Registrar comida", workout_btn: "Ejercicio",
    add_water: "Añadir agua", add_steps: "Añadir pasos", save: "Guardar", cancel: "Cancelar",
    sets: "series", reps: "reps", kg: "kg",
    total_workouts: "Entrenamientos totales", days_streak: "días de racha",
    future_body: "Simulador de cuerpo futuro", future_body_desc: "Ve tu transformación en 90 días",
    try_now: "Probar ahora",
  },
  fr: {
    nav_dashboard: "Tableau de bord", nav_workout: "Entraînement", nav_diet: "Alimentation",
    nav_progress: "Progrès", nav_ai_coach: "Coach IA", nav_premium: "Premium", nav_profile: "Profil",
    greeting_morning: "Bonjour", greeting_afternoon: "Bon après-midi",
    greeting_evening: "Bonsoir", greeting_night: "Bonne nuit",
    todays_overview: "Aperçu du jour", swipe: "Glisser →",
    calories: "Calories", today: "Aujourd'hui", eaten: "Mangé", burned: "Brûlé", target: "Objectif",
    cut: "Sèche", bulk: "Prise de masse", maintain: "Maintien",
    macros: "Macros", protein: "Protéine", carbs: "Glucides", fat: "Lipides",
    diet: "Alimentation", hydration: "Hydratation", glasses: "verres", steps: "Pas",
    step_calories: "Cal. de marche", weekly_volume: "Volume hebdomadaire",
    workouts: "Entraînements", recent_workouts: "Entraînements récents",
    no_workouts: "Pas d'entraînement", start_now: "Commencer maintenant",
    top_records: "Meilleurs records", no_records: "Pas encore de records",
    streak: "Série", day: "Jour", next: "Prochain",
    cycle_tracker: "Suivi du cycle", cycle_setup: "Suivi du cycle",
    cycle_setup_desc: "Touchez pour définir vos dates", set_up: "Configurer →",
    kcal: "kcal", log_food: "Enregistrer repas", workout_btn: "Entraînement",
    add_water: "Ajouter eau", add_steps: "Ajouter pas", save: "Enregistrer", cancel: "Annuler",
    sets: "séries", reps: "reps", kg: "kg",
    total_workouts: "Entraînements totaux", days_streak: "jours de suite",
    future_body: "Simulateur de corps futur", future_body_desc: "Voyez votre transformation en 90 jours",
    try_now: "Essayer maintenant",
  },
  ar: {
    nav_dashboard: "لوحة التحكم", nav_workout: "التمرين", nav_diet: "النظام الغذائي",
    nav_progress: "التقدم", nav_ai_coach: "مدرب AI", nav_premium: "بريميوم", nav_profile: "الملف الشخصي",
    greeting_morning: "صباح الخير", greeting_afternoon: "مساء الخير",
    greeting_evening: "مساء الخير", greeting_night: "تصبح على خير",
    todays_overview: "ملخص اليوم", swipe: "→ اسحب",
    calories: "السعرات", today: "اليوم", eaten: "مُتناوَل", burned: "محروق", target: "الهدف",
    cut: "تخفيف", bulk: "ضخامة", maintain: "المحافظة",
    macros: "العناصر الكبرى", protein: "بروتين", carbs: "كربوهيدرات", fat: "دهون",
    diet: "الغذاء", hydration: "الترطيب", glasses: "أكواب", steps: "خطوات",
    step_calories: "سعرات المشي", weekly_volume: "الحجم الأسبوعي",
    workouts: "تمارين", recent_workouts: "التمارين الأخيرة",
    no_workouts: "لا تمارين بعد", start_now: "ابدأ الآن",
    top_records: "أفضل الأرقام", no_records: "لا أرقام بعد",
    streak: "سلسلة", day: "يوم", next: "التالي",
    cycle_tracker: "متتبع الدورة", cycle_setup: "متتبع الدورة",
    cycle_setup_desc: "اضغط لتعيين تواريخ دورتك", set_up: "إعداد →",
    kcal: "كيلو كالوري", log_food: "تسجيل الطعام", workout_btn: "التمرين",
    add_water: "أضف ماء", add_steps: "أضف خطوات", save: "حفظ", cancel: "إلغاء",
    sets: "مجموعات", reps: "تكرار", kg: "كغ",
    total_workouts: "إجمالي التمارين", days_streak: "أيام متتالية",
    future_body: "محاكي الجسم المستقبلي", future_body_desc: "شاهد تحولك في 90 يومًا",
    try_now: "جرب الآن",
  },
  de: {
    nav_dashboard: "Dashboard", nav_workout: "Training", nav_diet: "Ernährung",
    nav_progress: "Fortschritt", nav_ai_coach: "AI-Trainer", nav_premium: "Premium", nav_profile: "Profil",
    greeting_morning: "Guten Morgen", greeting_afternoon: "Guten Nachmittag",
    greeting_evening: "Guten Abend", greeting_night: "Gute Nacht",
    todays_overview: "Heutige Übersicht", swipe: "Wischen →",
    calories: "Kalorien", today: "Heute", eaten: "Gegessen", burned: "Verbrannt", target: "Ziel",
    cut: "Schneiden", bulk: "Masse", maintain: "Halten",
    macros: "Makros", protein: "Protein", carbs: "Kohlenhydrate", fat: "Fett",
    diet: "Ernährung", hydration: "Flüssigkeitszufuhr", glasses: "Gläser", steps: "Schritte",
    step_calories: "Schritt-Kalorien", weekly_volume: "Wöchentliches Volumen",
    workouts: "Trainingseinheiten", recent_workouts: "Kürzliche Trainingseinheiten",
    no_workouts: "Noch keine Trainingseinheiten", start_now: "Jetzt starten",
    top_records: "Top-Rekorde", no_records: "Keine Rekorde",
    streak: "Serie", day: "Tag", next: "Nächster",
    cycle_tracker: "Zyklus-Tracker", cycle_setup: "Zyklus-Tracker",
    cycle_setup_desc: "Tippen Sie, um Ihre Daten einzustellen", set_up: "Einrichten →",
    kcal: "kcal", log_food: "Essen protokollieren", workout_btn: "Training",
    add_water: "Wasser hinzufügen", add_steps: "Schritte hinzufügen", save: "Speichern", cancel: "Abbrechen",
    sets: "Sätze", reps: "Wiederholungen", kg: "kg",
    total_workouts: "Gesamte Trainingseinheiten", days_streak: "Tage hintereinander",
    future_body: "Körper-Simulator der Zukunft", future_body_desc: "Sehen Sie Ihre Umwandlung in 90 Tagen",
    try_now: "Jetzt versuchen",
  },
  ru: {
    nav_dashboard: "Панель", nav_workout: "Тренировка", nav_diet: "Питание",
    nav_progress: "Прогресс", nav_ai_coach: "AI тренер", nav_premium: "Премиум", nav_profile: "Профиль",
    greeting_morning: "Доброе утро", greeting_afternoon: "Добрый день",
    greeting_evening: "Добрый вечер", greeting_night: "Спокойной ночи",
    todays_overview: "Сегодняшний обзор", swipe: "Листайте →",
    calories: "Калории", today: "Сегодня", eaten: "Съедено", burned: "Сожжено", target: "Цель",
    cut: "Сушка", bulk: "Масса", maintain: "Поддержание",
    macros: "Макросы", protein: "Белок", carbs: "Углеводы", fat: "Жиры",
    diet: "Питание", hydration: "Гидратация", glasses: "стаканов", steps: "Шаги",
    step_calories: "Калории от шагов", weekly_volume: "Еженедельный объём",
    workouts: "Тренировки", recent_workouts: "Недавние тренировки",
    no_workouts: "Нет тренировок", start_now: "Начать сейчас",
    top_records: "Лучшие результаты", no_records: "Записей пока нет",
    streak: "Серия", day: "День", next: "Следующий",
    cycle_tracker: "Трекер цикла", cycle_setup: "Трекер цикла",
    cycle_setup_desc: "Нажмите, чтобы задать даты", set_up: "Настроить →",
    kcal: "ккал", log_food: "Записать еду", workout_btn: "Тренировка",
    add_water: "Добавить воду", add_steps: "Добавить шаги", save: "Сохранить", cancel: "Отмена",
    sets: "подходы", reps: "повторения", kg: "кг",
    total_workouts: "Всего тренировок", days_streak: "дней подряд",
    future_body: "Симулятор тела", future_body_desc: "Увидьте преображение за 90 дней",
    try_now: "Попробовать",
  },
  pt: {
    nav_dashboard: "Painel", nav_workout: "Treino", nav_diet: "Dieta",
    nav_progress: "Progresso", nav_ai_coach: "Treinador IA", nav_premium: "Premium", nav_profile: "Perfil",
    greeting_morning: "Bom dia", greeting_afternoon: "Boa tarde",
    greeting_evening: "Boa tarde", greeting_night: "Boa noite",
    todays_overview: "Resumo de hoje", swipe: "Deslize →",
    calories: "Calorias", today: "Hoje", eaten: "Consumido", burned: "Queimado", target: "Meta",
    cut: "Déficit", bulk: "Ganho", maintain: "Manter",
    macros: "Macros", protein: "Proteína", carbs: "Carboidratos", fat: "Gordura",
    diet: "Dieta", hydration: "Hidratação", glasses: "copos", steps: "Passos",
    step_calories: "Cal. de passos", weekly_volume: "Volume semanal",
    workouts: "Treinos", recent_workouts: "Treinos recentes",
    no_workouts: "Sem treinos ainda", start_now: "Começar agora",
    top_records: "Melhores marcas", no_records: "Sem recordes ainda",
    streak: "Sequência", day: "Dia", next: "Próximo",
    cycle_tracker: "Rastreador do ciclo", cycle_setup: "Rastreador do ciclo",
    cycle_setup_desc: "Toque para definir suas datas", set_up: "Configurar →",
    kcal: "kcal", log_food: "Registrar refeição", workout_btn: "Treino",
    add_water: "Adicionar água", add_steps: "Adicionar passos", save: "Salvar", cancel: "Cancelar",
    sets: "séries", reps: "reps", kg: "kg",
    total_workouts: "Total de treinos", days_streak: "dias seguidos",
    future_body: "Simulador de corpo futuro", future_body_desc: "Veja sua transformação em 90 dias",
    try_now: "Tentar agora",
  },
  ja: {
    nav_dashboard: "ダッシュボード", nav_workout: "ワークアウト", nav_diet: "食事",
    nav_progress: "進捗", nav_ai_coach: "AIコーチ", nav_premium: "プレミアム", nav_profile: "プロフィール",
    greeting_morning: "おはようございます", greeting_afternoon: "こんにちは",
    greeting_evening: "こんばんは", greeting_night: "おやすみなさい",
    todays_overview: "本日の概要", swipe: "→ スワイプ",
    calories: "カロリー", today: "今日", eaten: "摂取済み", burned: "燃焼", target: "目標",
    cut: "カット", bulk: "バルク", maintain: "維持",
    macros: "マクロ", protein: "タンパク質", carbs: "炭水化物", fat: "脂肪",
    diet: "食事", hydration: "水分補給", glasses: "グラス", steps: "ステップ",
    step_calories: "ステップカロリー", weekly_volume: "週単位のボリューム",
    workouts: "ワークアウト", recent_workouts: "最近のワークアウト",
    no_workouts: "まだワークアウトはありません", start_now: "今すぐ開始",
    top_records: "トップレコード", no_records: "まだレコードはありません",
    streak: "ストリーク", day: "日", next: "次へ",
    cycle_tracker: "サイクルトラッカー", cycle_setup: "サイクルトラッカー",
    cycle_setup_desc: "タップして日付を設定", set_up: "設定 →",
    kcal: "kcal", log_food: "食事を記録", workout_btn: "ワークアウト",
    add_water: "水を追加", add_steps: "ステップを追加", save: "保存", cancel: "キャンセル",
    sets: "セット", reps: "レップ", kg: "kg",
    total_workouts: "総ワークアウト数", days_streak: "日間連続",
    future_body: "未来のボディシミュレーター", future_body_desc: "90日でのあなたの変身を見てください",
    try_now: "今すぐ試す",
  },
};

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: Translations;
  dir: "ltr" | "rtl";
  currentLang: typeof LANGUAGES[number];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: T.en,
  dir: "ltr",
  currentLang: LANGUAGES[0],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = localStorage.getItem(LANG_KEY) as LangCode | null;
    return saved && T[saved] ? saved : "en";
  });

  const setLang = (code: LangCode) => {
    setLangState(code);
    localStorage.setItem(LANG_KEY, code);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const dir = currentLang.dir;

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: T[lang] || T.en, dir, currentLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
