// Same logic as the web prototype — kept identical so numbers never drift
// between the artifact version and the real app.

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthKeyOf = (d) => d.slice(0, 7);

export const fmtMoney = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

export const fmtDate = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

export const addMonthsISO = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setMonth(dt.getMonth() + n);
  return dt.toISOString().slice(0, 10);
};

export const last6MonthKeys = () => {
  const arr = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  return arr;
};

// financial year = April to March
export const fyStartYear = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
};
export const fyMonthKeys = (startYear) => {
  const keys = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(startYear, 3 + i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
};
export const fyLabel = (startYear) => `FY ${startYear}–${String(startYear + 1).slice(2)}`;

// an expense counts as "spent" once status = paid
export const isExpensePaid = (e) => e.status === "paid";
export const expensePaidDate = (e) => e.paid_date || e.date;
export const isExpenseOverdue = (e) => e.status === "pending" && e.due_date && e.due_date <= todayISO();

export const CATEGORIES = ["Rent", "Utilities", "Maintenance", "Outing / Transport", "Equipment", "Marketing", "Other"];
export const RECURRING_BY_DEFAULT = ["Rent", "Utilities", "Maintenance"];
