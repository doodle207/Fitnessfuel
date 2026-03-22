import { useState } from "react";
import { useGetProfile, useCreateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { User, Settings, LogOut, Target, X, Check, ChevronDown, Save, Globe } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "weight loss",          label: "Lose Fat" },
  { value: "muscle gain",          label: "Build Muscle" },
  { value: "maintenance",          label: "Maintain" },
  { value: "recomposition",        label: "Recomposition" },
  { value: "athletic performance", label: "Performance" },
  { value: "general fitness",      label: "General Fitness" },
  { value: "flexibility",          label: "Flexibility" },
];
const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light",     label: "Light" },
  { value: "moderate",  label: "Moderate" },
  { value: "active",    label: "Active" },
  { value: "athlete",   label: "Athlete" },
];
const DIET_OPTIONS = [
  { value: "non-veg", label: "Non-Veg" },
  { value: "veg",     label: "Vegetarian" },
  { value: "vegan",   label: "Vegan" },
];
const EXPERIENCE_OPTIONS = [
  { value: "beginner",     label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
];
const COUNTRIES = [
  "USA", "India", "UK", "Canada", "Australia", "Japan", "Brazil", "Mexico",
  "Germany", "France", "South Korea", "Nigeria", "South Africa", "UAE", "Philippines",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors pr-8 [color-scheme:dark]">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: rawProfile, isLoading } = useGetProfile();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [heightStr, setHeightStr] = useState("");
  const [weightStr, setWeightStr] = useState("");
  const [ageStr, setAgeStr] = useState("");

  const { mutate: saveProfile, isPending } = useCreateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        setSaveOk(true);
        setTimeout(() => { setSaveOk(false); setIsEditing(false); }, 1200);
      },
    },
  });

  if (isLoading) return <LoadingState message="Loading profile..." />;

  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
    ? rawProfile as any : null;

  const displayName = profile?.name || user?.firstName || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const openEdit = () => {
    const rawGender = profile?.gender || "male";
    const gender = rawGender === "other" ? "male" : rawGender;
    const rawActivity = profile?.activityLevel || "moderate";
    const activityLevel = rawActivity === "very active" ? "active" : rawActivity;
    const f = {
      name:             profile?.name || displayName,
      age:              profile?.age || 25,
      gender,
      heightCm:         profile?.heightCm || 170,
      weightKg:         profile?.weightKg || 70,
      fitnessGoal:      profile?.fitnessGoal || "maintenance",
      activityLevel,
      experienceLevel:  profile?.experienceLevel || "beginner",
      dietPreference:   profile?.dietPreference || "non-veg",
      country:          profile?.country || "USA",
      periodStartDate:  profile?.periodStartDate || "",
      periodEndDate:    profile?.periodEndDate || "",
    };
    setEditForm(f);
    setHeightStr(String(f.heightCm));
    setWeightStr(String(f.weightKg));
    setAgeStr(String(f.age));
    setIsEditing(true);
  };

  const setField = (key: string, val: any) => setEditForm((prev: any) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!editForm) return;
    const actMap: Record<string, string> = { active: "very active", athlete: "athlete" };
    const payload = { ...editForm, activityLevel: actMap[editForm.activityLevel] ?? editForm.activityLevel };
    saveProfile({ data: payload });
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center pb-8 border-b border-white/10">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-4xl font-display font-bold text-white">{initial}</span>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold">{displayName}</h1>
          {profile ? (
            <p className="text-muted-foreground mt-1 capitalize">
              {profile.experienceLevel || "Beginner"} · {profile.fitnessGoal || "General Fitness"}
              {profile.country && <span className="text-violet-400"> · {profile.country}</span>}
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">{user?.email || ""}</p>
          )}
        </header>

        {profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <User className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Physical Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{profile.age ?? "\u2014"} years</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{profile.heightCm ?? "\u2014"} cm</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{profile.weightKg ?? "\u2014"} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium capitalize">{profile.gender ?? "\u2014"}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 text-accent">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Preferences</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium capitalize">{profile.fitnessGoal ?? "\u2014"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Activity</span>
                  <span className="font-medium capitalize">{profile.activityLevel ?? "\u2014"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium capitalize">{profile.experienceLevel ?? "\u2014"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Diet</span>
                  <span className="font-medium capitalize">{profile.dietPreference ?? "\u2014"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span className="font-medium flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-violet-400" />{profile.country ?? "\u2014"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl text-center text-muted-foreground">
            <p className="text-sm">Profile data not available. Complete onboarding to set up your profile.</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <button onClick={openEdit}
              className="flex-1 glass-card p-4 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors group">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium">Edit Profile</span>
              </div>
            </button>
            {isEditing && editForm && (
              <button onClick={handleSave} disabled={isPending}
                className={`px-5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 ${saveOk ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"} disabled:opacity-60`}>
                {saveOk ? <><Check className="w-4 h-4" /> Saved!</> : isPending ? "..." : <><Save className="w-4 h-4" /> Save</>}
              </button>
            )}
          </div>

          <button onClick={() => logout()}
            className="w-full glass-card p-4 rounded-2xl flex items-center justify-between border-destructive/20 hover:bg-destructive/10 hover:border-destructive/50 transition-colors group">
            <div className="flex items-center gap-3 text-destructive">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </div>
          </button>
        </div>
      </div>

      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4"
          onClick={() => setIsEditing(false)}>
          <div onClick={e => e.stopPropagation()}
            className="bg-[#0d0d14] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[90dvh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
              <h3 className="font-display font-bold text-lg">Edit Profile</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={isPending}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${saveOk ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"} disabled:opacity-60`}>
                  {saveOk ? <><Check className="w-4 h-4" /> Saved!</> : isPending ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save</>}
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4" style={{ WebkitOverflowScrolling: "touch" as any, touchAction: "pan-y", overscrollBehavior: "contain" }}>
              <Field label="Name">
                <input type="text" value={editForm.name}
                  onChange={e => setField("name", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Age">
                  <input type="text" inputMode="numeric" value={ageStr}
                    onChange={e => { setAgeStr(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) setField("age", v); }}
                    onBlur={() => setAgeStr(String(editForm.age))}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                </Field>
                <Field label="Height (cm)">
                  <input type="text" inputMode="decimal" value={heightStr}
                    onChange={e => { setHeightStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setField("heightCm", v); }}
                    onBlur={() => setHeightStr(String(editForm.heightCm))}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                </Field>
                <Field label="Weight (kg)">
                  <input type="text" inputMode="decimal" value={weightStr}
                    onChange={e => { setWeightStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setField("weightKg", v); }}
                    onBlur={() => setWeightStr(String(editForm.weightKg))}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors" />
                </Field>
              </div>

              <Field label="Gender">
                <div className="grid grid-cols-2 gap-3">
                  {["male", "female"].map(g => (
                    <button key={g} onClick={() => setField("gender", g)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-colors capitalize border ${editForm.gender === g ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                      {g === "male" ? "\u2642 Male" : "\u2640 Female"}
                    </button>
                  ))}
                </div>
              </Field>

              {editForm.gender === "female" && (
                <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{"\uD83C\uDF38"}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-pink-300">Menstruation Cycle</span>
                  </div>
                  <Field label="Last Period Start Date">
                    <input type="date" value={editForm.periodStartDate || ""} max={new Date().toISOString().split("T")[0]}
                      onChange={e => setField("periodStartDate", e.target.value || null)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-pink-500 outline-none text-white text-sm transition-colors [color-scheme:dark]" />
                  </Field>
                  <Field label="Last Period End Date">
                    <input type="date" value={editForm.periodEndDate || ""} min={editForm.periodStartDate || undefined} max={new Date().toISOString().split("T")[0]}
                      onChange={e => setField("periodEndDate", e.target.value || null)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-pink-500 outline-none text-white text-sm transition-colors [color-scheme:dark]" />
                  </Field>
                  <p className="text-xs text-white/30 leading-relaxed">Used to show your cycle phase on the Dashboard and give personalized insights.</p>
                </div>
              )}

              <Field label="Country">
                <div className="relative">
                  <select value={editForm.country || "USA"} onChange={e => setField("country", e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 outline-none text-white text-sm transition-colors pr-8 [color-scheme:dark]">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </Field>

              <Field label="Fitness Goal">
                <SelectField value={editForm.fitnessGoal} onChange={v => setField("fitnessGoal", v)} options={GOAL_OPTIONS} />
              </Field>

              <Field label="Activity Level">
                <SelectField value={editForm.activityLevel} onChange={v => setField("activityLevel", v)} options={ACTIVITY_OPTIONS} />
              </Field>

              <Field label="Experience">
                <SelectField value={editForm.experienceLevel} onChange={v => setField("experienceLevel", v)} options={EXPERIENCE_OPTIONS} />
              </Field>

              <Field label="Diet Preference">
                <SelectField value={editForm.dietPreference} onChange={v => setField("dietPreference", v)} options={DIET_OPTIONS} />
              </Field>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
