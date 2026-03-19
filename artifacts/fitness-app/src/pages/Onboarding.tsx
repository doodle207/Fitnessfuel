import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { profileSchema, type ProfileFormData } from "@/lib/schemas";
import { useAuth } from "@workspace/replit-auth-web";
import { Dumbbell, Target, Flame, AlertCircle } from "lucide-react";
import { PageTransition } from "@/components/ui/LoadingState";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.firstName || "",
      age: 25,
      gender: "male",
      heightCm: 175,
      weightKg: 70,
      fitnessGoal: "muscle gain",
      experienceLevel: "beginner",
      activityLevel: "moderate"
    }
  });

  const { mutate: createProfile, isPending } = useCreateProfile({
    mutation: {
      onSuccess: () => setLocation("/"),
      onError: () => {
        setSubmitError("Unable to save your profile — the server is unavailable. Please make sure the API is running and try again.");
      }
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    setSubmitError(null);
    createProfile({ data });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-6">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">FitTrack Pro</span>
            </h1>
            <p className="text-muted-foreground text-lg">Let's customize your fitness journey.</p>
          </div>

          {submitError && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="glass-card p-6 md:p-10 rounded-3xl space-y-8">

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-2">
                <UserIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-semibold">The Basics</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <input
                    {...form.register("name")}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                  />
                  {form.formState.errors.name && <span className="text-destructive text-sm">{form.formState.errors.name.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <input
                    type="number"
                    {...form.register("age", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  {form.formState.errors.age && <span className="text-destructive text-sm">{form.formState.errors.age.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Height (cm)</label>
                  <input
                    type="number"
                    {...form.register("heightCm", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  {form.formState.errors.heightCm && <span className="text-destructive text-sm">{form.formState.errors.heightCm.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Weight (kg)</label>
                  <input
                    type="number"
                    {...form.register("weightKg", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  {form.formState.errors.weightKg && <span className="text-destructive text-sm">{form.formState.errors.weightKg.message}</span>}
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 border-b border-border pb-2">
                <Target className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-display font-semibold">Your Goals</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Primary Goal</label>
                  <select
                    {...form.register("fitnessGoal")}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  >
                    <option value="weight loss">Weight Loss</option>
                    <option value="muscle gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Experience Level</label>
                  <select
                    {...form.register("experienceLevel")}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Daily Activity Level</label>
                  <select
                    {...form.register("activityLevel")}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  >
                    <option value="sedentary">Sedentary (Office job, little exercise)</option>
                    <option value="light">Light (Light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (Moderate exercise 3-5 days/week)</option>
                    <option value="very active">Very Active (Heavy exercise 6-7 days/week)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 mt-8 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-primary to-accent shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              {isPending ? "Creating Profile..." : "Start My Journey"}
              {!isPending && <Flame className="inline-block w-5 h-5 ml-2" />}
            </button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}

function UserIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
