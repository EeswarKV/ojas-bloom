import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

// Web: polyfill localStorage; Native: use AsyncStorage for persistent sessions
if (Platform.OS === "web") {
  require("expo-sqlite/localStorage/install");
}

let authStorage;
if (Platform.OS === "web") {
  authStorage = typeof localStorage !== "undefined" ? localStorage : undefined;
} else {
  // AsyncStorage keeps the Supabase session alive between app restarts
  // so Face ID / Touch ID lock screen works properly
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  authStorage = AsyncStorage;
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://ykxjcrbjxluiwomyrjeb.supabase.co";

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGpjcmJqeGx1aXdvbXlyamViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjUxNzMsImV4cCI6MjEwMTEwMTE3M30.6A1KlWdIriPPthWWCh5VsPCJcKIKP0YA_Pu4GubP37o";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

