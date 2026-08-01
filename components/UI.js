import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Leaf, User } from "lucide-react-native";
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

export function Sidebar({ tabs, activeTab, onSelect, onSignOut }) {
  return (
    <View style={sb.wrap}>
      <View style={sb.logoRow}>
        <View style={sb.logoMark}>
          <Leaf color="#fff" size={16} />
        </View>
        <View>
          <Text style={sb.word}>Ojas Bloom</Text>
          <Text style={sb.wordSub}>Studio Manager</Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => onSelect(t.id)} style={[sb.navItem, active && sb.navItemActive]}>
              <Icon size={16} color={active ? "#fff" : "#CBBED3"} />
              <Text style={[sb.navLabel, active && { color: "#fff" }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {onSignOut && (
        <TouchableOpacity onPress={onSignOut} style={sb.signOut}>
          <Text style={sb.signOutText}>Sign out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { width: 236, backgroundColor: COLORS.brand, padding: 14, height: "100%" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, paddingBottom: 22, paddingTop: 4 },
  logoMark: { width: 34, height: 34, borderRadius: 9, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  word: { fontSize: 15, fontWeight: "600", color: "#F6F2F8" },
  wordSub: { fontSize: 11, color: "#B6A9C0", marginTop: 1 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "transparent" },
  navItemActive: { backgroundColor: COLORS.brandLight, borderLeftColor: COLORS.gold },
  navLabel: { fontSize: 13.5, fontWeight: "500", color: "#CBBED3" },
  signOut: { padding: 12, borderTopWidth: 1, borderTopColor: COLORS.brandLight, marginTop: 8 },
  signOutText: { fontSize: 12, color: "#B6A9C0" },
});

export function AppHeader({ email, onSignOut, dark }) {
  const insets = useSafeAreaInsets();
  const bg = dark ? COLORS.brand : COLORS.bg;
  const textColor = dark ? "#F6F2F8" : COLORS.brand;

  const openMenu = () => {
    Alert.alert(email || "Account", "Signed in to Ojas Bloom Studio Manager", [
      { text: "Sign out", style: "destructive", onPress: onSignOut },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View
      style={[
        hd.wrap,
        { backgroundColor: bg, borderBottomColor: dark ? COLORS.brandLight : COLORS.border, paddingTop: insets.top + 10 },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={hd.logoMark}>
          <Leaf size={15} color="#fff" />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: textColor }}>Ojas Bloom</Text>
      </View>
      <TouchableOpacity onPress={openMenu} style={[hd.avatar, { borderColor: dark ? "#fff" : COLORS.brand }]}>
        <User size={16} color={dark ? "#fff" : COLORS.brand} />
      </TouchableOpacity>
    </View>
  );
}

const hd = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  logoMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});

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