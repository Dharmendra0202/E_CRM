export interface HistoryItem {
  id: string;
  category: "Class Schedule" | "Student" | "Staff" | "Attendance" | "Lead";
  action: "Created" | "Updated" | "Deleted";
  title: string;
  details: string;
  timestamp: string; // ISO string or human formatted
  user?: string;
  badgeColor?: string;
}

const LS_KEY = "ecrm_creation_history";

export const getHistoryList = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : getInitialDefaultHistory();
  } catch {
    return getInitialDefaultHistory();
  }
};

export const addHistoryItem = (item: Omit<HistoryItem, "id" | "timestamp">) => {
  try {
    const current = getHistoryList();
    const newItem: HistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newItem, ...current];
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    // Dispatch custom window event so UI components update reactively
    window.dispatchEvent(new CustomEvent("ecrm_history_updated"));
    return newItem;
  } catch (err) {
    console.error("Failed to save history item", err);
    return null;
  }
};

export const clearHistoryList = () => {
  localStorage.setItem(LS_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent("ecrm_history_updated"));
};

function getInitialDefaultHistory(): HistoryItem[] {
  const now = new Date();
  return [
    {
      id: "hist-init-1",
      category: "Class Schedule",
      action: "Created",
      title: "Grade 10 – Science & Maths scheduled",
      details: "Monday 08:00 AM – 09:30 AM in Room 101",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      user: "Admin",
      badgeColor: "hsl(271,91%,60%)",
    },
    {
      id: "hist-init-2",
      category: "Student",
      action: "Created",
      title: "Student Profile: Alice Connor",
      details: "Enrolled in Grade 10 Algebra – Contact: aconnor@gmail.com",
      timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      user: "Admin",
      badgeColor: "hsl(328,100%,54%)",
    },
  ];
}
