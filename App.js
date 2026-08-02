import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator, useWindowDimensions, Platform, StyleSheet } from "react-native";
import { LayoutDashboard, Users, Receipt, BarChart3, StickyNote } from "lucide-react-native";

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
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
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

  if (!session) {
    return <AuthScreen />;
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
        {/* Page header */}
        <View style={wl.pageHeader}>
          <Text style={wl.pageEyebrow}>Ojas Bloom Studio</Text>
          <Text style={wl.pageTitle}>{current.label}</Text>
        </View>
        {/* Scrollable content — max-width centred */}
        <View style={wl.content}>
          <ActiveComponent />
        </View>
      </View>
    </View>
  );
}

const wl = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: COLORS.bg },
  body: { flex: 1, backgroundColor: COLORS.bg },
  pageHeader: {
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: COLORS.goldDark, textTransform: "uppercase" },
  pageTitle: { fontSize: 24, fontWeight: "700", color: COLORS.brand, marginTop: 3, letterSpacing: -0.3 },
  content: { flex: 1 },
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