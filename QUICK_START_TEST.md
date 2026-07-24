# 🚀 Quick Start: Test Real-Time Attendance in 5 Minutes

## Step 1: Start the Servers (1 min)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Wait for: `E-CRM API running on http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173`

---

## Step 2: Open Web Dashboard (1 min)

1. Open browser: http://localhost:5173
2. Login with your credentials
3. Click **"Attendance"** in the bottom dock
4. You should see:
   - 🟢 **"Live"** badge (green with pulse) in top right
   - Summary stats (Total, Present, Absent, etc.)
   - Student list

---

## Step 3: Simulate Mobile Update with Postman (3 min)

### A. Get Authentication Token

```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "your-teacher-email@example.com",
  "password": "your-password"
}
```

**Copy the `token` from response**

### B. Get Batch and Schedule IDs

```http
GET http://localhost:5000/api/v1/batches
Authorization: Bearer YOUR_TOKEN_HERE
```

**Copy:**
- `id` (this is the batch_id)
- `schedules[0].id` (this is the schedule_id)

### C. Get a Student ID

```http
GET http://localhost:5000/api/v1/students
Authorization: Bearer YOUR_TOKEN_HERE
```

**Copy any student's `id`**

### D. Mark Attendance (The Magic Moment!)

```http
POST http://localhost:5000/api/v1/attendance/mark
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "schedule_id": "paste-schedule-id-here",
  "student_id": "paste-student-id-here",
  "class_date": "2026-07-24",
  "status": "PRESENT",
  "remarks": "Testing real-time sync!"
}
```

### E. Watch the Dashboard ✨

**In the web browser, you should instantly see:**

1. 📱 **Green flash** on the student row
2. 📱 **Mobile badge** next to student avatar
3. 🔔 **Notification toast**: "📱 Attendance updated from mobile by [Your Name]"
4. ✅ **Status button** turns green (Present)
5. 📊 **Summary stats** update automatically

---

## Alternative: Two Browser Test

1. Open dashboard in **Chrome** → Go to Attendance
2. Open dashboard in **Firefox** → Go to Attendance  
3. Select same batch in both
4. Mark attendance in Chrome
5. Watch it appear **instantly** in Firefox!

---

## Troubleshooting

### "Offline" Status Shows

**Problem**: Red "Offline" badge instead of green "Live"

**Fix**:
1. Check backend is running: http://localhost:5000/api/v1/health
2. Open browser console → Look for WebSocket errors
3. Verify `VITE_API_URL` in `frontend/.env` is set correctly
4. Refresh the page

### No Updates Appearing

**Problem**: Marked attendance in Postman but nothing happens

**Fix**:
1. Ensure you're using the correct `batch_id` in both places
2. Check the JWT token is valid (login again if needed)
3. Open browser DevTools → Network tab → WS → Check for "attendance_updated" messages
4. Look at backend terminal for "Socket connected" logs

### Connection Drops

**Problem**: Green badge turns red after a while

**Fix**:
- This is normal! The system will auto-reconnect within 1-5 seconds
- If it stays offline, refresh the browser
- Check your internet connection

---

## What to Look For

### ✅ Success Indicators

- **Browser Console Logs**:
  ```
  ✅ WebSocket connected: abc123
  📡 Joined batch room: batch_uuid-here
  🔔 Received attendance update: {...}
  ```

- **Backend Terminal Logs**:
  ```
  Socket connected: abc123
  Socket abc123 joined batch_uuid-here
  ```

- **Visual Feedback**:
  - Green "Live" badge with pulsing dot
  - Row background flashes green
  - Mobile badge (📱) appears
  - Toast notification slides in

---

## Expected Behavior

### When You Mark from Postman:

```
┌─────────────────────────────────────┐
│  Backend receives POST /mark         │
│         ↓                            │
│  Saves to database                   │
│         ↓                            │
│  Broadcasts WebSocket event          │
│         ↓                            │
│  Frontend receives event             │
│         ↓                            │
│  UI updates instantly ✨             │
└─────────────────────────────────────┘
```

**Timeline**: < 100 milliseconds from mobile → web

---

## Pro Tips

1. **Keep Both Terminals Visible** - Watch for errors in real-time
2. **Use Browser DevTools** - Network → WS tab to see WebSocket traffic
3. **Try Different Statuses** - Test PRESENT, ABSENT, and LATE
4. **Multiple Students** - Mark several students to see batch updates
5. **Refresh Test** - Mark attendance, refresh browser, see it persisted

---

## Quick Commands Cheat Sheet

```bash
# Start backend
cd backend && npm run dev

# Start frontend  
cd frontend && npm run dev

# Check TypeScript errors
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# View logs
# Backend logs show in Terminal 1
# Frontend logs show in browser console
```

---

## Need More Help?

📖 **Full Documentation**: See `docs/REAL_TIME_ATTENDANCE_GUIDE.md`

📊 **Implementation Summary**: See `REALTIME_ATTENDANCE_SUMMARY.md`

🐛 **Having Issues?**
1. Check both terminal windows for errors
2. Look at browser console for WebSocket logs
3. Verify `.env` files are configured correctly
4. Try clearing browser cache and reloading

---

## 🎉 That's It!

You now have a working real-time attendance system. Any changes made from mobile (or Postman) appear **instantly** on the web dashboard with beautiful visual feedback.

**Enjoy! 🚀**
