import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../theme";

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHead({ eyebrow, title, right }) {
  return (
    <View style={s.cardHead}>
      <View style={{ flex: 1 }}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Button({ children, onPress, variant = "primary", style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.btn, s[`btn_${variant}`], style]}>
      <Text style={s[`btnText_${variant}`]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function Field({ label, children }) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function InputBox(props) {
  return <TextInput {...props} style={[s.input, props.style]} placeholderTextColor={COLORS.muted} />;
}

export function Badge({ ok, children }) {
  return (
    <View style={[s.badge, { backgroundColor: ok ? COLORS.brandTint : COLORS.redTint }]}>
      <Text style={{ color: ok ? COLORS.brandDark : COLORS.red, fontSize: 11, fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: 28, alignItems: "center" }}>
      <Text style={{ color: COLORS.muted, fontSize: 13.5, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function KPI({ label, value, sub, color = COLORS.brand, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={[s.card, s.kpi]}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  eyebrow: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: COLORS.muted, fontWeight: "600" },
  cardTitle: { fontSize: 14.5, fontWeight: "600", color: COLORS.ink, marginTop: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  btn_primary: { backgroundColor: COLORS.brand },
  btn_ghost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btn_danger: { backgroundColor: COLORS.redTint },
  btnText_primary: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  btnText_ghost: { color: COLORS.ink, fontWeight: "600", fontSize: 13.5 },
  btnText_danger: { color: COLORS.red, fontWeight: "600", fontSize: 13.5 },
  fieldLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: COLORS.muted, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: "#FDFDFC",
  },
  badge: { alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 9, borderRadius: RADIUS.pill },
  kpi: { flexBasis: "48%", padding: 16 },
  kpiLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "500" },
  kpiValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  kpiSub: { fontSize: 11.5, color: COLORS.muted, marginTop: 4 },
});
