import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Leaf } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { COLORS } from "../theme";
import { Button, Field, InputBox } from "../components/UI";

// Staff accounts are created by you (the owner) in the Supabase dashboard
// under Authentication → Users → Add user. This screen just signs them in.
export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Couldn't sign in", error.message);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap}>
      <View style={s.logoMark}>
        <Leaf color="#fff" size={22} />
      </View>
      <Text style={s.title}>Ojas Bloom</Text>
      <Text style={s.subtitle}>Studio Manager — staff sign in</Text>

      <View style={{ marginTop: 28, width: "100%", maxWidth: 340 }}>
        <Field label="Email">
          <InputBox value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@studio.com" />
        </Field>
        <Field label="Password">
          <InputBox value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        </Field>
        <Button onPress={signIn} style={{ marginTop: 4 }}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg, padding: 24 },
  logoMark: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.brand, marginTop: 14 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
});
