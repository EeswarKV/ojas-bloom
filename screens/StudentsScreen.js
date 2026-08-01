import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Plus, X, Check, Copy, Trash2 } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS } from "../theme";
import { Card, CardHead, Button, Field, InputBox, Empty, Badge } from "../components/UI";
import { todayISO, fmtMoney, fmtDate } from "../lib/helpers";

export default function StudentsScreen() {
  const { students, loading, addStudent, deleteStudent, markPaid } = useStudioData();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", type: "Offline", timing: "", fee: "", next_due_date: todayISO() });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.name || !form.fee) return;
    await addStudent({ ...form, fee: Number(form.fee) });
    setForm({ name: "", phone: "", type: "Offline", timing: "", fee: "", next_due_date: todayISO() });
    setShowAdd(false);
  };
  const remind = (st) => {
    const msg = `Hi ${st.name}, your Ojas Bloom yoga fee of ${fmtMoney(st.fee)} was due on ${fmtDate(st.next_due_date)}. Please pay at your earliest convenience. 🙏`;
    const phone = (st.phone || "").replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Button onPress={() => setShowAdd((v) => !v)} style={{ marginBottom: 14, alignSelf: "flex-start", paddingHorizontal: 16 }}>
        {showAdd ? "Close" : "+ Add student"}
      </Button>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <CardHead eyebrow="New entry" title="Add a student" />
          <View style={{ padding: 16 }}>
            <Field label="Name">
              <InputBox value={form.name} onChangeText={(v) => update("name", v)} placeholder="Full name" />
            </Field>
            <Field label="Phone (for WhatsApp reminders)">
              <InputBox value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" placeholder="9198XXXXXXXX" />
            </Field>
            <Field label="Training type">
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Offline", "Online"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => update("type", t)}
                    style={[s.toggle, form.type === t && s.toggleActive]}
                  >
                    <Text style={{ color: form.type === t ? "#fff" : COLORS.text2, fontWeight: "600" }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <Field label="Timing">
              <InputBox value={form.timing} onChangeText={(v) => update("timing", v)} placeholder="e.g. 6:00 AM batch" />
            </Field>
            <Field label="Monthly fee (₹)">
              <InputBox value={form.fee} onChangeText={(v) => update("fee", v)} keyboardType="numeric" placeholder="1500" />
            </Field>
            <Field label="Next due date (YYYY-MM-DD)">
              <InputBox value={form.next_due_date} onChangeText={(v) => update("next_due_date", v)} placeholder="2026-08-01" />
            </Field>
            <Button onPress={submit}>Save student</Button>
          </View>
        </Card>
      )}

      <Card>
        <CardHead eyebrow={`${students.length} total`} title="Roster" />
        {students.length === 0 ? (
          <Empty text="No students yet — add your first one above." />
        ) : (
          students
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((st) => {
              const isOverdue = st.next_due_date <= todayISO();
              return (
                <View key={st.id} style={s.studentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{st.name}</Text>
                    <Text style={s.meta}>{st.type} · {st.timing || "—"} · {fmtMoney(st.fee)}/mo</Text>
                    <View style={{ marginTop: 4 }}>
                      <Badge ok={!isOverdue}>{isOverdue ? `Due ${fmtDate(st.next_due_date)}` : `Paid to ${fmtDate(st.next_due_date)}`}</Badge>
                    </View>
                  </View>
                  <View style={{ gap: 6, alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {isOverdue && (
                        <TouchableOpacity onPress={() => remind(st)} style={s.iconBtn}>
                          <Copy size={14} color={COLORS.brand} />
                        </TouchableOpacity>
                      )}
                      <Button onPress={() => markPaid(st)} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                        Paid
                      </Button>
                      <TouchableOpacity onPress={() => deleteStudent(st.id)} style={[s.iconBtn, { backgroundColor: COLORS.redTint, borderColor: COLORS.redTint }]}>
                        <Trash2 size={14} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  studentRow: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  meta: { fontSize: 12, color: COLORS.text2, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  toggle: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#FDFDFC" },
  toggleActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
});
