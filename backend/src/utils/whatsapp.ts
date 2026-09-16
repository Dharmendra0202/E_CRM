/**
 * WhatsApp service (whatsapp-web.js) — QR-scan bridge to WhatsApp Web.
 *
 * Connects by scanning a QR from your phone (WhatsApp → Linked Devices).
 * Session persisted via LocalAuth in ./.wwebjs_auth so you scan only once.
 *
 * Exposes: getState, getQRDataURL, autoStartOnce, restart, sendMessage.
 * Emits Socket.IO: "whatsapp_status" { status, isReady } and "whatsapp_qr".
 */

import QRCode from "qrcode";
import fs from "fs";
import { logger } from "./logger";

// whatsapp-web.js is CommonJS.
const { Client, LocalAuth } = require("whatsapp-web.js");

export type WAStatus = "initializing" | "qr" | "ready" | "disconnected" | "auth_failure";

interface WAInternalState {
  status: WAStatus;
  isReady: boolean;
  qrRaw: string | null;
  qrDataURL: string | null;
  lastError: string | null;
}

const state: WAInternalState = {
  status: "disconnected",
  isReady: false,
  qrRaw: null,
  qrDataURL: null,
  lastError: null,
};

let client: any = null;
let starting = false;
let restarting = false;
let everStarted = false;
let io: any = null;

// Swallow async EBUSY / puppeteer errors that whatsapp-web.js can throw during
// logout on Windows, so they never crash the API server.
if (!(global as any).__waErrorGuard) {
  (global as any).__waErrorGuard = true;
  process.on("unhandledRejection", (reason: any) => {
    const msg = String(reason?.message || reason || "");
    if (msg.includes("EBUSY") || msg.includes(".wwebjs_auth") || msg.includes("Session closed") ||
        msg.includes("Protocol error") || msg.includes("Target closed") || msg.includes("Execution context")) {
      logger.warn(`[whatsapp] Ignored async error: ${msg}`);
      return;
    }
    logger.error(`[unhandledRejection] ${msg}`);
  });
}

export function attachWhatsAppSocket(ioInstance: any) {
  io = ioInstance;
}

function emitStatus() {
  if (!io) return;
  io.emit("whatsapp_status", { status: state.status, isReady: state.isReady });
}

export function getState() {
  return {
    status: state.status,
    isReady: state.isReady,
    isInitializing: state.status === "initializing",
    hasQR: state.status === "qr" && !!state.qrDataURL,
  };
}

export function getQRDataURL(): string | null {
  return state.qrDataURL;
}

/** Resolve an installed Chrome/Edge (reliable on Windows); fall back to bundled. */
function resolveBrowserPath(): string | undefined {
  const envPath = process.env.WHATSAPP_CHROME_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of candidates) {
    try { if (p && fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  try {
    const puppeteer = require("puppeteer");
    const p = puppeteer.executablePath?.();
    if (p && fs.existsSync(p)) return p;
  } catch { /* ignore */ }
  return undefined;
}

function buildClient() {
  const executablePath = resolveBrowserPath();
  logger.info(executablePath ? `[whatsapp] Using browser: ${executablePath}` : "[whatsapp] Using bundled browser.");
  return new Client({
    authStrategy: new LocalAuth({ clientId: "ecrm", dataPath: "./.wwebjs_auth" }),
    puppeteer: {
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--disable-gpu",
      ],
    },
  });
}

export async function initClient(): Promise<void> {
  if (client || starting) return;
  starting = true;
  everStarted = true;
  state.status = "initializing";
  state.lastError = null;
  emitStatus();

  try {
    client = buildClient();

    client.on("qr", async (qr: string) => {
      state.qrRaw = qr;
      state.status = "qr";
      state.isReady = false;
      try {
        state.qrDataURL = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
      } catch {
        state.qrDataURL = null;
      }
      logger.info("[whatsapp] QR ready — scan from your phone (Linked Devices).");
      emitStatus();
      if (io) io.emit("whatsapp_qr");
    });

    client.on("loading_screen", (percent: any, message: any) => {
      logger.info(`[whatsapp] Loading ${percent}% ${message || ""}`);
    });

    client.on("change_state", (s: any) => {
      logger.info(`[whatsapp] State: ${s}`);
    });

    client.on("authenticated", () => {
      logger.info("[whatsapp] Authenticated — scan accepted, syncing...");
      state.qrRaw = null;
      state.qrDataURL = null;
    });

    client.on("auth_failure", (msg: string) => {
      logger.warn(`[whatsapp] Auth failure: ${msg}`);
      state.status = "auth_failure";
      state.isReady = false;
      state.lastError = msg;
      emitStatus();
    });

    client.on("ready", () => {
      logger.info("[whatsapp] READY — connected. Messages can be sent.");
      state.status = "ready";
      state.isReady = true;
      state.qrRaw = null;
      state.qrDataURL = null;
      emitStatus();
    });

    client.on("disconnected", async (reason: string) => {
      logger.warn(`[whatsapp] Disconnected: ${reason}`);
      state.status = "disconnected";
      state.isReady = false;
      state.qrRaw = null;
      state.qrDataURL = null;
      try { await client?.destroy(); } catch { /* ignore */ }
      client = null;
      emitStatus();
    });

    await client.initialize();
  } catch (err: any) {
    logger.error(`[whatsapp] Initialization failed: ${err.message}`);
    state.status = "disconnected";
    state.isReady = false;
    state.lastError = err.message;
    client = null;
    emitStatus();
  } finally {
    starting = false;
  }
}

/** Start once on first status check; never loop-retry (prevents profile locks). */
export function autoStartOnce(): void {
  if (!everStarted && !client && !starting) {
    initClient().catch(() => {});
  }
}

/** Tear down + reconnect (fresh QR). Guarded against overlap. */
export async function restart(): Promise<void> {
  if (restarting || starting) {
    logger.warn("[whatsapp] Restart ignored — attempt already in progress.");
    return;
  }
  restarting = true;
  try {
    if (client) {
      await client.destroy().catch(() => {});
      client = null;
    }
    await new Promise((r) => setTimeout(r, 1500));
    everStarted = false; // allow a fresh start
    state.status = "initializing";
    state.isReady = false;
    state.qrRaw = null;
    state.qrDataURL = null;
    emitStatus();
    await initClient();
  } finally {
    restarting = false;
  }
}

/** Normalize phone → WhatsApp chatId. Bare 10-digit assumed India (+91). */
export function toChatId(phone: string): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  if (digits.length < 11 || digits.length > 15) return null;
  return `${digits}@c.us`;
}

/** Send a WhatsApp text. Never throws — safe to fire-and-forget. */
export async function sendMessage(phone: string, text: string): Promise<{ ok: boolean; message: string }> {
  if (!state.isReady || !client) {
    return { ok: false, message: "WhatsApp is not connected. Scan the QR code first." };
  }
  const chatId = toChatId(phone);
  if (!chatId) return { ok: false, message: "Invalid phone number." };
  try {
    const registered = await client.isRegisteredUser(chatId).catch(() => true);
    if (!registered) return { ok: false, message: `${phone} is not a WhatsApp number.` };
    await client.sendMessage(chatId, text);
    return { ok: true, message: "Message sent." };
  } catch (err: any) {
    logger.warn(`[whatsapp] sendMessage failed for ${phone}: ${err.message}`);
    return { ok: false, message: err.message || "Failed to send message." };
  }
}

/** Whether WhatsApp is connected and ready to send (for auto-notifications). */
export function isWhatsAppReady(): boolean {
  return state.isReady && !!client;
}
