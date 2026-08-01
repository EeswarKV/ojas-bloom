import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Leaf, Search } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOW } from "../theme";
import { initials, avatarColor } from "../lib/helpers";

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[s.btn, s[`btn_${variant}`], style]}>
      <Text style={s[`btnText_${variant}`]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function Toggle({ active, onPress, label, small }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.toggle, active && s.toggleActive, small && { paddingVertical: 6, paddingHorizontal: 10 }]}
    >
      <Text style={{ color: active ? "#fff" : COLORS.text2, fontWeight: "600", fontSize: small ? 12 : 13 }}>{label}</Text>
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

export function SearchBar({ value, onChangeText, placeholder = "Search…" }) {
  return (
    <View style={s.searchWrap}>
      <Search size={15} color={COLORS.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={s.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 18 }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Avatar({ name, size = 38 }) {
  const bg = avatarColor(name);
  const text = initials(name);
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: Math.round(size * 0.38) }}>{text}</Text>
    </View>
  );
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

// ---- Toast ----
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: "", type: "success", _key: 0 });
  const show = (message, type = "success") =>
    setToast((t) => ({ visible: true, message, type, _key: t._key + 1 }));
  return { toast, show };
}

export function Toast({ visible, message, type = "success" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [visible, message]);

  const bg = type === "error" ? COLORS.red : type === "warning" ? COLORS.goldDark : COLORS.green;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.toast,
        {
          backgroundColor: bg,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        },
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13.5 }}>{message}</Text>
    </Animated.View>
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

export function KPI({ label, value, sub, color = COLORS.brand, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={[s.card, s.kpi, SHADOW.sm]}>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: "#FDFDFC",
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FDFDFC",
  },
  toggleActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  badge: { alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 9, borderRadius: RADIUS.pill },
  kpi: { flexBasis: "48%", padding: 16 },
  kpiLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "500" },
  kpiValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  kpiSub: { fontSize: 11.5, color: COLORS.muted, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: "#FDFDFC",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    paddingHorizontal: 18,
    zIndex: 9999,
    alignItems: "center",
    ...SHADOW.md,
  },
});

