# 🌧️ FloodWatch

A community-driven flood reporting web application that allows users to report flooding in real time, upload photo evidence, and help others stay informed about flood conditions in their area.

FloodWatch is built as a full-stack web application using **Next.js**, **TypeScript**, and **Supabase**.

---

## 📸 Preview

> *(Add screenshots here later.)*

---

## ✨ Features

### Authentication

- ✅ Google Sign-In using Supabase Authentication
- ✅ Protected routes
- ✅ Persistent login sessions
- ✅ Secure logout

### User Profiles

- ✅ Profile setup after first login
- ✅ Username
- ✅ Display name
- ✅ Google profile avatar
- ✅ Personal profile page
- ✅ View your own flood reports

### Flood Reports

- ✅ Create flood reports
- ✅ Upload flood photos
- ✅ Location field
- ✅ Description field
- ✅ Automatic timestamp
- ✅ Reports displayed newest first

### Flood Severity

- 🟢 Minor
- 🟡 Moderate
- 🟠 Severe
- 🔴 Critical / Impassable

### Flood Status

- 🔴 Active
- 🟢 Resolved
- Toggle between Active and Resolved
- Default status is Active

### Feed

- ✅ Community feed
- ✅ Profile information on every post
- ✅ Relative timestamps
- ✅ Recent report indicator
- ✅ Severity badges
- ✅ Status badges

### Search & Filtering

- 🔍 Location search
- Filter by:
  - Severity
  - Status
- Combined search + filtering
- Clear filters
- Empty-state handling

### Report Management

- ✏️ Edit your own reports
- 🗑️ Delete your own reports
- Ownership enforced through Supabase Row Level Security

### Community Confirmation

- 👍 Confirm "Still Flooding"
- Toggle confirmation on/off
- Confirmation count displayed
- One confirmation per user per report
- Confirmations disabled for resolved reports

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Frontend & App Router |
| React | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | Backend |
| PostgreSQL | Database |
| Supabase Auth | Google Authentication |
| Supabase Storage | Flood image storage |

---

## 📂 Project Structure

```text
floodwatch/
├── app/
│   ├── login/
│   ├── profile/
│   ├── report/
│   ├── auth/
│   └── ...
├── lib/
│   └── supabase/
├── public/
├── tests/
└── ...
```

---

## 🗄️ Database

### Profiles

| Field | Type |
|--------|------|
| id | UUID |
| username | Text |
| display_name | Text |
| avatar_url | Text |
| created_at | Timestamp |

### Posts

| Field | Type |
|--------|------|
| id | Integer |
| user_id | UUID |
| location | Text |
| description | Text |
| image_url | Text |
| severity | Enum |
| status | Enum |
| created_at | Timestamp |

### Report Confirmations

| Field | Type |
|--------|------|
| id | Integer |
| report_id | FK |
| user_id | FK |
| created_at | Timestamp |

---

## 🔒 Security

FloodWatch uses Supabase Row Level Security (RLS).

Implemented security includes:

- Users can only edit their own reports.
- Users can only delete their own reports.
- Users can only update their own report status.
- Users can only create/delete their own confirmations.
- Invalid severity values are rejected.
- Invalid status values are rejected.

---

## 🚀 Getting Started

### Requirements

- Node.js 22+
- npm
- Supabase account
- Google Cloud OAuth credentials

### Installation

```bash
git clone https://github.com/yourusername/floodwatch.git

cd floodwatch

npm install

npm run dev
```

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Testing

FloodWatch includes automated tests.

Available commands:

```bash
npm run test
npm run test:unit
npm run test:e2e
npm run test:coverage
```

> **Note:** During feature development, automated tests are not run automatically after every change. Run the test suite only when performing a dedicated testing pass or before major commits/releases.

---

## 📌 Current Workflow

```text
User
 │
 ▼
Google Login
 │
 ▼
Profile Setup
 │
 ▼
Home Feed
 │
 ├── Create Flood Report
 │      ├── Location
 │      ├── Description
 │      ├── Photo
 │      └── Severity
 │
 ▼
Community Feed
 │
 ├── Search
 ├── Filters
 ├── Confirm Report
 ├── Edit Own Report
 └── Delete Own Report
```

---

## 🛣️ Roadmap

### Completed

- [x] Google Authentication
- [x] User Profiles
- [x] Flood Reports
- [x] Image Upload
- [x] Feed
- [x] Edit/Delete Reports
- [x] Severity
- [x] Active/Resolved Status
- [x] Search
- [x] Filters
- [x] Community Confirmation

### Planned

- [ ] Report sharing
- [ ] Public user profiles
- [ ] Report verification
- [ ] Map visualization
- [ ] Nearby reports
- [ ] Notifications
- [ ] Historical analytics dashboard
- [ ] Admin moderation

---

## 💡 Design Philosophy

FloodWatch is designed as a **community-first flood information platform**, not a general social network.

The application prioritizes:

- Accurate community reporting
- Photo-based evidence
- Clear flood severity
- Real-time updates
- Simple and intuitive user experience

---

## 👨‍💻 Author

Developed by **Winston Tabada** as a full-stack portfolio project demonstrating:

- Next.js
- TypeScript
- Supabase
- Authentication
- PostgreSQL
- File uploads
- Row Level Security
- Modern web application architecture