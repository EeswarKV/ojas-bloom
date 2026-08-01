import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Repeat, Trash2 } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS } from "../theme";
import { Card, CardHead, Button, Field, InputBox, Empty, Toggle, useToast, Toast } from "../components/UI";
import { todayISO, fmtMoney, fmtDate, expensePaidDate, isExpensePaid, CATEGORIES, RECURRING_BY_DEFAULT } from "../lib/helpers";

export default function ExpensesScreen() {
  const { expenses, loading, addExpense, deleteExpense, markExpensePaid } = useStudioData();
  const [showAdd, setShowAdd] = useState(false);
  const [status, setStatus] = useState("paid");
  const [recurrence, setRecurrence] = useState("one-time");
  const [form, setForm] = useState({ category: "Rent", amount: "", date: todayISO(), due_date: todayISO(), note: "" });
  const { toast, show: showToast } = useToast();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onCategoryChange = (cat) => {
    update("category", cat);
    setRecurrence(RECURRING_BY_DEFAULT.includes(cat) ? "monthly" : "one-time");
  };
  const submit = async () => {
    if (!form.amount) return;
    if (status === "paid") {
      await addExpense({ category: form.category, amount: Number(form.amount), status: "paid", date: form.date, paid_date: form.date, note: form.note, recurrence });
    } else {
      await addExpense({ category: form.category, amount: Number(form.amount), status: "pending", date: todayISO(), due_date: form.due_date, note: form.note, recurrence });
    }
    setForm({ category: "Rent", amount: "", date: todayISO(), due_date: todayISO(), note: "" });
    setShowAdd(false);
    showToast(status === "paid" ? "Expense saved" : "Bill added");
  };

  const pendingBills = expenses.filter((e) => e.status === "pending").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paidExpenses = expenses.filter(isExpensePaid).sort((a, b) => expensePaidDate(b).localeCompare(expensePaidDate(a)));
  const monthTotal = paidExpenses
    .filter((e) => expensePaidDate(e).slice(0, 7) === todayISO().slice(0, 7))
    .reduce((a, b) => a + Number(b.amount), 0);

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Button onPress={() => setShowAdd((v) => !v)} style={{ marginBottom: 14, alignSelf: "flex-start", paddingHorizontal: 16 }}>
        {showAdd ? "Close" : "+ Add expense"}
      </Button>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <CardHead eyebrow="New entry" title="Add an expense" />
          <View style={{ padding: 16 }}>
            <Field label="Payment status">
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Toggle active={status === "paid"} onPress={() => setStatus("paid")} label="Already paid" />
                <Toggle active={status === "pending"} onPress={() => setStatus("pending")} label="Pending bill" />
              </View>
            </Field>
            <Field label="Recurrence">
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Toggle active={recurrence === "one-time"} onPress={() => setRecurrence("one-time")} label="One-time" />
                <Toggle active={recurrence === "monthly"} onPress={() => setRecurrence("monthly")} label="Monthly" />
              </View>
            </Field>
            <Field label="Category">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <Toggle key={c} active={form.category === c} onPress={() => onCategoryChange(c)} label={c} small />
                ))}
              </View>
            </Field>
            <Field label="Amount (₹)">
              <InputBox value={form.amount} onChangeText={(v) => update("amount", v)} keyboardType="numeric" placeholder="1200" />
            </Field>
            {status === "paid" ? (
              <Field label="Date paid (YYYY-MM-DD)">
                <InputBox value={form.date} onChangeText={(v) => update("date", v)} />
              </Field>
            ) : (
              <Field label="Due date (YYYY-MM-DD)">
                <InputBox value={form.due_date} onChangeText={(v) => update("due_date", v)} />
              </Field>
            )}
            <Field label="Note (optional)">
              <InputBox value={form.note} onChangeText={(v) => update("note", v)} />
            </Field>
            {recurrence === "monthly" && (
              <Text style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 10 }}>
                Once marked paid, next month's bill is added automatically as pending.
              </Text>
            )}
            <Button onPress={submit}>{status === "paid" ? "Save expense" : "Save pending bill"}</Button>
          </View>
        </Card>
      )}

      {pendingBills.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <CardHead eyebrow={`${pendingBills.length} pending`} title="Bills awaiting payment" />
          {pendingBills.map((e) => {
            const overdueBill = e.due_date <= todayISO();
            return (
              <View key={e.id} style={s.expRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.cat}>{e.category}{e.note ? ` · ${e.note}` : ""}</Text>
                    {e.recurrence === "monthly" && <Repeat size={11} color={COLORS.goldDark} />}
                  </View>
                  <Text style={[s.meta, { color: overdueBill ? COLORS.red : COLORS.goldDark }]}>
                    {overdueBill ? "Overdue" : "Upcoming"} · due {fmtDate(e.due_date)}
                  </Text>
                </View>
                <Text style={s.amount}>{fmtMoney(e.amount)}</Text>
                <Button onPress={() => markExpensePaid(e)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                  Paid
                </Button>
                <TouchableOpacity onPress={() => deleteExpense(e.id)} style={s.iconBtn}>
                  <Trash2 size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>
      )}

      <Card>
        <CardHead eyebrow="This month, paid" title={fmtMoney(monthTotal)} />
        {paidExpenses.length === 0 ? (
          <Empty text="No expenses logged yet." />
        ) : (
          paidExpenses.map((e) => (
            <View key={e.id} style={s.expRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.cat}>{e.category}</Text>
                  {e.recurrence === "monthly" && <Repeat size={11} color={COLORS.goldDark} />}
                </View>
                <Text style={s.meta}>{fmtDate(expensePaidDate(e))}{e.note ? ` · ${e.note}` : ""}</Text>
              </View>
              <Text style={[s.amount, { color: COLORS.red }]}>{fmtMoney(e.amount)}</Text>
              <TouchableOpacity onPress={() => deleteExpense(e.id)} style={s.iconBtn}>
                <Trash2 size={14} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  expRow: { flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  cat: { fontSize: 13.5, fontWeight: "700", color: COLORS.ink },
  meta: { fontSize: 12, color: COLORS.text2, marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: "700", color: COLORS.ink },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
});
