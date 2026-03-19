import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { PageTransition, LoadingState } from "@/components/ui/LoadingState";
import { User, Settings, LogOut, Target } from "lucide-react";

export default function Profile() {
  const { data: rawProfile, isLoading } = useGetProfile();
  const { user, logout } = useAuth();

  if (isLoading) return <LoadingState message="Loading profile..." />;

  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
    ? rawProfile as any
    : null;

  const displayName = profile?.name || user?.firstName || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

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
              {profile.experienceLevel || "Beginner"} • {profile.fitnessGoal || "General Fitness"}
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
                  <span className="font-medium">{profile.age ?? "—"} years</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{profile.heightCm ?? "—"} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Weight</span>
                  <span className="font-medium">{profile.weightKg ?? "—"} kg</span>
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
                  <span className="text-muted-foreground">Activity Level</span>
                  <span className="font-medium capitalize">{profile.activityLevel ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System</span>
                  <span className="font-medium">Metric</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl text-center text-muted-foreground">
            <p className="text-sm">Profile data not available. Complete onboarding to set up your profile.</p>
          </div>
        )}

        <div className="space-y-3 pt-6">
          <button className="w-full glass-card p-4 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium">Edit Profile</span>
            </div>
          </button>

          <button
            onClick={() => logout()}
            className="w-full glass-card p-4 rounded-2xl flex items-center justify-between border-destructive/20 hover:bg-destructive/10 hover:border-destructive/50 transition-colors group"
          >
            <div className="flex items-center gap-3 text-destructive">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
