/**
 * Reliable WhatsApp click-to-chat helper.
 *
 * Uses WhatsApp's official wa.me deep links — no QR, no login, no bans, works
 * 100% of the time. Opens WhatsApp (app or web) with the recipient's number and
 * a pre-filled message. The admin/staff taps Send in WhatsApp.
 */

/**
 * Normalize a phone number to international digits for wa.me.
 * Bare 10-digit numbers are assumed to be Indian (+91).
 * Returns null if it can't produce a usable number.
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = "91" + digits;               // bare 10-digit → India
  if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  if (digits.length < 11 || digits.length > 15) return null;      // sanity bounds
  return digits;
}

/** Build a wa.me URL with an optional pre-filled message. */
export function buildWhatsAppLink(phone?: string | null, message?: string): string | null {
  const num = normalizePhone(phone);
  if (!num) return null;
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Open WhatsApp for a given number + message in a new tab.
 * Returns false if the phone number was invalid.
 */
export function openWhatsApp(phone?: string | null, message?: string): boolean {
  const link = buildWhatsAppLink(phone, message);
  if (!link) return false;
  window.open(link, "_blank", "noopener,noreferrer");
  return true;
}

// ── Ready-made message templates for a coaching center ──────────────────────
export const waTemplates = {
  welcome: (name: string, batch?: string) =>
    `Hello ${name}! 🎓 Welcome to our coaching center${batch ? ` for ${batch}` : ""}. We're glad to have you. Reach out anytime for help.`,

  feeReminder: (name: string, amount?: string | number, due?: string) =>
    `Dear Parent/Student (${name}), this is a friendly reminder that a fee payment${amount ? ` of ₹${amount}` : ""} is due${due ? ` by ${due}` : ""}. Kindly pay at your earliest convenience. Thank you!`,

  feeReceipt: (name: string, amount: string | number, receiptNo?: string) =>
    `Dear ${name}, we have received your fee payment of ₹${amount}${receiptNo ? ` (Receipt #${receiptNo})` : ""}. Thank you! 🙏`,

  absent: (name: string, date?: string) =>
    `Dear Parent, your ward ${name} was marked ABSENT${date ? ` on ${date}` : " today"}. Please ensure regular attendance. — Coaching Center`,

  classUpdate: (name: string, detail: string) =>
    `Hello ${name}, class/timetable update: ${detail}`,

  custom: (name: string) => `Hello ${name}, `,
};
