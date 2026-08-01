import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS } from "../theme";
import { Card, CardHead, Empty } from "../components/UI";
import {
  todayISO,
  monthKeyOf,
  fmtMoney,
  monthLabel,
  last6MonthKeys,
  fyStartYear,
  fyMonthKeys,
  fyLabel,
  isExpensePaid,
  expensePaidDate,
} from "../lib/helpers";

const PALETTE = [COLORS.brand, COLORS.gold, "#7C6B8A", COLORS.red, COLORS.brandLight, "#DCC79A"];

export default function ReportsScreen() {
  const { payments, expenses, loading } = useStudioData();
  const [reportMonth, setReportMonth] = useState(monthKeyOf(todayISO()));

  const monthIncome = (key) => payments.filter((p) => monthKeyOf(p.date) === key).reduce((a, b) => a + Number(b.amount), 0);
  const monthExpense = (key) =>
    expenses.filter((e) => isExpensePaid(e) && monthKeyOf(expensePaidDate(e)) === key).reduce((a, b) => a + Number(b.amount), 0);

  const currentFYStart = fyStartYear(todayISO());
  const currentFYKeys = fyMonthKeys(currentFYStart).filter((k) => k <= monthKeyOf(todayISO()));
  const previousFYStart = currentFYStart - 1;
  const previousFYKeys = fyMonthKeys(previousFYStart);
  const hasPrevFYData = [...payments, ...expenses].some((x) => previousFYKeys.includes(monthKeyOf(x.date)));
  const selectableMonths = [...currentFYKeys, ...(hasPrevFYData ? previousFYKeys : [])];

  const reportIncome = monthIncome(reportMonth);
  const reportExpense = monthExpense(reportMonth);
  const reportNet = reportIncome - reportExpense;
  const cashInHand = payments.reduce((a, b) => a + Number(b.amount), 0) - expenses.filter(isExpensePaid).reduce((a, b) => a + Number(b.amount), 0);

  const trend = useMemo(() => last6MonthKeys().map((k) => ({ key: k, income: monthIncome(k), expense: monthExpense(k) })), [payments, expenses]);
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.income, t.expense)));
  const hasTrendData = trend.some((t) => t.income > 0 || t.expense > 0);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses
      .filter((e) => isExpensePaid(e) && monthKeyOf(expensePaidDate(e)) === reportMonth)
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + Number(e.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, reportMonth]);
  const categoryTotal = categoryBreakdown.reduce((a, c) => a + c.value, 0);

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }}
        contentContainerStyle={{ flexDirection: "row", gap: 6, paddingRight: 8 }}
      >
        {selectableMonths
          .slice()
          .reverse()
          .map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setReportMonth(k)}
              style={[s.monthChip, reportMonth === k && s.monthChipActive]}
            >
              <Text style={{ color: reportMonth === k ? "#fff" : COLORS.text2, fontWeight: "600", fontSize: 12.5 }}>{monthLabel(k)}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <Text style={s.fyNote}>
        {fyLabel(currentFYStart)} (current){hasPrevFYData ? ` · ${fyLabel(previousFYStart)} (previous)` : ""}
      </Text>

      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow={monthLabel(reportMonth)} title="Profit & loss" />
        <View style={{ padding: 16 }}>
          <Row label="Class fees collected" value={fmtMoney(reportIncome)} />
          <Row label="Total expenses" value={"− " + fmtMoney(reportExpense)} />
          <View style={s.hr} />
          <Row label="Net profit" value={fmtMoney(reportNet)} bold color={reportNet >= 0 ? COLORS.brand : COLORS.red} />
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow="As of today" title="Simplified balance sheet" />
        <View style={{ padding: 16 }}>
          <Row label="Cash in hand" value={fmtMoney(cashInHand)} />
          <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
            Simplified for a service studio — no depreciation or liabilities tracked. Dues are shown on the Overview tab.
          </Text>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow="Trend" title="Income vs expenses — last 6 months" />
        <View style={{ padding: 16 }}>
          {!hasTrendData ? (
            <Empty text="No data yet for the last 6 months." />
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 140, marginBottom: 8 }}>
                {trend.map((t) => (
                  <View key={t.key} style={{ alignItems: "center", flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 120 }}>
                      <View style={{ width: 10, height: Math.max(2, (t.income / trendMax) * 120), backgroundColor: COLORS.brand, borderRadius: 3 }} />
                      <View style={{ width: 10, height: Math.max(2, (t.expense / trendMax) * 120), backgroundColor: COLORS.gold, borderRadius: 3 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>{monthLabel(t.key)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 }}>
                <Legend color={COLORS.brand} label="Income" />
                <Legend color={COLORS.gold} label="Expenses" />
              </View>
            </>
          )}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow={monthLabel(reportMonth)} title="Expense breakdown" />
        <View style={{ padding: 16 }}>
          {categoryBreakdown.length === 0 ? (
            <Empty text="No expenses recorded for this month." />
          ) : (
            categoryBreakdown.map((c, i) => {
              const pct = categoryTotal > 0 ? c.value / categoryTotal : 0;
              return (
                <View key={c.name} style={{ marginBottom: i === categoryBreakdown.length - 1 ? 0 : 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.ink }}>{c.name}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.text2 }}>{fmtMoney(c.value)} · {Math.round(pct * 100)}%</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.border, overflow: "hidden" }}>
                    <View style={{ width: `${Math.max(3, pct * 100)}%`, height: 8, backgroundColor: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function Row({ label, value, bold, color }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ fontSize: 13.5, color: bold ? COLORS.ink : COLORS.text2, fontWeight: bold ? "700" : "400" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: bold ? "800" : "600", color: color || COLORS.ink }}>{value}</Text>
    </View>
  );
}

function Legend({ color, label }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: COLORS.text2 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  monthChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  monthChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  fyNote: { fontSize: 11, color: COLORS.muted },
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
});