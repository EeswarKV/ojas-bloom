import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Modal } from "react-native";
import { Plus, X, Trash2, Pencil } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Card, CardHead, Button, Field, InputBox, Empty, Badge, Avatar, SearchBar, Toggle, DateField, useToast, Toast } from "../components/UI";
import { todayISO, fmtMoney, fmtDate } from "../lib/helpers";

const EMPTY_FORM = { name: "", phone: "", type: "Offline", timing: "", fee: "", next_due_date: todayISO() };

export default function StudentsScreen() {
  const { students, loading, addStudent, deleteStudent, updateStudent, markPaid } = useStudioData();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const { toast, show: showToast } = useToast();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = students
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone || "").includes(search)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const submit = async () => {
    if (!form.name.trim() || !form.fee) return;
    if (editTarget) {
      await updateStudent(editTarget.id, { ...form, fee: Number(form.fee) });
      showToast("Student updated");
      setEditTarget(null);
    } else {
      await addStudent({ ...form, fee: Number(form.fee) });
      showToast("Student added");
      setShowAdd(false);
    }
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (st) => {
    setForm({
      name: st.name,
      phone: st.phone || "",
      type: st.type || "Offline",
      timing: st.timing || "",
      fee: String(st.fee),
      next_due_date: st.next_due_date,
    });
    setEditTarget(st);
  };

  const remind = (st) => {
    const msg = `Hi ${st.name}, your Ojas Bloom yoga fee of ${fmtMoney(st.fee)} was due on ${fmtDate(st.next_due_date)}. Please pay at your earliest convenience. 🙏`;
    const phone = (st.phone || "").replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone…" />

        <Button
          onPress={() => { setShowAdd((v) => !v); setForm({ ...EMPTY_FORM }); }}
          style={{ marginBottom: 14, alignSelf: "flex-start", paddingHorizontal: 16 }}
        >
          {showAdd ? "Close" : "+ Add student"}
        </Button>

        {showAdd && <StudentForm form={form} update={update} onSubmit={submit} onClose={() => setShowAdd(false)} isEdit={false} />}

        <Card>
          <CardHead
            eyebrow={`${filtered.length} of ${students.length} students`}
            title="Roster"
          />
          {filtered.length === 0 ? (
            <Empty text={search ? "No students match your search." : "No students yet — add your first one above."} />
          ) : (
            filtered.map((st) => {
              const isOverdue = st.next_due_date <= todayISO();
              return (
                <View key={st.id} style={s.studentRow}>
                  <Avatar name={st.name} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{st.name}</Text>
                    <Text style={s.meta}>{st.type} · {st.timing || "—"} · {fmtMoney(st.fee)}/mo</Text>
                    <View style={{ marginTop: 4 }}>
                      <Badge ok={!isOverdue}>
                        {isOverdue ? `Due ${fmtDate(st.next_due_date)}` : `Paid to ${fmtDate(st.next_due_date)}`}
                      </Badge>
                    </View>
                  </View>
                  <View style={{ gap: 6, alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity onPress={() => openEdit(st)} style={s.iconBtn}>
                        <Pencil size={14} color={COLORS.brand} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteStudent(st.id)}
                        style={[s.iconBtn, { backgroundColor: COLORS.redTint, borderColor: COLORS.redTint }]}
                      >
                        <Trash2 size={14} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                    {isOverdue && (
                      <Button onPress={() => { markPaid(st); showToast(`${st.name} marked paid`); }}
                        style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                        Paid
                      </Button>
                    )}
                    {isOverdue && (
                      <Button
                        onPress={() => remind(st)}
                        variant="ghost"
                        style={{ paddingVertical: 7, paddingHorizontal: 10 }}
                      >
                        Remind
                      </Button>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, SHADOW.md]}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Edit student</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} style={s.iconBtn}>
                <X size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <StudentForm form={form} update={update} onSubmit={submit} onClose={() => setEditTarget(null)} isEdit />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function StudentForm({ form, update, onSubmit, onClose, isEdit }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHead eyebrow={isEdit ? "Editing" : "New entry"} title={isEdit ? "Edit student" : "Add a student"} />
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
              <Toggle key={t} active={form.type === t} onPress={() => update("type", t)} label={t} />
            ))}
          </View>
        </Field>
        <Field label="Timing">
          <InputBox value={form.timing} onChangeText={(v) => update("timing", v)} placeholder="e.g. 6:00 AM batch" />
        </Field>
        <Field label="Monthly fee (₹)">
          <InputBox value={form.fee} onChangeText={(v) => update("fee", v)} keyboardType="numeric" placeholder="1500" />
        </Field>
        <Field label="Next due date">
          <DateField value={form.next_due_date} onChange={(v) => update("next_due_date", v)} />
        </Field>
        <Button onPress={onSubmit}>{isEdit ? "Save changes" : "Add student"}</Button>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  studentRow: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12, alignItems: "flex-start" },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  meta: { fontSize: 12, color: COLORS.text2, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "90%",
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
});

