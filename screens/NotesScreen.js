import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Trash2 } from "lucide-react-native";
import { useStudioData } from "../lib/StudioDataContext";
import { COLORS } from "../theme";
import { Card, CardHead, Button, InputBox, Empty } from "../components/UI";
import { fmtDate } from "../lib/helpers";

export default function NotesScreen() {
  const { notes, loading, addNote, deleteNote } = useStudioData();
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await addNote(text.trim());
    setText("");
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} /></View>;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card style={{ marginBottom: 16 }}>
        <CardHead eyebrow="New entry" title="Add a note" />
        <View style={{ padding: 16 }}>
          <InputBox
            value={text}
            onChangeText={setText}
            placeholder="Jot down anything — a reminder, an idea, a follow-up…"
            multiline
            style={{ minHeight: 70, textAlignVertical: "top", marginBottom: 10 }}
          />
          <Button onPress={submit}>Add note</Button>
        </View>
      </Card>

      <Card>
        <CardHead eyebrow={`${notes.length} total`} title="All notes" />
        {notes.length === 0 ? (
          <Empty text="No notes yet." />
        ) : (
          notes.map((n) => (
            <View key={n.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>{n.text}</Text>
                <Text style={s.date}>{fmtDate(n.date)}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteNote(n.id)} style={s.iconBtn}>
                <Trash2 size={14} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  row: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  text: { fontSize: 13.5, color: COLORS.ink },
  date: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
});
