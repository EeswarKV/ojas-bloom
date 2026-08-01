import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { todayISO, addMonthsISO } from "./helpers";

const Ctx = createContext(null);

export function StudioDataProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [s, p, e, n] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("notes").select("*").order("created_at", { ascending: false }),
    ]);
    setStudents(s.data || []);
    setPayments(p.data || []);
    setExpenses(e.data || []);
    setNotes(n.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    // live updates across devices — any staff member's change refreshes everyone
    const channel = supabase
      .channel("studio-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadAll]);

  // ---------- students ----------
  async function addStudent(data) {
    await supabase.from("students").insert(data);
  }
  async function deleteStudent(id) {
    await supabase.from("students").delete().eq("id", id);
  }
  async function markPaid(student) {
    await supabase.from("payments").insert({
      student_id: student.id,
      student_name: student.name,
      amount: student.fee,
      date: todayISO(),
    });
    const base = student.next_due_date <= todayISO() ? todayISO() : student.next_due_date;
    await supabase.from("students").update({ next_due_date: addMonthsISO(base, 1) }).eq("id", student.id);
  }

  // ---------- expenses ----------
  async function addExpense(data) {
    await supabase.from("expenses").insert(data);
    if (data.recurrence === "monthly" && data.status === "paid") {
      await supabase.from("expenses").insert({
        category: data.category,
        amount: data.amount,
        status: "pending",
        date: todayISO(),
        due_date: addMonthsISO(data.date, 1),
        note: data.note,
        recurrence: "monthly",
      });
    }
  }
  async function deleteExpense(id) {
    await supabase.from("expenses").delete().eq("id", id);
  }
  async function markExpensePaid(expense) {
    await supabase.from("expenses").update({ status: "paid", paid_date: todayISO() }).eq("id", expense.id);
    if (expense.recurrence === "monthly") {
      await supabase.from("expenses").insert({
        category: expense.category,
        amount: expense.amount,
        status: "pending",
        date: todayISO(),
        due_date: addMonthsISO(expense.due_date, 1),
        note: expense.note,
        recurrence: "monthly",
      });
    }
  }

  // ---------- notes ----------
  async function addNote(text) {
    await supabase.from("notes").insert({ text, date: todayISO() });
  }
  async function deleteNote(id) {
    await supabase.from("notes").delete().eq("id", id);
  }

  const value = {
    students,
    payments,
    expenses,
    notes,
    loading,
    refresh: loadAll,
    addStudent,
    deleteStudent,
    markPaid,
    addExpense,
    deleteExpense,
    markExpensePaid,
    addNote,
    deleteNote,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStudioData = () => useContext(Ctx);
