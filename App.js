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

// ---- Error boundary ----
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
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
  { id: "Overview",  label: "Overview",  icon: LayoutDashboard, Component: DashboardScreen },
  { id: "Students",  label: "Students",  icon: Users,            Component: StudentsScreen },
  { id: "Expenses",  label: "Expenses",  icon: Receipt,          Component: ExpensesScreen },
  { id: "Reports",   label: "Reports",   icon: BarChart3,        Component: ReportsScreen },
  { id: "Notes",     label: "Notes",     icon: StickyNote,       Component: NotesScreen },
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
  const [locked, setLocked] = useState(false); // locked = show auth but session stays in storage
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= WIDE_BREAKPOINT;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  // Show auth screen: no session (first time) OR app locked
  if (!session || locked) {
    return (
      <AuthScreen
        hasStoredSession={locked && !!session}
        onBiometricUnlock={() => setLocked(false)}
        onFullSignOut={() => { supabase.auth.signOut(); setLocked(false); }}
      />
    );
  }

  // Lock = keep session in storage, just hide the UI
  const handleLock = () => setLocked(true);

  return (
    <SafeAreaProvider>
      <StudioDataProvider>
        <StatusBar style={isWideWeb ? "dark" : "light"} backgroundColor={isWideWeb ? COLORS.bg : COLORS.brand} />
        {isWideWeb
          ? <WideLayout email={session.user?.email} onLock={handleLock} />
          : <MobileLayout email={session.user?.email} onLock={handleLock} />}
      </StudioDataProvider>
    </SafeAreaProvider>
  );
}

// ---- wide/web: clean sidebar + max-width content ----
function WideLayout({ email, onLock }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const current = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = current.Component;

  return (
    <View style={wl.shell}>
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onSignOut={onLock}
        email={email}
      />
      <View style={wl.body}>
        <View style={wl.pageHeader}>
          <View style={wl.headerInner}>
            <Text style={wl.pageEyebrow}>Ojas Bloom Studio</Text>
            <Text style={wl.pageTitle}>{current.label}</Text>
          </View>
        </View>
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
  pageHeader: { backgroundColor: COLORS.brand, paddingHorizontal: 32, paddingTop: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerInner: { flex: 1 },
  pageEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: COLORS.gold, textTransform: "uppercase" },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#F6F2F8", marginTop: 2, letterSpacing: -0.3 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 4 },
});

// ---- phones: branded header + bottom tab bar ----
function MobileLayout({ email, onLock }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          header: () => <AppHeader email={email} onSignOut={onLock} dark />,
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
