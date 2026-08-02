import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Linking, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { Copy, X, Bell, Leaf, TrendingDown, TrendingUp, Wallet, ChevronRight } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Card, CardHead, Button, Empty, KPI, Badge, useToast, Toast } from "../components/UI";
import { todayISO, monthKeyOf, fmtMoney, fmtDate, monthLabel, isExpensePaid, expensePaidDate, isExpenseOverdue, greetingFor } from "../lib/helpers";

export default function DashboardScreen({ onNavigate }) {
  const { students, payments, expenses, loading, markPaid, markExpensePaid } = useStudioData();
  const [modal, setModal] = useState(null);
  const { toast, show: showToast } = useToast();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 880;

  const thisMonthKey = monthKeyOf(todayISO());
  const overdue = useMemo(
    () => students.filter((s) => s.next_due_date <= todayISO()).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
    [students]
  );
  const paidCount = students.filter((s) => s.next_due_date > todayISO()).length;
  const upcomingCount = students.filter((s) => {
    const d = s.next_due_date; return d > todayISO() && d <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  }).length;
  const overdueBills = useMemo(() => expenses.filter(isExpenseOverdue).sort((a, b) => a.due_date.localeCompare(b.due_date)), [expenses]);
  const monthPayments = payments.filter((p) => monthKeyOf(p.date) === thisMonthKey).sort((a, b) => b.date.localeCompare(a.date));
  const monthPaidExpenses = expenses
    .filter((e) => isExpensePaid(e) && monthKeyOf(expensePaidDate(e)) === thisMonthKey)
    .sort((a, b) => expensePaidDate(b).localeCompare(expensePaidDate(a)));

  const incomeThisMonth = monthPayments.reduce((a, b) => a + Number(b.amount), 0);
  const expenseThisMonth = monthPaidExpenses.reduce((a, b) => a + Number(b.amount), 0);
  const netThisMonth = incomeThisMonth - expenseThisMonth;
  const duesTotal = overdue.reduce((a, s) => a + Number(s.fee), 0) + overdueBills.reduce((a, e) => a + Number(e.amount), 0);

  // All-time totals
  const totalIncome   = payments.reduce((a, b) => a + Number(b.amount), 0);
  const totalExpenses = expenses.filter(isExpensePaid).reduce((a, b) => a + Number(b.amount), 0);
  const totalNet      = totalIncome - totalExpenses;

  const tips = useMemo(() => {
    const t = [];
    if (expenseThisMonth > 0 && incomeThisMonth > 0 && expenseThisMonth / incomeThisMonth > 0.6)
      t.push("Expenses are over 60% of income this month — check costs against your fee pricing.");
    if (duesTotal > incomeThisMonth * 0.5 && duesTotal > 0) t.push(`${fmtMoney(duesTotal)} in dues is pending — following up now will steady cash flow.`);
    if (overdue.length >= 3) t.push(`${overdue.length} students are overdue on fees — a reminder round could help.`);
    if (overdueBills.length > 0) t.push(`${overdueBills.length} bill(s) past due — settling these keeps your log accurate.`);
    if (t.length === 0) t.push("Finances look steady this month — no red flags in expenses or dues.");
    return t;
  }, [incomeThisMonth, expenseThisMonth, duesTotal, overdue, overdueBills]);

  function remindViaWhatsApp(student) {
    const msg = `Hi ${student.name}, this is a reminder that your Ojas Bloom yoga fee of ${fmtMoney(student.fee)} was due on ${fmtDate(
      student.next_due_date
    )}. Please pay at your earliest convenience. 🙏`;
    const phone = (student.phone || "").replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Greeting */}
      <View style={[s.greetCard, SHADOW.sm]}>
        <View style={s.greetIcon}><Leaf size={18} color={COLORS.gold} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.greetTitle}>{greetingFor()} 🙏</Text>
          <Text style={s.greetSub}>
            {students.length} student{students.length !== 1 ? "s" : ""} enrolled
            {overdue.length > 0 ? ` · ${overdue.length} overdue` : " · all fees up to date"}
          </Text>
        </View>
      </View>

      {/* All-time summary */}
      <Card style={{ marginBottom: 14, padding: 16 }}>
        <Text style={s.sectionLabel}>STUDIO TOTALS — ALL TIME</Text>
        <View style={{ flexDirection: "row", gap: 0, marginTop: 10 }}>
          <View style={s.totalCol}>
            <View style={s.totalIcon}><TrendingUp size={14} color={COLORS.green} /></View>
            <Text style={s.totalLabel}>Total income</Text>
            <Text style={[s.totalValue, { color: COLORS.green }]}>{fmtMoney(totalIncome)}</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalCol}>
            <View style={s.totalIcon}><TrendingDown size={14} color={COLORS.red} /></View>
            <Text style={s.totalLabel}>Total invested</Text>
            <Text style={[s.totalValue, { color: COLORS.red }]}>{fmtMoney(totalExpenses)}</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalCol}>
            <View style={s.totalIcon}><Wallet size={14} color={totalNet >= 0 ? COLORS.brand : COLORS.red} /></View>
            <Text style={s.totalLabel}>Net balance</Text>
            <Text style={[s.totalValue, { color: totalNet >= 0 ? COLORS.brand : COLORS.red }]}>{fmtMoney(totalNet)}</Text>
          </View>
        </View>
      </Card>

      {/* This month KPIs */}
      <View style={s.kpiGrid}>
        <KPI label="Income this month" value={fmtMoney(incomeThisMonth)} onPress={() => setModal("income")} />
        <KPI label="Expenses this month" value={fmtMoney(expenseThisMonth)} color={COLORS.goldDark} onPress={() => setModal("expense")} />
        <KPI
          label="Net this month"
          value={fmtMoney(netThisMonth)}
          color={netThisMonth >= 0 ? COLORS.brand : COLORS.red}
          onPress={() => setModal("net")}
        />
        <KPI
          label="Dues pending"
          value={fmtMoney(duesTotal)}
          sub={`${overdue.length} student(s), ${overdueBills.length} bill(s)`}
          color={COLORS.red}
          onPress={() => setModal("dues")}
        />
      </View>

      {/* Bottom section: 2-col on wide, 1-col on mobile */}
      <View style={[{ marginTop: 14 }, isWide && { flexDirection: "row", gap: 14, alignItems: "flex-start" }]}>
        {/* Left: members tile */}
        <View style={isWide ? { flex: 1 } : {}}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.("Students")}
            style={[s.membersTile, SHADOW.sm]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.membersTileEyebrow}>MEMBERS</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <Text style={s.membersTileCount}>{students.length}</Text>
                <Text style={{ fontSize: 13, color: COLORS.muted }}>enrolled</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                <View style={s.membersDot}>
                  <View style={[s.dot, { backgroundColor: COLORS.green }]} />
                  <Text style={s.membersLabel}>{paidCount} up to date</Text>
                </View>
                {overdue.length > 0 && (
                  <View style={s.membersDot}>
                    <View style={[s.dot, { backgroundColor: COLORS.red }]} />
                    <Text style={s.membersLabel}>{overdue.length} fee due</Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Right: tips */}
        <View style={isWide ? { flex: 1 } : { marginTop: 14 }}>
          <Card>
            <CardHead eyebrow="Insights" title="Tips for you" />
            <View style={{ padding: 16 }}>
              {tips.map((t, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: i === tips.length - 1 ? 0 : 10 }}>
                  <Leaf size={14} color={COLORS.brand} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: 13.5, color: COLORS.ink, lineHeight: 19 }}>{t}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <DrillModal
        visible={modal === "income"}
        title="Income this month"
        subtitle={monthLabel(thisMonthKey)}
        onClose={() => setModal(null)}
        data={monthPayments}
        renderItem={(p) => (
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>{p.student_name}</Text>
            <Text style={s.rowSub}>{fmtDate(p.date)}</Text>
            <Text style={[s.amount, { color: COLORS.brand }]}>{fmtMoney(p.amount)}</Text>
          </View>
        )}
      />
      <DrillModal
        visible={modal === "expense"}
        title="Expenses this month"
        subtitle={monthLabel(thisMonthKey)}
        onClose={() => setModal(null)}
        data={monthPaidExpenses}
        renderItem={(e) => (
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>{e.category}{e.note ? ` · ${e.note}` : ""}</Text>
            <Text style={s.rowSub}>{fmtDate(expensePaidDate(e))}</Text>
            <Text style={[s.amount, { color: COLORS.red }]}>{fmtMoney(e.amount)}</Text>
          </View>
        )}
      />
      <DrillModal
        visible={modal === "net"}
        title="Net this month"
        subtitle={`Income ${fmtMoney(incomeThisMonth)} − Expenses ${fmtMoney(expenseThisMonth)}`}
        onClose={() => setModal(null)}
        data={[
          ...monthPayments.map((p) => ({ id: "p" + p.id, date: p.date, label: p.student_name, amount: p.amount, income: true })),
          ...monthPaidExpenses.map((e) => ({ id: "e" + e.id, date: expensePaidDate(e), label: e.category, amount: e.amount, income: false })),
        ].sort((a, b) => b.date.localeCompare(a.date))}
        renderItem={(row) => (
          <View style={s.row}>
            <Badge ok={row.income}>{row.income ? "Income" : "Expense"}</Badge>
            <Text style={[s.rowTitle, { flex: 1, marginLeft: 8 }]}>{row.label}</Text>
            <Text style={[s.amount, { color: row.income ? COLORS.brand : COLORS.red }]}>
              {row.income ? "+" : "−"} {fmtMoney(row.amount)}
            </Text>
          </View>
        )}
      />
      <DrillModal
        visible={modal === "dues"}
        title="Dues pending"
        subtitle="Overdue only — counted after the due date passes"
        onClose={() => setModal(null)}
        data={[
          ...overdue.map((st) => ({ id: "s" + st.id, kind: "student", ...st })),
          ...overdueBills.map((e) => ({ id: "e" + e.id, kind: "bill", ...e })),
        ]}
        renderItem={(row) =>
          row.kind === "student" ? (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{row.name}</Text>
                <Text style={s.rowSub}>{fmtMoney(row.fee)} · due {fmtDate(row.next_due_date)}</Text>
              </View>
              <Button onPress={() => markPaid(row)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                Paid
              </Button>
            </View>
          ) : (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{row.category} bill</Text>
                <Text style={s.rowSub}>{fmtMoney(row.amount)} · due {fmtDate(row.due_date)}</Text>
              </View>
              <Button onPress={() => markExpensePaid(row)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                Paid
              </Button>
            </View>
          )
        }
      />
    </ScrollView>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function DrillModal({ visible, title, subtitle, onClose, data, renderItem }) {
  const bottomPad = Platform.OS === "ios" ? 34 : 16;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalCard}>
          <View style={s.modalHandle} />
          <View style={s.modalHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>{subtitle}</Text>
              <Text style={s.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.iconBtn}>
              <X size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
          {data.length === 0 ? (
            <Empty text="Nothing to show here yet." />
          ) : (
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: bottomPad }}
              showsVerticalScrollIndicator={false}
            >
              {data.map((item) => (
                <View key={String(item.id)}>{renderItem(item)}</View>
              ))}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  rowTitle: { fontSize: 13.5, fontWeight: "600", color: COLORS.ink },
  rowSub: { fontSize: 12, color: COLORS.text2 },
  amount: { fontSize: 13.5, fontWeight: "700" },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  eyebrow: { fontSize: 11, textTransform: "uppercase", color: COLORS.muted, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(20,10,25,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "85%",
    ...SHADOW.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 10, marginBottom: 4,
  },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 17, fontWeight: "700", color: COLORS.brand, marginTop: 3 },
  membersTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
  },
  membersTileEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase" },
  membersTileCount: { fontSize: 28, fontWeight: "800", color: COLORS.brand },
  membersDot: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  membersLabel: { fontSize: 13, color: COLORS.text2 },
  greetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  greetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  greetTitle: { fontSize: 16, fontWeight: "700", color: "#F6F2F8" },
  greetSub: { fontSize: 12, color: "#B6A9C0", marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase" },
  totalCol: { flex: 1, alignItems: "center", gap: 4 },
  totalDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  totalIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  totalLabel: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
  totalValue: { fontSize: 16, fontWeight: "700", textAlign: "center" },
});
