import React, { useEffect, useState, Component } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator, useWindowDimensions, Platform, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LayoutDashboard, Users, Receipt, BarChart3, StickyNote, Fingerprint, Leaf } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";

import { supabase } from "./lib/supabase";
import { StudioDataProvider } from "./lib/StudioDataContext";
import { COLORS } from "./theme";
import { Sidebar, AppHeader } from "./components/UI";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import StudentsScreen from "./screens/StudentsScreen";
import ExpensesScreen from "./screens/ExpensesScreen";
import ReportsScreen from "./screens/ReportsScreen";
import NotesScreen from "./screens/NotesScreen";

// ---- Error boundary: shows error instead of blank screen in production ----
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FAF8F6" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#251A2E", marginBottom: 12 }}>Something went wrong</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={{ fontSize: 12, color: "#9B4A4A", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
              {this.state.error?.stack || this.state.error?.message || "Unknown error"}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const Tab = createBottomTabNavigator();

const TABS = [
  { id: "Overview", label: "Overview", icon: LayoutDashboard, Component: DashboardScreen },
  { id: "Students", label: "Students", icon: Users, Component: StudentsScreen },
  { id: "Expenses", label: "Expenses", icon: Receipt, Component: ExpensesScreen },
  { id: "Reports", label: "Reports", icon: BarChart3, Component: ReportsScreen },
  { id: "Notes", label: "Notes", icon: StickyNote, Component: NotesScreen },
];

const WIDE_BREAKPOINT = 880;

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  );
}

function AppRoot() {
  const [session, setSession] = useState(undefined);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const biometricChecked = React.useRef(false);
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= WIDE_BREAKPOINT;

  // Initial session load
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Whenever session becomes available, run biometric check once
  useEffect(() => {
    if (!session || Platform.OS === "web" || biometricChecked.current) return;
    biometricChecked.current = true;
    (async () => {
      try {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHW && enrolled) {
          setBiometricLocked(true);
        }
      } catch (e) {
        // biometric unavailable — proceed normally
      }
    })();
  }, [session]);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (biometricLocked) {
    return (
      <BiometricLockScreen
        email={session.user?.email}
        onUnlock={() => setBiometricLocked(false)}
        onSignOut={() => { supabase.auth.signOut(); setBiometricLocked(false); }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StudioDataProvider>
          <StatusBar style={isWideWeb ? "dark" : "light"} backgroundColor={isWideWeb ? COLORS.bg : COLORS.brand} />
          {isWideWeb ? <WideLayout email={session.user?.email} /> : <MobileLayout email={session.user?.email} />}
        </StudioDataProvider>
    </SafeAreaProvider>
  );
}

// ---- Biometric lock screen ----
function BiometricLockScreen({ email, onUnlock, onSignOut }) {
  const [loading, setLoading] = useState(false);

  const authenticate = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Ojas Bloom Studio",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });
      if (result.success) onUnlock();
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { authenticate(); }, []);

  return (
    <View style={bio.wrap}>
      <View style={bio.logoWrap}>
        <Leaf size={34} color={COLORS.gold} />
      </View>
      <Text style={bio.title}>Ojas Bloom</Text>
      <Text style={bio.subtitle}>Studio Manager</Text>
      <Text style={bio.email}>{email}</Text>

      <TouchableOpacity onPress={authenticate} style={bio.bioBtn} activeOpacity={0.7}>
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Fingerprint size={36} color="#fff" />}
      </TouchableOpacity>
      <Text style={bio.hint}>Tap to unlock with Face ID / Touch ID</Text>

      <TouchableOpacity onPress={onSignOut} style={{ marginTop: 48 }}>
        <Text style={{ fontSize: 13, color: "#5A4D6B" }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const bio = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center", padding: 32 },
  logoWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#F6F2F8", letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: "#8B7A98", marginTop: 4 },
  email: { fontSize: 13, color: "#5A4D6B", marginTop: 12 },
  bioBtn: { marginTop: 52, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 12, color: "#5A4D6B", marginTop: 14, textAlign: "center" },
});

// ---- wide/web: clean sidebar + max-width content ----
function WideLayout({ email }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const current = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = current.Component;

  return (
    <View style={wl.shell}>
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onSignOut={() => supabase.auth.signOut()}
        email={email}
      />
      <View style={wl.body}>
        {/* Page header — full-width white bar, text aligned with content */}
        <View style={wl.pageHeader}>
          <View style={wl.headerInner}>
            <Text style={wl.pageEyebrow}>Ojas Bloom Studio</Text>
            <Text style={wl.pageTitle}>{current.label}</Text>
          </View>
        </View>
        {/* Scrollable content — max-width centred */}
        <View style={wl.content}>
          <ActiveComponent onNavigate={setActiveTab} />
        </View>
      </View>
    </View>
  );
}

const wl = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: "#F1EDF6" },
  body: { flex: 1, backgroundColor: "#F1EDF6" },
  pageHeader: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerInner: { flex: 1 },
  pageEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: COLORS.gold, textTransform: "uppercase" },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#F6F2F8", marginTop: 2, letterSpacing: -0.3 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 4 },
});

// ---- phones: branded plum header + branded bottom tab bar ----
function MobileLayout({ email }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          header: () => <AppHeader email={email} onSignOut={() => supabase.auth.signOut()} dark />,
          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: "#CBBED3",
          tabBarStyle: { backgroundColor: COLORS.brand, borderTopColor: COLORS.brandLight },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        {TABS.map((t) => (
          <Tab.Screen
            key={t.id}
            name={t.id}
            component={t.Component}
            options={{ tabBarIcon: ({ color, size }) => <t.icon color={color} size={size} /> }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}