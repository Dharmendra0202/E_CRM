# UI/UX Design Specification
## Project Name: Educational E-CRM & Classes Management System

---

## 1. Document Control
*   **Version**: 1.0.0
*   **Status**: Draft
*   **Authors**: Antigravity AI & Dharmendra

---

## 2. Visual Theme & Philosophy

The Educational E-CRM utilizes a **Premium Glassmorphic Dark Theme** on web platforms to reduce eye strain for administrative tasks and project a modern, high-tech interface. The mobile application adopts a clean, high-contrast, component-focused dark mode layout designed for readability in varying lighting conditions (e.g., teachers marking attendance outdoors or parents checking schedules on the move).

---

## 3. Design System & Tokens

### 3.1. Color Palette (HSL & Hex)

We employ a balanced, cohesive color system utilizing high-vibrancy accent colors against rich, deep neutral backgrounds:

| Token Name | HSL Value | Hex Value | Application / Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `hsl(224, 71%, 4%)` | `#030712` | Main page background (deep dark gray-blue) |
| `--bg-secondary` | `hsl(222, 47%, 11%)` | `#0b1329` | Sidebars, headers, card sub-layers |
| `--surface-glass` | `hsla(222, 47%, 11%, 0.45)`| `rgba(11,19,41,0.45)` | Core glassmorphic card overlays (with 16px blur) |
| `--border-glass` | `hsla(217, 33%, 92%, 0.08)`| `rgba(235,240,250,0.08)` | Translucent borders |
| `--text-primary` | `hsl(210, 40%, 98%)` | `#f8fafc` | Primary titles, body copy, active text |
| `--text-secondary`| `hsl(215, 20%, 65%)` | `#94a3b8` | Subtitles, label text, disabled controls |
| `--color-accent` | `hsl(250, 95%, 65%)` | `#6366f1` | Primary CTA, focus states (Indigo glow) |
| `--color-success` | `hsl(142, 70%, 45%)` | `#10b981` | Enrolled status, paid bills, present attendance |
| `--color-warning` | `hsl(38, 92%, 50%)` | `#f59e0b` | Demo scheduled, partially paid, late attendance |
| `--color-danger` | `hsl(0, 84%, 60%)` | `#ef4444` | Lost leads, unpaid invoices, absent attendance |

### 3.2. Typography

*   **Primary Web Font**: `Outfit`, Sans-Serif (imported from Google Fonts).
*   **Fallback Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
*   **Scale**:
    *   `h1` (Page Title): `32px` / Line Height: `1.2` / Weight: `700`
    *   `h2` (Section Title): `24px` / Line Height: `1.3` / Weight: `600`
    *   `h3` (Card Title): `18px` / Line Height: `1.4` / Weight: `600`
    *   `body-primary` (Content): `14px` / Line Height: `1.5` / Weight: `400`
    *   `body-small` (Captions/Meta): `12px` / Line Height: `1.4` / Weight: `400`

### 3.3. Structural Tokens
*   **Border Radius**:
    *   Small (Buttons, inputs): `8px`
    *   Medium (Dashboard cards, dialogs): `16px`
    *   Large (Modals, banners): `24px`
*   **Shadows (Neon Accents)**:
    *   `--shadow-glow-accent`: `0 0 20px hsla(250, 95%, 65%, 0.15)`
    *   `--shadow-card`: `0 10px 30px -10px rgba(0, 0, 0, 0.5)`
*   **Glassmorphic Filter**: `backdrop-filter: blur(16px) saturate(180%)`

---

## 4. Web Application Key Layouts

### 4.1. The Dashboard Shell
*   **Sidebar (Left, Fixed)**: Dark slate navigation rail. Icons only on collapsed state (64px), expanding to full labels on hover (240px). Bottom includes active profile widget.
*   **Global Header (Top, Sticky)**: Translucent blurred header with search bar, notifications bell (displays indicator when unread items exist), and quick action button ("+ Add Lead").
*   **Content Window**: Fluid flex/grid space rendering pages under route control.

### 4.2. Kanban CRM Board
*   Four columns (`New Inquiry`, `Contacted`, `Demo Scheduled`, `Enrolled`, `Lost`).
*   **Card States**:
    *   Default: Glassmorphic translucent border, title, lead tag, date added.
    *   Hover: Elevate 4px upward (`transform: translateY(-4px)`), apply `--shadow-glow-accent`.
    *   Dragging: Target column highlights with an indigo translucent border overlay.

### 4.3. Timetable Calendar Scheduler
*   Grid view with Days (columns: Mon-Sat) and Hours (rows: 08:00 to 20:00).
*   Scheduled blocks rendered as absolute elements span corresponding row-heights. Colored by subject area. Hovering on a block shows a mini pop-up tooltip listing batch capacity and assigned teacher.

---

## 5. Mobile Application Screens & Flows

### 5.1. Teacher Attendance Panel
*   **Screen 1: Batch Select**: Single-column vertical card list showing today's remaining sessions (Subject, Room, Timings).
*   **Screen 2: Attendance Grid**: Multi-row list layout.
    *   Each student represented by a card with their photo, name, and three-state toggle selector (`P`, `A`, `L`).
    *   Tapping a status updates the toggle color immediately (`P` -> Emerald Green, `A` -> Vivid Red, `L` -> Amber Orange) accompanied by a haptic feedback click.
    *   Bottom-pinned sticky primary CTA button: "Submit Attendance & Notify Parents" (triggers sync/local queue).

### 5.2. Parent / Student Dashboard
*   **Feed Stream**: Card feed showing daily bulletin updates, assignments, grades, and calendar announcements in chronologically reverse order.
*   **Invoice Card Widget**: If fee payments are pending, a glowing card anchors at the top dashboard level displaying balance. Incorporates a "Pay Now" CTA button triggering the mobile payment modal.

---

## 6. Micro-Animations & Interactive States

*   **Button Hover**: Transition backgrounds and border colors smoothly over `0.2s ease-out`. Active tap shrinks button to `scale(0.97)`.
*   **Page Transitions**: Route switches fade in the content panel (`opacity: 0 -> 1`) combined with a slight vertical slide up (`transform: translateY(10px -> 0)`).
*   **Success Confetti Overlay**: On successful invoice payment, trigger a canvas confetti explosion across the screen to create delight.
