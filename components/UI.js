import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Leaf, Search, ChevronDown, ChevronUp, Calendar, Check, User, LogOut } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOW } from "../theme";
import { initials, avatarColor, fmtDate } from "../lib/helpers";

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

export function Sidebar({ tabs, activeTab, onSelect, onSignOut, email }) {
  const initial = (email || "S")[0].toUpperCase();
  return (
    <View style={sb.wrap}>
      {/* Brand / logo */}
      <View style={sb.brand}>
        <View style={sb.logoMark}>
          <Leaf color={COLORS.gold} size={18} />
        </View>
        <View>
          <Text style={sb.appName}>Ojas Bloom</Text>
          <Text style={sb.appSub}>Studio Manager</Text>
        </View>
      </View>

      {/* Section label */}
      <Text style={sb.sectionLabel}>MENU</Text>

      {/* Nav items */}
      <View style={{ flex: 1, gap: 2, marginTop: 4 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => onSelect(t.id)}
              style={[sb.navItem, active && sb.navItemActive]}
            >
              <Icon size={15} color={active ? COLORS.gold : "#7A6888"} />
              <Text style={[sb.navLabel, active && sb.navLabelActive]}>{t.label}</Text>
              {active && <View style={sb.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User / sign-out */}
      {onSignOut && (
        <View style={sb.userSection}>
          <View style={sb.userAvatar}>
            <Text style={sb.userInitial}>{initial}</Text>
          </View>
          <Text style={sb.userEmail} numberOfLines={1}>{email || "Staff"}</Text>
          <TouchableOpacity onPress={onSignOut} style={sb.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <LogOut size={15} color="#7A6888" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { width: 252, backgroundColor: COLORS.brand, height: "100%", flexDirection: "column", borderRightWidth: 1, borderRightColor: COLORS.brandLight },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: COLORS.brandLight },
  logoMark: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.brandLight, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 15, fontWeight: "700", color: "#F6F2F8", letterSpacing: -0.2 },
  appSub: { fontSize: 11, color: "#8B7A98", marginTop: 1 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: "#4A3D5C", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 8, borderRadius: 8 },
  navItemActive: { backgroundColor: COLORS.brandLight },
  navLabel: { flex: 1, fontSize: 13.5, fontWeight: "500", color: "#8B7A98" },
  navLabelActive: { color: "#F6F2F8", fontWeight: "600" },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  userSection: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.brandLight },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  userInitial: { color: COLORS.brand, fontSize: 13, fontWeight: "700" },
  userEmail: { flex: 1, fontSize: 12, color: "#B6A9C0", fontWeight: "500" },
  logoutBtn: { padding: 4 },
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
  kpi: { flex: 1, minWidth: 160, padding: 18 },
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
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FDFDFC",
  },
  dateBtnText: { flex: 1, fontSize: 14, color: COLORS.ink },
  dateOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  dateSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 20,
    ...SHADOW.md,
  },
  dateSheetTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink, textAlign: "center", marginBottom: 16 },
  dateWheels: { flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 16 },
  wheel: { flex: 1, alignItems: "center", gap: 4 },
  wheelLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.muted, fontWeight: "600" },
  wheelBtn: { padding: 8 },
  wheelValue: { fontSize: 20, fontWeight: "700", color: COLORS.brand, minWidth: 48, textAlign: "center" },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FDFDFC",
  },
  dropdownText: { fontSize: 14, color: COLORS.ink, flex: 1 },
  ddOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 32 },
  ddSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW.md,
  },
  ddItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  ddItemActive: { backgroundColor: COLORS.brand },
  ddItemText: { fontSize: 14, color: COLORS.ink },
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDateParts(iso) {
  const dt = new Date((iso || "2026-01-01") + "T00:00:00");
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, day: dt.getDate() };
}

function Wheel({ label, value, min, max, onChange, display }) {
  return (
    <View style={s.wheel}>
      <Text style={s.wheelLabel}>{label}</Text>
      <TouchableOpacity onPress={() => value < max && onChange(value + 1)} style={s.wheelBtn}>
        <ChevronUp size={22} color={value < max ? COLORS.brand : COLORS.border} />
      </TouchableOpacity>
      <Text style={s.wheelValue}>{display ? display(value) : String(value)}</Text>
      <TouchableOpacity onPress={() => value > min && onChange(value - 1)} style={s.wheelBtn}>
        <ChevronDown size={22} color={value > min ? COLORS.brand : COLORS.border} />
      </TouchableOpacity>
    </View>
  );
}

export function DateField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(() => parseDateParts(value));

  const openPicker = () => { setD(parseDateParts(value)); setOpen(true); };
  const confirm = () => {
    const daysInMonth = new Date(d.y, d.m, 0).getDate();
    const clampedDay = Math.min(d.day, daysInMonth);
    onChange(`${d.y}-${String(d.m).padStart(2,"0")}-${String(clampedDay).padStart(2,"0")}`);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity onPress={openPicker} style={s.dateBtn}>
        <Calendar size={14} color={COLORS.brand} />
        <Text style={s.dateBtnText}>{fmtDate(value)}</Text>
        <ChevronDown size={13} color={COLORS.muted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.dateOverlay}>
          <View style={s.dateSheet}>
            <Text style={s.dateSheetTitle}>Pick a date</Text>
            <View style={s.dateWheels}>
              <Wheel label="Day" value={d.day} min={1} max={new Date(d.y, d.m, 0).getDate()}
                onChange={(v) => setD((p) => ({ ...p, day: v }))} />
              <Wheel label="Month" value={d.m} min={1} max={12}
                display={(v) => MONTHS[v - 1]}
                onChange={(v) => setD((p) => ({ ...p, m: v }))} />
              <Wheel label="Year" value={d.y} min={2020} max={2035}
                onChange={(v) => setD((p) => ({ ...p, y: v }))} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, padding: 16 }}>
              <Button onPress={() => setOpen(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
              <Button onPress={confirm} style={{ flex: 1 }}>Set date</Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function Dropdown({ value, options, onChange, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={s.dropdown}>
        <Text style={[s.dropdownText, !value && { color: COLORS.muted }]}>{value || placeholder}</Text>
        <ChevronDown size={14} color={COLORS.muted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.ddOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.ddSheet}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => { onChange(opt); setOpen(false); }}
                style={[s.ddItem, opt === value && s.ddItemActive]}
              >
                <Text style={[s.ddItemText, opt === value && { color: "#fff", fontWeight: "700" }]}>{opt}</Text>
                {opt === value && <Check size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

