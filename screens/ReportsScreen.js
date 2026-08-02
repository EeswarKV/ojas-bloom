import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS, RADIUS } from "../theme";
import { Card, CardHead, Empty } from "../components/UI";
import {
  todayISO, monthKeyOf, fmtMoney, monthLabel,
  fyStartYear, fyMonthKeys, fyLabel,
  isExpensePaid, expensePaidDate,
  quarterOf, quarterLabel, yearOf, allMonthsSince,
} from "../lib/helpers";

const PALETTE = [COLORS.brand, COLORS.gold, "#7C6B8A", COLORS.red, COLORS.brandLight, "#DCC79A"];
const PERIODS = ["Monthly", "Quarterly", "Yearly"];
const FIN_TABS = ["Income Statement", "Balance Sheet"];

export default function ReportsScreen() {
  const { payments, expenses, loading } = useStudioData();
  const [period, setPeriod] = useState("Monthly");
  const [selectedKey, setSelectedKey] = useState(monthKeyOf(todayISO()));
  const [finTab, setFinTab] = useState("Income Statement");

  // ── helpers ──────────────────────────────────────────────────────
  const monthIncome  = (k) => payments.filter((p) => monthKeyOf(p.date) === k).reduce((a, b) => a + Number(b.amount), 0);
  const monthExpense = (k) => expenses.filter((e) => isExpensePaid(e) && monthKeyOf(expensePaidDate(e)) === k).reduce((a, b) => a + Number(b.amount), 0);
  const qIncome  = (q) => payments.filter((p) => quarterOf(p.date) === q).reduce((a, b) => a + Number(b.amount), 0);
  const qExpense = (q) => expenses.filter((e) => isExpensePaid(e) && quarterOf(expensePaidDate(e)) === q).reduce((a, b) => a + Number(b.amount), 0);
  const yIncome  = (y) => payments.filter((p) => yearOf(p.date) === y).reduce((a, b) => a + Number(b.amount), 0);
  const yExpense = (y) => expenses.filter((e) => isExpensePaid(e) && yearOf(expensePaidDate(e)) === y).reduce((a, b) => a + Number(b.amount), 0);

  // ── all dates from first transaction ────────────────────────────
  const allDates = [...payments.map((p) => p.date), ...expenses.filter(isExpensePaid).map((e) => expensePaidDate(e))].filter(Boolean).sort();
  const firstDate = allDates[0] || todayISO();
  const allMonths = useMemo(() => allMonthsSince(firstDate), [firstDate]);

  // ── period chips ─────────────────────────────────────────────────
  const monthChips = [...allMonths].reverse();
  const quarterChips = useMemo(() => {
    const seen = new Set(); const out = [];
    allMonths.forEach((m) => { const q = quarterOf(m + "-01"); if (!seen.has(q)) { seen.add(q); out.push(q); } });
    return out.reverse();
  }, [allMonths]);
  const yearChips = useMemo(() => {
    const seen = new Set(); const out = [];
    allMonths.forEach((m) => { const y = m.slice(0, 4); if (!seen.has(y)) { seen.add(y); out.push(y); } });
    return out.reverse();
  }, [allMonths]);

  // ── current period income/expense/net ───────────────────────────
  const { reportIncome, reportExpense } = useMemo(() => {
    if (period === "Monthly")   return { reportIncome: monthIncome(selectedKey),  reportExpense: monthExpense(selectedKey) };
    if (period === "Quarterly") return { reportIncome: qIncome(selectedKey),       reportExpense: qExpense(selectedKey) };
    return                             { reportIncome: yIncome(selectedKey),       reportExpense: yExpense(selectedKey) };
  }, [period, selectedKey, payments, expenses]);
  const reportNet = reportIncome - reportExpense;

  // ── cumulative balance sheet ─────────────────────────────────────
  const totalIncome  = payments.reduce((a, b) => a + Number(b.amount), 0);
  const totalPaid    = expenses.filter(isExpensePaid).reduce((a, b) => a + Number(b.amount), 0);
  const totalPending = expenses.filter((e) => e.status === "pending").reduce((a, b) => a + Number(b.amount), 0);
  const cashInHand   = totalIncome - totalPaid;

  // ── trend (all months since first data, capped at 12 for display) ─
  const trendMonths = allMonths.slice(-12);
  const trend = useMemo(() => trendMonths.map((k) => ({ key: k, income: monthIncome(k), expense: monthExpense(k) })), [payments, expenses, trendMonths]);
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.income, t.expense)));
  const hasTrendData = trend.some((t) => t.income > 0 || t.expense > 0);

  // ── category breakdown ───────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.filter((e) => {
      if (!isExpensePaid(e)) return false;
      const d = expensePaidDate(e);
      if (period === "Monthly")   return monthKeyOf(d) === selectedKey;
      if (period === "Quarterly") return quarterOf(d) === selectedKey;
      return yearOf(d) === selectedKey;
    }).forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses, period, selectedKey]);
  const categoryTotal = categoryBreakdown.reduce((a, c) => a + c.value, 0);

  const currentFYStart = fyStartYear(todayISO());

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  // active chips for current period
  const chips     = period === "Monthly" ? monthChips : period === "Quarterly" ? quarterChips : yearChips;
  const chipLabel = (k) => period === "Monthly" ? monthLabel(k) : period === "Quarterly" ? quarterLabel(k) : `FY ${k}`;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Period selector */}
      <View style={s.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => {
              setPeriod(p);
              setSelectedKey(p === "Monthly" ? monthKeyOf(todayISO()) : p === "Quarterly" ? quarterOf(todayISO()) : todayISO().slice(0, 4));
            }}
            style={[s.periodChip, period === p && s.periodChipActive]}
          >
            <Text style={{ color: period === p ? "#fff" : COLORS.text2, fontWeight: "600", fontSize: 13 }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}
        contentContainerStyle={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
        {chips.map((k) => (
          <TouchableOpacity key={k} onPress={() => setSelectedKey(k)}
            style={[s.monthChip, selectedKey === k && s.monthChipActive]}>
            <Text style={{ color: selectedKey === k ? "#fff" : COLORS.text2, fontWeight: "600", fontSize: 12 }}>{chipLabel(k)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={s.fyNote}>{fyLabel(currentFYStart)} · {period} view</Text>

      {/* Tabbed Financial Statements */}
      <Card style={{ marginTop: 14 }}>
        <View style={s.tabRow}>
          {FIN_TABS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setFinTab(t)} style={[s.tab, finTab === t && s.tabActive]}>
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: finTab === t ? COLORS.brand : COLORS.muted }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {finTab === "Income Statement" ? (
          <View style={{ padding: 16 }}>
            <Text style={s.stmtEyebrow}>{chipLabel(selectedKey)}</Text>
            <Row label="Class fees collected" value={fmtMoney(reportIncome)} />
            <Row label="Total expenses" value={"− " + fmtMoney(reportExpense)} />
            <View style={s.hr} />
            <Row label="Net profit" value={fmtMoney(reportNet)} bold color={reportNet >= 0 ? COLORS.brand : COLORS.red} />
            <View style={{ marginTop: 14, backgroundColor: COLORS.bg, borderRadius: RADIUS.sm, padding: 10 }}>
              <Row label="Margin" value={reportIncome > 0 ? Math.round((reportNet / reportIncome) * 100) + "%" : "—"} bold color={reportNet >= 0 ? COLORS.green : COLORS.red} />
            </View>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={s.stmtEyebrow}>As of today (cumulative)</Text>
            <Text style={[s.stmtSection, { marginBottom: 6 }]}>Assets</Text>
            <Row label="Cash in hand (net)" value={fmtMoney(cashInHand)} bold color={cashInHand >= 0 ? COLORS.brand : COLORS.red} />
            <Row label="Total income ever" value={fmtMoney(totalIncome)} />
            <View style={s.hr} />
            <Text style={[s.stmtSection, { marginBottom: 6, marginTop: 4 }]}>Liabilities</Text>
            <Row label="Total expenses paid" value={fmtMoney(totalPaid)} />
            <Row label="Pending bills" value={fmtMoney(totalPending)} color={totalPending > 0 ? COLORS.red : COLORS.ink} />
            <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
              Simplified — no fixed assets or depreciation. Dues receivable are tracked on the Overview tab.
            </Text>
          </View>
        )}
      </Card>

      {/* Trend chart */}
      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow={`Last ${trendMonths.length} months from first entry`} title="Income vs expenses trend" />
        <View style={{ padding: 16 }}>
          {!hasTrendData ? (
            <Empty text="No data yet to plot." />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 160, gap: 6 }}>
                  {trend.map((t) => {
                    const incH = Math.max(2, (t.income / trendMax) * 120);
                    const expH = Math.max(2, (t.expense / trendMax) * 120);
                    return (
                      <View key={t.key} style={{ alignItems: "center", width: 38 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 130 }}>
                          <View style={{ alignItems: "center" }}>
                            {t.income > 0 && <Text style={{ fontSize: 7, color: COLORS.brand, fontWeight: "700", marginBottom: 1 }}>{Math.round(t.income / 1000)}k</Text>}
                            <View style={{ width: 12, height: incH, backgroundColor: COLORS.brand, borderRadius: 3 }} />
                          </View>
                          <View style={{ alignItems: "center" }}>
                            {t.expense > 0 && <Text style={{ fontSize: 7, color: COLORS.goldDark, fontWeight: "700", marginBottom: 1 }}>{Math.round(t.expense / 1000)}k</Text>}
                            <View style={{ width: 12, height: expH, backgroundColor: COLORS.gold, borderRadius: 3 }} />
                          </View>
                        </View>
                        <Text style={{ fontSize: 9, color: COLORS.muted, marginTop: 5, textAlign: "center" }}>{monthLabel(t.key)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 10 }}>
                <Legend color={COLORS.brand} label="Income" />
                <Legend color={COLORS.gold} label="Expenses" />
              </View>
            </>
          )}
        </View>
      </Card>

      {/* Category breakdown */}
      <Card style={{ marginTop: 14 }}>
        <CardHead eyebrow={chipLabel(selectedKey)} title="Expense breakdown" />
        <View style={{ padding: 16 }}>
          {categoryBreakdown.length === 0 ? (
            <Empty text="No expenses recorded for this period." />
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
  periodRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  periodChip: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  periodChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  monthChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  monthChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  fyNote: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: COLORS.brand },
  stmtEyebrow: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.muted, fontWeight: "600", marginBottom: 10 },
  stmtSection: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: COLORS.brand, fontWeight: "700" },
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
});


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
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 160, marginBottom: 8 }}>
                {trend.map((t) => {
                  const incH = Math.max(2, (t.income / trendMax) * 120);
                  const expH = Math.max(2, (t.expense / trendMax) * 120);
                  return (
                    <View key={t.key} style={{ alignItems: "center", flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 120 }}>
                        <View style={{ alignItems: "center" }}>
                          {t.income > 0 && (
                            <Text style={{ fontSize: 8, color: COLORS.brand, fontWeight: "700", marginBottom: 2 }}>
                              {Math.round(t.income / 1000)}k
                            </Text>
                          )}
                          <View style={{ width: 11, height: incH, backgroundColor: COLORS.brand, borderRadius: 3 }} />
                        </View>
                        <View style={{ alignItems: "center" }}>
                          {t.expense > 0 && (
                            <Text style={{ fontSize: 8, color: COLORS.goldDark, fontWeight: "700", marginBottom: 2 }}>
                              {Math.round(t.expense / 1000)}k
                            </Text>
                          )}
                          <View style={{ width: 11, height: expH, backgroundColor: COLORS.gold, borderRadius: 3 }} />
                        </View>
                      </View>
                      <Text style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>{monthLabel(t.key)}</Text>
                    </View>
                  );
                })}
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