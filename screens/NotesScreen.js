import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Trash2, Pencil, X } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { Card, CardHead, Button, InputBox, Empty, useToast, Toast } from "../components/UI";
import { fmtDate } from "../lib/helpers";

export default function NotesScreen() {
  const { notes, loading, addNote, updateNote, deleteNote } = useStudioData();
  const [text, setText] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editText, setEditText] = useState("");
  const { toast, show: showToast } = useToast();

  const submit = async () => {
    if (!text.trim()) return;
    await addNote(text.trim());
    setText("");
    showToast("Note added");
  };

  const openEdit = (note) => {
    setEditText(note.text);
    setEditTarget(note);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateNote(editTarget.id, editText.trim());
    setEditTarget(null);
    showToast("Note updated");
  };

  const remove = async (id) => {
    await deleteNote(id);
    showToast("Note deleted", "warning");
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 16 }}>
          <CardHead eyebrow="New entry" title="Add a note" />
          <View style={{ padding: 16 }}>
            <InputBox
              value={text}
              onChangeText={setText}
              placeholder="Jot down anything — a reminder, an idea, a follow-up…"
              multiline
              style={{ minHeight: 70, textAlignVertical: "top", marginBottom: 4 }}
            />
            <Text style={s.charCount}>{text.length} chars</Text>
            <Button onPress={submit} style={{ marginTop: 6 }}>Add note</Button>
          </View>
        </Card>

        <Card>
          <CardHead eyebrow={`${notes.length} total`} title="All notes" />
          {notes.length === 0 ? (
            <Empty text="No notes yet — jot something down above." />
          ) : (
            notes.map((n) => (
              <View key={n.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.text}>{n.text}</Text>
                  <Text style={s.date}>{fmtDate(n.date)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity onPress={() => openEdit(n)} style={s.iconBtn}>
                    <Pencil size={14} color={COLORS.brand} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(n.id)} style={[s.iconBtn, { backgroundColor: COLORS.redTint, borderColor: COLORS.redTint }]}>
                    <Trash2 size={14} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Edit Note Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, SHADOW.md]}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Edit note</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} style={s.iconBtn}>
                <X size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <InputBox
                value={editText}
                onChangeText={setEditText}
                multiline
                style={{ minHeight: 80, textAlignVertical: "top", marginBottom: 4 }}
                autoFocus
              />
              <Text style={s.charCount}>{editText.length} chars</Text>
              <Button onPress={saveEdit} style={{ marginTop: 10 }}>Save changes</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  row: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10, alignItems: "flex-start" },
  text: { fontSize: 13.5, color: COLORS.ink, lineHeight: 20 },
  date: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  charCount: { fontSize: 11, color: COLORS.muted, textAlign: "right" },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
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
