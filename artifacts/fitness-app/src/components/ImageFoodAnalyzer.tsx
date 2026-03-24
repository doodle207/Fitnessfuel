import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload, Edit2, Check, Loader2, AlertCircle, Sparkles, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif" ||
      type === "image/heic-sequence" || type === "image/heif-sequence") {
    return true;
  }
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

async function normalizeToJpeg(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    const outputBlob = Array.isArray(blob) ? blob[0] : blob;
    return new File(
      [outputBlob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  } catch (err) {
    throw new Error("Could not convert HEIC image. Please use a JPG or PNG file instead.");
  }
}

interface MacroItem {
  foodName: string; calories: number; proteinG: number; carbsG: number; fatG: number;
  source: "openfoodfacts" | "ai_estimate";
}
interface AnalysisResult {
  items: MacroItem[];
  total: { calories: number; proteinG: number; carbsG: number; fatG: number };
  combinedName: string;
}
interface EditableResult { foodName: string; calories: number; proteinG: number; carbsG: number; fatG: number; }

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" }, { id: "lunch", label: "Lunch" },
  { id: "snack", label: "Snacks" }, { id: "dinner", label: "Dinner" },
];

interface Props {
  activeMealTab: string; onFoodLogged: (entry: any) => void;
  onClose: () => void; onLimitReached?: () => void;
}

export default function ImageFoodAnalyzer({ activeMealTab, onFoodLogged, onClose, onLimitReached }: Props) {
  const [phase, setPhase] = useState<"upload" | "loading" | "result" | "error">("upload");
  const [loadingStep, setLoadingStep] = useState<"converting" | "analyzing">("analyzing");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editable, setEditable] = useState<EditableResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState(activeMealTab);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !isHeic(file)) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WEBP, or HEIC).");
      setPhase("error"); return;
    }
    setPhase("loading");
    let uploadFile: File;
    try {
      setLoadingStep(isHeic(file) ? "converting" : "analyzing");
      uploadFile = await normalizeToJpeg(file);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to process the image.");
      setPhase("error"); return;
    }
    setLoadingStep("analyzing");
    setPreview(URL.createObjectURL(uploadFile));
    const formData = new FormData();
    formData.append("image", uploadFile);
    try {
      const res = await fetch(`${BASE}/api/diet/analyze-image`, { method: "POST", credentials: "include", body: formData });
      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch {
        setErrorMsg(`Unexpected server response (status ${res.status}).`);
        setPhase("error"); return;
      }
      if (res.status === 429 && data?.limitReached) { onClose(); onLimitReached?.(); return; }
      if (!res.ok) { setErrorMsg(data?.error || `Server error (${res.status}).`); setPhase("error"); return; }
      setResult(data);
      setEditable({ foodName: data.combinedName, calories: data.total.calories, proteinG: data.total.proteinG, carbsG: data.total.carbsG, fatG: data.total.fatG });
      setPhase("result");
    } catch {
      setErrorMsg("Could not reach the server. Please check your connection.");
      setPhase("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleSave = async () => {
    if (!editable) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(`${BASE}/api/diet/save-analyzed-food`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: editable.foodName, calories: editable.calories, proteinG: editable.proteinG, carbsG: editable.carbsG, fatG: editable.fatG, mealType, date: today }),
      });
      const data = await res.json();
      if (res.ok && data.id) { onFoodLogged({ ...data, loggedAt: data.loggedAt }); }
      else { onFoodLogged({ id: Date.now(), ...editable, mealType, loggedAt: new Date().toISOString() }); }
      onClose();
    } catch {
      onFoodLogged({ id: Date.now(), ...editable, mealType, loggedAt: new Date().toISOString() });
      onClose();
    } finally { setSaving(false); }
  };

  const reset = () => {
    setPhase("upload"); setLoadingStep("analyzing"); setPreview(null);
    setResult(null); setEditable(null); setEditMode(false); setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d0d14] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

        <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.6)] animate-pulse">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">AI Food Scanner</h3>
              <p className="text-[11px] text-violet-400 font-medium">Snap a photo to get macros instantly ✨</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {phase === "upload" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-violet-500/40 rounded-3xl p-10 text-center cursor-pointer hover:border-violet-500/70 hover:bg-violet-500/5 transition-all group">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/5 to-cyan-600/5" />
                <motion.div whileHover={{ scale: 1.08 }} className="relative w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-violet-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                  <Upload className="w-8 h-8 text-violet-400" />
                  <div className="absolute inset-0 rounded-3xl animate-ping bg-violet-500/10 opacity-75" style={{ animationDuration: "2s" }} />
                </motion.div>
                <p className="font-bold text-base text-white mb-1">Drop an image or tap to browse</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, HEIC · Max 10MB</p>
              </div>

              <button onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border-2 border-violet-500/40 text-white font-bold text-sm flex items-center justify-center gap-3 hover:from-violet-600/30 hover:to-cyan-600/30 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.5)]">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                📸 Take a Photo
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Powered by <span className="text-violet-400 font-semibold">AI Vision</span> + <span className="text-cyan-400 font-semibold">OpenFoodFacts</span>
              </p>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-5">
              <div className="relative w-36 h-36 mx-auto">
                {preview ? (
                  <img src={preview} alt="Analyzing" className="w-full h-full object-cover rounded-2xl opacity-60" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-violet-500/10 border border-violet-500/20" />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-base text-white">{loadingStep === "converting" ? "Converting image..." : "Analyzing your meal..."}</p>
                <p className="text-xs text-muted-foreground mt-1">{loadingStep === "converting" ? "Converting to JPEG for analysis" : "AI is detecting food and calculating macros"}</p>
              </div>
              <div className="flex justify-center gap-2">
                {(loadingStep === "converting"
                  ? ["Reading", "Converting", "Preparing"]
                  : ["Detecting", "Looking up", "Calculating"]
                ).map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    className="h-1.5 w-14 rounded-full bg-violet-500/60" />
                ))}
              </div>
            </motion.div>
          )}

          {phase === "result" && result && editable && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {preview && (
                <div className="flex items-center gap-3">
                  <img src={preview} alt="Analyzed" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Detected</p>
                    <p className="font-semibold text-sm leading-tight line-clamp-2 capitalize">{result.combinedName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] text-violet-400">AI Analyzed</span>
                    </div>
                  </div>
                  <button onClick={reset} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {result.items.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Detected Items</p>
                  {result.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                      <span className="text-sm capitalize">{item.foodName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold">{item.calories} kcal</span>
                        {item.source === "ai_estimate" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">AI est.</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 to-cyan-600/10 border border-violet-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Nutrition</p>
                  <button onClick={() => setEditMode(v => !v)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors">
                    <Edit2 className="w-3 h-3" /> {editMode ? "Done" : "Edit"}
                  </button>
                </div>
                {editMode ? (
                  <div className="space-y-2">
                    <input value={editable.foodName} onChange={e => setEditable(p => p ? { ...p, foodName: e.target.value } : p)} placeholder="Food name"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      {(["calories", "proteinG", "carbsG", "fatG"] as const).map(key => (
                        <div key={key} className="relative">
                          <input type="number" value={editable[key]} onChange={e => setEditable(p => p ? { ...p, [key]: parseFloat(e.target.value) || 0 } : p)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-sm pr-10" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{key === "calories" ? "kcal" : "g"}</span>
                          <span className="absolute left-3 top-[-8px] text-[9px] text-muted-foreground bg-[#0d0d14] px-1">{key === "calories" ? "Cal" : key === "proteinG" ? "Protein" : key === "carbsG" ? "Carbs" : "Fat"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Calories", value: editable.calories, unit: "kcal", color: "text-orange-400" },
                      { label: "Protein", value: editable.proteinG, unit: "g", color: "text-blue-400" },
                      { label: "Carbs", value: editable.carbsG, unit: "g", color: "text-green-400" },
                      { label: "Fat", value: editable.fatG, unit: "g", color: "text-yellow-400" },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className="p-2 rounded-xl bg-black/30 border border-white/5">
                        <p className={`font-bold text-base ${color}`}>{value}</p>
                        <p className="text-[9px] text-muted-foreground">{unit}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowMealPicker(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/8 transition-colors">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Add to</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold capitalize">{MEAL_TYPES.find(m => m.id === mealType)?.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </button>
                <AnimatePresence>
                  {showMealPicker && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-1 left-0 right-0 bg-[#0d0d14] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                      {MEAL_TYPES.map(m => (
                        <button key={m.id} onClick={() => { setMealType(m.id); setShowMealPicker(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors ${mealType === m.id ? "text-violet-400 font-semibold" : "text-muted-foreground"}`}>
                          {m.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-[0_0_24px_rgba(124,58,237,0.4)]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving..." : "Add to Food Log"}
              </button>
              <button onClick={reset} className="w-full text-xs text-muted-foreground hover:text-white transition-colors py-1">Scan another image</button>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-400 mb-1">Something went wrong</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
              </div>
              <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">Try Again</button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
