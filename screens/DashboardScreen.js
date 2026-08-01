import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Modal, FlatList, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Check, Copy, X, Bell, Leaf } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS } from "../theme";
import { Card, CardHead, Button, Empty, KPI, Badge } from "../components/UI";
import { todayISO, monthKeyOf, fmtMoney, fmtDate, monthLabel, isExpensePaid, expensePaidDate, isExpenseOverdue } from "../lib/helpers";

export default function DashboardScreen() {
  const { students, payments, expenses, loading, markPaid, markExpensePaid } = useStudioData();
  const [modal, setModal] = useState(null);

  const thisMonthKey = monthKeyOf(todayISO());
  const overdue = useMemo(
    () => students.filter((s) => s.next_due_date <= todayISO()).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
    [students]
  );
  const overdueBills = useMemo(() => expenses.filter(isExpenseOverdue).sort((a, b) => a.due_date.localeCompare(b.due_date)), [expenses]);
  const monthPayments = payments.filter((p) => monthKeyOf(p.date) === thisMonthKey).sort((a, b) => b.date.localeCompare(a.date));
  const monthPaidExpenses = expenses
    .filter((e) => isExpensePaid(e) && monthKeyOf(expensePaidDate(e)) === thisMonthKey)
    .sort((a, b) => expensePaidDate(b).localeCompare(expensePaidDate(a)));

  const incomeThisMonth = monthPayments.reduce((a, b) => a + Number(b.amount), 0);
  const expenseThisMonth = monthPaidExpenses.reduce((a, b) => a + Number(b.amount), 0);
  const netThisMonth = incomeThisMonth - expenseThisMonth;
  const duesTotal = overdue.reduce((a, s) => a + Number(s.fee), 0) + overdueBills.reduce((a, e) => a + Number(e.amount), 0);

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
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
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

      <Card style={{ marginTop: 16 }}>
        <CardHead eyebrow="Follow-up" title="Payment reminders" right={<Bell size={16} color={COLORS.muted} />} />
        {overdue.length === 0 && overdueBills.length === 0 ? (
          <Empty text="Nothing overdue — everyone and everything is up to date." />
        ) : (
          <View>
            {overdue.map((st) => (
              <View key={st.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{st.name}</Text>
                  <Text style={s.rowSub}>{fmtMoney(st.fee)} · due {fmtDate(st.next_due_date)}</Text>
                </View>
                <TouchableOpacity onPress={() => remindViaWhatsApp(st)} style={s.iconBtn}>
                  <Copy size={15} color={COLORS.brand} />
                </TouchableOpacity>
                <Button onPress={() => markPaid(st)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                  Paid
                </Button>
              </View>
            ))}
            {overdueBills.map((e) => (
              <View key={e.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{e.category} bill</Text>
                  <Text style={s.rowSub}>{fmtMoney(e.amount)} · due {fmtDate(e.due_date)}</Text>
                </View>
                <Button onPress={() => markExpensePaid(e)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                  Paid
                </Button>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
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
  );
}

function DrillModal({ visible, title, subtitle, onClose, data, renderItem }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHead}>
            <View>
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
            <FlatList data={data} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => renderItem(item)} style={{ maxHeight: 420 }} />
          )}
        </View>
      </View>
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(20,10,25,0.45)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "80%" },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.brand, marginTop: 2 },
});
