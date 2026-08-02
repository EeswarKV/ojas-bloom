import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Repeat, Trash2, Pencil, X } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Card, CardHead, Button, Field, InputBox, Empty, Dropdown, DateField, useToast, Toast } from "../components/UI";
import { todayISO, fmtMoney, fmtDate, expensePaidDate, isExpensePaid, CATEGORIES, RECURRING_BY_DEFAULT } from "../lib/helpers";

const EMPTY_FORM = { category: "Rent", amount: "", date: todayISO(), due_date: todayISO(), note: "" };

export default function ExpensesScreen() {
  const { expenses, loading, addExpense, deleteExpense, updateExpense, markExpensePaid } = useStudioData();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [status, setStatus] = useState("paid");
  const [recurrence, setRecurrence] = useState("one-time");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const { toast, show: showToast } = useToast();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onCategoryChange = (cat) => {
    update("category", cat);
    setRecurrence(RECURRING_BY_DEFAULT.includes(cat) ? "monthly" : "one-time");
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setStatus("paid");
    setRecurrence("one-time");
    setShowAdd(true);
  };

  const openEdit = (e) => {
    setForm({
      category: e.category,
      amount: String(e.amount),
      date: e.paid_date || e.date || todayISO(),
      due_date: e.due_date || todayISO(),
      note: e.note || "",
    });
    setStatus(e.status);
    setRecurrence(e.recurrence || "one-time");
    setEditTarget(e);
  };

  const submit = async () => {
    if (!form.amount) return;
    if (editTarget) {
      const updated = {
        category: form.category,
        amount: Number(form.amount),
        note: form.note,
        recurrence,
        ...(status === "paid"
          ? { status: "paid", paid_date: form.date, date: form.date }
          : { status: "pending", due_date: form.due_date }),
      };
      await updateExpense(editTarget.id, updated);
      showToast("Expense updated");
      setEditTarget(null);
    } else {
      if (status === "paid") {
        await addExpense({ category: form.category, amount: Number(form.amount), status: "paid", date: form.date, paid_date: form.date, note: form.note, recurrence });
      } else {
        await addExpense({ category: form.category, amount: Number(form.amount), status: "pending", date: todayISO(), due_date: form.due_date, note: form.note, recurrence });
      }
      setForm({ ...EMPTY_FORM });
      setShowAdd(false);
      showToast(status === "paid" ? "Expense saved" : "Bill added");
    }
  };

  const pendingBills = expenses.filter((e) => e.status === "pending").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paidExpenses = expenses.filter(isExpensePaid).sort((a, b) => expensePaidDate(b).localeCompare(expensePaidDate(a)));
  const monthTotal = paidExpenses
    .filter((e) => expensePaidDate(e).slice(0, 7) === todayISO().slice(0, 7))
    .reduce((a, b) => a + Number(b.amount), 0);
  const allTimeTotal = paidExpenses.reduce((a, b) => a + Number(b.amount), 0);

  // Category breakdown for all-time
  const categoryTotals = paidExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button onPress={openAdd} style={{ marginBottom: 14, alignSelf: "flex-start", paddingHorizontal: 16 }}>
          + Add expense
        </Button>

        {/* All-time investment summary */}
        {allTimeTotal > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>
                TOTAL INVESTED — ALL TIME
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: COLORS.red, letterSpacing: -0.5 }}>{fmtMoney(allTimeTotal)}</Text>
              {topCategories.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {topCategories.map(([cat, amt]) => (
                    <View key={cat} style={{ backgroundColor: COLORS.bg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
                      <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: "600" }}>{cat}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.ink, marginTop: 1 }}>{fmtMoney(amt)}</Text>
                    </View>
                  ))}
                </View>
              )}
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
                  <TouchableOpacity onPress={() => openEdit(e)} style={s.iconBtn}>
                    <Pencil size={14} color={COLORS.brand} />
                  </TouchableOpacity>
                  <Button onPress={() => { markExpensePaid(e); showToast("Marked as paid"); }} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                    Paid
                  </Button>
                  <TouchableOpacity onPress={() => deleteExpense(e.id)} style={[s.iconBtn, { backgroundColor: COLORS.redTint, borderColor: COLORS.redTint }]}>
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
                <TouchableOpacity onPress={() => openEdit(e)} style={s.iconBtn}>
                  <Pencil size={14} color={COLORS.brand} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteExpense(e.id)} style={[s.iconBtn, { backgroundColor: COLORS.redTint, borderColor: COLORS.redTint }]}>
                  <Trash2 size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, SHADOW.md]}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Add an expense</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={s.iconBtn}><X size={18} color={COLORS.muted} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <ExpenseForm
                form={form} update={update} status={status} setStatus={setStatus}
                recurrence={recurrence} setRecurrence={setRecurrence}
                onCategoryChange={onCategoryChange} onSubmit={submit}
                submitLabel="Save expense"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, SHADOW.md]}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Edit expense</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} style={s.iconBtn}><X size={18} color={COLORS.muted} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <ExpenseForm
                form={form} update={update} status={status} setStatus={setStatus}
                recurrence={recurrence} setRecurrence={setRecurrence}
                onCategoryChange={onCategoryChange} onSubmit={submit}
                submitLabel="Save changes"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function ExpenseForm({ form, update, status, setStatus, recurrence, setRecurrence, onCategoryChange, onSubmit, submitLabel }) {
  return (
    <View>
      <Field label="Payment status">
        <Dropdown
          value={status === "paid" ? "Already paid" : "Pending bill"}
          options={["Already paid", "Pending bill"]}
          onChange={(v) => setStatus(v === "Already paid" ? "paid" : "pending")}
        />
      </Field>
      <Field label="Recurrence">
        <Dropdown
          value={recurrence === "monthly" ? "Monthly" : "One-time"}
          options={["One-time", "Monthly"]}
          onChange={(v) => setRecurrence(v === "Monthly" ? "monthly" : "one-time")}
        />
      </Field>
      <Field label="Category">
        <Dropdown
          value={form.category}
          options={CATEGORIES}
          onChange={onCategoryChange}
        />
      </Field>
      <Field label="Amount (₹)">
        <InputBox value={form.amount} onChangeText={(v) => update("amount", v)} keyboardType="numeric" placeholder="1200" />
      </Field>
      {status === "paid" ? (
        <Field label="Date paid">
          <DateField value={form.date} onChange={(v) => update("date", v)} />
        </Field>
      ) : (
        <Field label="Due date">
          <DateField value={form.due_date} onChange={(v) => update("due_date", v)} />
        </Field>
      )}
      <Field label="Note (optional)">
        <InputBox value={form.note} onChangeText={(v) => update("note", v)} placeholder="e.g. April rent" />
      </Field>
      {recurrence === "monthly" && (
        <Text style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 10 }}>
          Once marked paid, next month's bill is added automatically as pending.
        </Text>
      )}
      <Button onPress={onSubmit}>{submitLabel}</Button>
    </View>
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: "92%" },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
});

