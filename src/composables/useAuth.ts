// Authentication composable
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/plugins/supabase";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

const user = ref<User | null>(null);
const session = ref<Session | null>(null);
const profile = ref<Profile | null>(null);
const loading = ref(true);
const initialized = ref(false);
let authSubscription: {
  data: { subscription: { unsubscribe: () => void } };
} | null = null;

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!session.value);
  const isAdmin = computed(() => profile.value?.is_app_admin ?? false);

  // Initialize auth state
  async function initialize() {
    if (initialized.value) return;

    loading.value = true;
    try {
      // Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      session.value = currentSession;
      user.value = currentSession?.user ?? null;

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      }

      // Listen for auth changes and store subscription for cleanup
      authSubscription = supabase.auth.onAuthStateChange(
        async (event: any, newSession: any) => {
          session.value = newSession;
          user.value = newSession?.user ?? null;

          if (event === "SIGNED_IN" && newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else if (event === "SIGNED_OUT") {
            profile.value = null;
          }
        },
      );

      initialized.value = true;
    } finally {
      loading.value = false;
    }
  }

  // Cleanup auth subscription
  function cleanup() {
    if (authSubscription) {
      authSubscription.data.subscription.unsubscribe();
      authSubscription = null;
    }
  }

  // Fetch user profile
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    profile.value = data;
  }

  // Verify admin status server-side (for critical operations)
  async function verifyAdminStatus(): Promise<boolean> {
    if (!user.value) return false;

    try {
      const { data, error } = await supabase.rpc("is_app_admin", {
        user_id: user.value.id,
      });

      if (error) {
        console.error("Error verifying admin status:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error calling is_app_admin:", error);
      return false;
    }
  }

  // Login with email/password
  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      session.value = data.session;
      user.value = data.user;

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  // Register new user
  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Create profile (handled by database trigger, but we set it here too)
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName,
          avatar_url: null,
          is_app_admin: false,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        await fetchProfile(data.user.id);
      }

      session.value = data.session;
      user.value = data.user;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  // Logout
  async function logout() {
    loading.value = true;
    try {
      await supabase.auth.signOut();
      session.value = null;
      user.value = null;
      profile.value = null;
      router.push({ name: "login" });
    } finally {
      loading.value = false;
    }
  }

  // Update profile
  async function updateProfile(updates: Partial<Profile>) {
    if (!user.value) return { success: false, error: "Not authenticated" };

    loading.value = true;
    try {
      const { id, created_at, ...validUpdates } = updates;

      const { error } = await supabase
        .from("profiles")
        .update(validUpdates)
        .eq("id", user.value.id);

      if (error) throw error;

      // Update local state
      if (profile.value) {
        profile.value = { ...profile.value, ...updates };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  // Upload avatar to 'profiles' bucket
  async function uploadAvatar(file: File) {
    if (!user.value) return { success: false, error: "Not authenticated" };

    loading.value = true;
    try {
      const fileExt = file.name.split(".").pop();
      // Use user ID as filename to enforce 1-avatar-per-user and simple RLS
      const fileName = `${user.value.id}.${fileExt}`;

      // Upload to 'profiles' bucket
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(fileName);

      // Update profile with new URL (append random query param to bust cache)
      const result = await updateProfile({
        avatar_url: `${publicUrl}?t=${Date.now()}`,
      });
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    initialize,
    cleanup,
    verifyAdminStatus,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    fetchProfile,
  };
}
