import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

// Install the localStorage polyfill ONLY on web
if (Platform.OS === "web") {
  require("expo-sqlite/localStorage/install");
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

// On web: use localStorage (polyfilled above). On native (iOS/Android): let
// Supabase use its default in-memory storage — sessions persist per app session.
const authStorage =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage
    : undefined;

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

