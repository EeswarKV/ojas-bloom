import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from "react-native";
import { Leaf, Eye, EyeOff, Fingerprint } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { supabase } from "../lib/supabase";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Button, Field, InputBox } from "../components/UI";

export default function AuthScreen({ hasStoredSession = false, onBiometricUnlock, onFullSignOut }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== "web") {
      (async () => {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHW && enrolled);
      })();
    }
  }, []);

  const signIn = async () => {
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) setError(authError.message);
  };

  const signInWithBiometric = async () => {
    if (!hasStoredSession) {
      setError("Sign in with password first to enable Face ID / Touch ID."); return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Ojas Bloom Studio", fallbackLabel: "Use Password",
    });
    if (result.success) onBiometricUnlock?.();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap}>
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.logoSection}>
          <View style={s.logoMark}><Leaf color={COLORS.gold} size={30} /></View>
          <Text style={s.appName}>Ojas Bloom</Text>
          <Text style={s.tagline}>Studio Manager</Text>
        </View>

        <View style={[s.card, SHADOW.md]}>
          <Text style={s.cardTitle}>Staff sign in</Text>
          <Text style={s.cardSubtitle}>Your account is managed by the studio owner.</Text>

          <View style={{ marginTop: 20 }}>
            <Field label="Email">
              <InputBox value={email} onChangeText={(v) => { setEmail(v); setError(""); }}
                autoCapitalize="none" keyboardType="email-address" placeholder="you@studio.com" returnKeyType="next" />
            </Field>
            <Field label="Password">
              <View style={s.passwordWrap}>
                <InputBox value={password} onChangeText={(v) => { setPassword(v); setError(""); }}
                  secureTextEntry={!showPassword} placeholder="••••••••" returnKeyType="go"
                  onSubmitEditing={signIn}
                  style={{ flex: 1, borderWidth: 0, paddingVertical: 0, paddingHorizontal: 0 }} />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword ? <EyeOff size={17} color={COLORS.muted} /> : <Eye size={17} color={COLORS.muted} />}
                </TouchableOpacity>
              </View>
            </Field>
          </View>

          {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

          <Button onPress={signIn} style={{ marginTop: 6 }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          {biometricAvailable && (
            <TouchableOpacity onPress={signInWithBiometric} style={s.bioBtn} activeOpacity={0.75}>
              <Fingerprint size={18} color={COLORS.brand} />
              <Text style={s.bioBtnText}>
                {hasStoredSession ? "Sign in with Face ID / Touch ID" : "Use Face ID / Touch ID"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {hasStoredSession && onFullSignOut && (
          <TouchableOpacity onPress={onFullSignOut} style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 13, color: COLORS.muted }}>Sign out completely</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg, padding: 24 },
  content: { width: "100%", maxWidth: 360, alignItems: "center" },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoMark: { width: 68, height: 68, borderRadius: 20, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 24, fontWeight: "700", color: COLORS.brand, letterSpacing: -0.3 },
  tagline: { fontSize: 13, color: COLORS.muted, marginTop: 3 },
  card: { width: "100%", backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: COLORS.ink },
  cardSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  passwordWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FDFDFC", gap: 8 },
  errorBox: { backgroundColor: COLORS.redTint, borderRadius: RADIUS.sm, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  errorText: { color: COLORS.red, fontSize: 13, fontWeight: "500" },
  bioBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  bioBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.brand },
});
