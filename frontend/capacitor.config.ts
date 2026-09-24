import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eduflow.ecrm",
  appName: "EduFlow E-CRM",
  webDir: "dist",
  server: {
    // Allow plain HTTP (the LAN backend is http://, not https://) so the
    // WebView can call it during on-device testing.
    androidScheme: "http",
    cleartext: true,
  },
};

export default config;
