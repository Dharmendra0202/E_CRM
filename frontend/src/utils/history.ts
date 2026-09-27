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

/**
 * Local activity log for actions taken in this browser.
 *
 * Starts EMPTY. It used to seed two fabricated entries (a "Grade 10 Science &
 * Maths" class and a student "Alice Connor") so the panel looked populated on a
 * fresh install — which meant an administrator saw events that never happened,
 * referencing a student who does not exist. The History panel has a proper
 * empty state, so showing nothing is both honest and correct.
 */
export const getHistoryList = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
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


