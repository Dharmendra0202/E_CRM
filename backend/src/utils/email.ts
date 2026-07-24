import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your E-CRM Portal account",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">🎓 E-CRM Portal</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Academy Management System</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 12px;color:#1a0a2e;font-size:22px;font-weight:700;">Verify your email address</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, welcome to E-CRM! Please verify your email address to activate your account and access the dashboard.</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(255,0,128,0.3);">
              ✅ Verify Email Address
            </a>
          </td></tr></table>
          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">This link expires in <strong>24 hours</strong>. If you didn't create this account, you can safely ignore this email.</p>
          <p style="margin:0;color:#d1d5db;font-size:12px;word-break:break-all;">Or copy: ${link}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 E-CRM Portal · Academy Management System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your E-CRM Portal password",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">🔐 Password Reset</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">E-CRM Portal</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 12px;color:#1a0a2e;font-size:22px;font-weight:700;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, we received a request to reset your password. Click below to set a new one.</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(255,0,128,0.3);">
              🔑 Reset Password
            </a>
          </td></tr></table>
          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request a reset, ignore this email — your password is unchanged.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 E-CRM Portal · Academy Management System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ── LECTURE ASSIGNMENT NOTIFICATION (Teacher) ──────────────────────────────
export async function sendTeacherLectureAssignmentEmail(
  to: string,
  teacherName: string,
  subject: string,
  batchName: string,
  dayName: string,
  startTime: string,
  endTime: string,
  roomOrLink: string,
  isUpdate = false
) {
  const action = isUpdate ? "Updated" : "Assigned";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `📅 Lecture ${action}: ${subject} – ${dayName} ${startTime}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1e1b4b,#4c1d95);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">📅 Lecture ${action}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">E-CRM Academy · Timetable Notification</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
            Dear <strong>${teacherName}</strong>,<br><br>
            You have been <strong>${isUpdate ? "re-assigned" : "assigned"}</strong> to conduct the following class session:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;width:140px;">Subject</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:800;">${subject}</td>
                </tr>
                <tr style="background:rgba(0,0,0,0.02);">
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Batch</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${batchName}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Day</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${dayName}</td>
                </tr>
                <tr style="background:rgba(0,0,0,0.02);">
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Time</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${startTime} – ${endTime}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Room / Link</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${roomOrLink}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0;color:#9ca3af;font-size:13px;">Please mark your attendance upon arrival in the E-CRM App. Contact the admin if there's a conflict.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 E-CRM Portal · Academy Management System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ── SCHEDULE UPDATE NOTIFICATION (Student) ────────────────────────────────
export async function sendStudentScheduleUpdateEmail(
  to: string,
  studentName: string,
  subject: string,
  batchName: string,
  dayName: string,
  startTime: string,
  endTime: string,
  roomOrLink: string,
  isUpdate = false
) {
  const action = isUpdate ? "Updated" : "New";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `📚 ${action} Class Scheduled: ${subject} – ${dayName} ${startTime}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">📚 ${action} Class Schedule</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">E-CRM Academy · Student Notification</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
            Hi <strong>${studentName}</strong>,<br><br>
            A <strong>${isUpdate ? "schedule change has been made" : "new class has been added"}</strong> for your batch:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff4f9;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;width:140px;">Subject</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:800;">${subject}</td>
                </tr>
                <tr style="background:rgba(0,0,0,0.02);">
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Batch</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${batchName}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Day</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${dayName}</td>
                </tr>
                <tr style="background:rgba(0,0,0,0.02);">
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Time</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${startTime} – ${endTime}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Room / Link</td>
                  <td style="color:#1a0a2e;font-size:14px;font-weight:700;">${roomOrLink}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0;color:#9ca3af;font-size:13px;">Please be on time. If you have any questions, contact your batch coordinator.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 E-CRM Portal · Academy Management System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ── STUDENT ONBOARDING & APP DOWNLOAD EMAIL ──────────────────────────────
export async function sendStudentOnboardingEmail(
  to: string,
  studentName: string,
  batchName: string,
  whatsappLink: string,
  feeAmount: number
) {
  const appDownloadUrl = `${APP_URL}/download-app`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 Welcome to E-CRM Academy! Batch: ${batchName} – Access & App Details`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 28px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,hsl(328,100%,54%),hsl(271,91%,60%));padding:40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">🎉 Welcome to the Academy!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;">E-CRM Student Onboarding & Access Portal</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;color:#1f2937;font-size:16px;line-height:1.6;">
            Dear <strong>${studentName}</strong>,<br><br>
            Congratulations! You have been successfully enrolled in <strong>${batchName}</strong>. Below are your login credentials, WhatsApp group link, and mobile app download link.
          </p>

          <!-- Credentials Box -->
          <div style="background:#fdf2f8;border:1.5px solid #fbcfe8;border-radius:14px;padding:20px;margin-bottom:24px;">
            <h3 style="margin:0 0 12px;color:#9d174d;font-size:15px;font-weight:700;">🔐 Your Account Credentials</h3>
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr>
                <td style="color:#831843;font-size:13px;font-weight:600;width:120px;">Email / Login:</td>
                <td style="color:#1f2937;font-size:14px;font-weight:700;">${to}</td>
              </tr>
              <tr>
                <td style="color:#831843;font-size:13px;font-weight:600;">Default Password:</td>
                <td style="color:#1f2937;font-size:14px;font-weight:700;font-family:monospace;">Student@123</td>
              </tr>
              <tr>
                <td style="color:#831843;font-size:13px;font-weight:600;">Monthly Fee:</td>
                <td style="color:#059669;font-size:14px;font-weight:800;">₹${feeAmount.toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </div>

          <!-- WhatsApp Group -->
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px;text-align:center;">
            <h3 style="margin:0 0 8px;color:#166534;font-size:15px;font-weight:700;">💬 Join Your Batch WhatsApp Group</h3>
            <p style="margin:0 0 16px;color:#15803d;font-size:13px;">Get instant class updates, schedule changes, and study materials.</p>
            <a href="${whatsappLink}" target="_blank" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(37,211,102,0.35);">
              📲 Join WhatsApp Group
            </a>
          </div>

          <!-- App Download -->
          <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:20px;margin-bottom:24px;text-align:center;">
            <h3 style="margin:0 0 8px;color:#1e40af;font-size:15px;font-weight:700;">📱 Download Mobile Attendance App</h3>
            <p style="margin:0 0 16px;color:#1d4ed8;font-size:13px;">Track your attendance, view class schedules, and pay fees on the go.</p>
            <a href="${appDownloadUrl}" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
              ⬇️ Download Student App
            </a>
          </div>

          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Need help? Reply to this email or contact your academy administrator.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 E-CRM Portal · Academy Management System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
