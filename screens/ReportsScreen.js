import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
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

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  const chartWidth = Dimensions.get("window").width - 64;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
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
        </View>
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
        <View style={{ padding: 12, alignItems: "center" }}>
          {trend.every((t) => t.income === 0 && t.expense === 0) ? (
            <Empty text="No data yet for the last 6 months." />
          ) : (
            <BarChart
              data={{
                labels: trend.map((t) => monthLabel(t.key)),
                datasets: [{ data: trend.map((t) => t.income) }],
              }}
              width={chartWidth}
              height={200}
              yAxisLabel="₹"
              yAxisSuffix=""
              fromZero
              chartConfig={{
                backgroundGradientFrom: COLORS.surface,
                backgroundGradientTo: COLORS.surface,
                decimalPlaces: 0,
                color: () => COLORS.brand,
                labelColor: () => COLORS.muted,
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 12 }}
            />
          )}
          <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>Income shown — swap the dataset to expense in code to compare.</Text>
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

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  monthChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  monthChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  fyNote: { fontSize: 11, color: COLORS.muted },
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
});
