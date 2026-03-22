import { useState, useEffect, useRef } from "react";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { useGetProfile } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, RefreshCw, Zap, AlertTriangle, Target, TrendingUp,
  MessageSquare, ChevronRight, Flame, Dumbbell, Sparkles, Activity
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Insights {
  todaysFocus: string;
  coachFeedback: string;
  warningAlert: string;
  quickTip: string;
  nextBestAction: string;
  weeklyStatus: string;
  moodEmoji: string;
  context?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    foodItems: number;
  };
}

interface ChatMessage {
  role: "user" | "coach";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "What should I eat today?",
  "Should I train today?",
  "Why am I not progressing?",
  "What should I fix this week?",
  "Am I eating enough protein?",
  "How do I break a plateau?",
];

export default function AICoach() {
  const { data: rawProfile } = useGetProfile();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"coach" | "chat">("coach");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile) ? rawProfile as any : null;
  const name = profile?.name?.split(" ")[0] || "Champ";

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const r = await fetch(`${BASE}/api/ai-coach/insights`, { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setInsights(data);
      }
    } catch {}
    setIsLoadingInsights(false);
  };

  useEffect(() => {
    loadInsights();
    setChatMessages([
      {
        role: "coach",
        content: `Hey ${name}! I'm your AI coach. I know your goals, your workouts, and your nutrition. Ask me anything — I give real answers based on your actual data, not generic advice.`,
        timestamp: new Date(),
      },
    ]);
  }, [name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: message, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const history = chatMessages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const r = await fetch(`${BASE}/api/ai-coach/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await r.json();
      setChatMessages(prev => [...prev, {
        role: "coach",
        content: data.reply || "I'm processing your request. Keep logging your data for better insights.",
        timestamp: new Date(),
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: "coach",
        content: "Connection issue. Make sure you're logged in and try again.",
        timestamp: new Date(),
      }]);
    }
    setIsChatLoading(false);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-5 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Brain className="w-5 h-5 text-white" />
              </span>
              AI Coach
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Personalized coaching based on your real data</p>
          </div>
          <span className="text-xs font-bold text-violet-400 bg-violet-500/15 border border-violet-500/30 px-3 py-1.5 rounded-full">PRO</span>
        </header>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          {[
            { id: "coach" as const, label: "Daily Coaching", icon: Sparkles },
            { id: "chat" as const, label: "Ask AI Coach", icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── COACHING TAB ── */}
          {activeTab === "coach" && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {isLoadingInsights ? (
                <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-4 border border-white/5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white">Analyzing your data...</p>
                    <p className="text-xs text-muted-foreground mt-1">Reading your workouts, nutrition, and progress</p>
                  </div>
                </div>
              ) : insights ? (
                <>
                  {/* Top Banner — Today's Focus */}
                  <div className="glass-card rounded-3xl p-5 border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-purple-950/30">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl leading-none mt-0.5">{insights.moodEmoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Target className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Today's Focus</span>
                        </div>
                        <p className="font-display font-bold text-xl text-white leading-snug">{insights.todaysFocus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Alert — only show if there is one */}
                  {insights.warningAlert && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-200 leading-relaxed">{insights.warningAlert}</p>
                    </div>
                  )}

                  {/* Coach Feedback */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-semibold text-sm text-cyan-400 uppercase tracking-wide">Coach Feedback</h3>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{insights.coachFeedback}</p>

                    {insights.context && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {[
                          { label: "Calories", value: insights.context.calories, color: "text-orange-400" },
                          { label: "Protein", value: `${insights.context.protein}g`, color: "text-blue-400" },
                          { label: "Carbs", value: `${insights.context.carbs}g`, color: "text-green-400" },
                          { label: "Fat", value: `${insights.context.fat}g`, color: "text-yellow-400" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center p-2 rounded-xl bg-white/4 border border-white/5">
                            <p className={`text-sm font-bold ${color}`}>{value}</p>
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Tip + Next Best Action side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h3 className="font-semibold text-xs text-amber-400 uppercase tracking-wide">Quick Tip</h3>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">{insights.quickTip}</p>
                    </div>

                    <div className="glass-card rounded-2xl p-4 border border-violet-500/15 bg-violet-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-4 h-4 text-violet-400" />
                        <h3 className="font-semibold text-xs text-violet-400 uppercase tracking-wide">Next Best Action</h3>
                      </div>
                      <p className="text-white/90 text-sm font-semibold leading-relaxed">{insights.nextBestAction}</p>
                    </div>
                  </div>

                  {/* Weekly Status */}
                  <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide mb-0.5">Weekly Status</p>
                      <p className="text-white/80 text-sm">{insights.weeklyStatus}</p>
                    </div>
                  </div>

                  {/* Reality Check / Refresh */}
                  <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-400" />
                        <h3 className="font-semibold text-sm">Reality Check Mode</h3>
                      </div>
                      <button
                        onClick={loadInsights}
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { q: "Am I on track?", a: insights.warningAlert || "You're doing well. Stay consistent." },
                        { q: "What's my priority?", a: insights.nextBestAction },
                      ].map(({ q, a }) => (
                        <div key={q} className="p-3 rounded-xl bg-white/3 border border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">{q}</p>
                          <p className="text-sm text-white/90">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card rounded-3xl p-8 text-center border border-white/5">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground text-sm">Could not load coaching insights. Make sure you have a profile set up.</p>
                  <button onClick={loadInsights} className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Quick Questions */}
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Quick Questions</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={isChatLoading}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">AI Coach</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Online · Using your real data
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-96 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {msg.role === "coach" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-white/6 border border-white/8 text-white/90 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}

                  {isChatLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-4 pb-4 pt-2 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(chatInput)}
                      placeholder="Ask anything about your fitness..."
                      disabled={isChatLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-sm text-white placeholder:text-muted-foreground transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={() => sendMessage(chatInput)}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Adaptive Coaching Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold">Adaptive Workout</h3>
                  </div>
                  <button
                    onClick={() => sendMessage("Based on my recovery and consistency, what workout intensity should I do today?")}
                    className="w-full text-left text-xs text-white/60 hover:text-white/90 transition-colors leading-relaxed"
                  >
                    Tap to get today's workout intensity recommendation based on your recovery →
                  </button>
                </div>
                <div className="glass-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold">Adaptive Nutrition</h3>
                  </div>
                  <button
                    onClick={() => sendMessage("Based on my current macro intake and goal, what should I focus on eating today?")}
                    className="w-full text-left text-xs text-white/60 hover:text-white/90 transition-colors leading-relaxed"
                  >
                    Tap to get today's macro focus based on your current intake →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
