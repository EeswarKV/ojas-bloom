import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator } from "react-native";
import { LayoutDashboard, Users, Receipt, BarChart3, StickyNote } from "lucide-react-native";

import { supabase } from "./lib/supabase";
import { StudioDataProvider } from "./lib/StudioDataContext";
import { COLORS } from "./theme";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import StudentsScreen from "./screens/StudentsScreen";
import ExpensesScreen from "./screens/ExpensesScreen";
import ReportsScreen from "./screens/ReportsScreen";
import NotesScreen from "./screens/NotesScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

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
    <StudioDataProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={COLORS.brand} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.brand },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "600" },
            tabBarActiveTintColor: COLORS.brand,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarStyle: { borderTopColor: COLORS.border },
          }}
        >
          <Tab.Screen
            name="Overview"
            component={DashboardScreen}
            options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Students"
            component={StudentsScreen}
            options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={{ tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{ tabBarIcon: ({ color, size }) => <StickyNote color={color} size={size} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </StudioDataProvider>
  );
}
