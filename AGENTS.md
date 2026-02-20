# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MERN stack Online Exam Portal with role-based access control. Five user roles: System Admin, Exam Manager, Question Manager, Result Manager, and Student. Each role has a dedicated dashboard page and corresponding API routes.

## Commands

### Server (Express backend, CommonJS)

```bash
cd server
npm install          # install dependencies
npm run dev          # start with nodemon (hot reload)
npm start            # start without hot reload
npm run seed         # seed demo data (users, exam, questions)
```

Server runs on `http://localhost:5000` (configurable via `PORT` in `server/.env`).

### Client (React + Vite, ES modules)

```bash
cd client
npm install          # install dependencies
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # production build to dist/
npm run lint         # ESLint
npm run preview      # preview production build
```

### Environment Variables

`server/.env` must contain:
- `PORT` — server port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for JWT signing

The client reads `VITE_API_BASE` (defaults to `http://localhost:5000`) for the backend URL.

### No Test Framework

There is no test runner configured. `npm test` in the server is a no-op placeholder.

## Architecture

### Server Structure (CommonJS, Express 5, Mongoose 9)

Request flow: **Route → express-validator → auth middleware → controller → Mongoose model → MongoDB**

- `server.js` — entry point; mounts all route groups under `/api/*`
- `config/db.js` — MongoDB connection via Mongoose
- `middleware/auth.js` — `protect` (JWT verification, attaches `req.user`) and `authorize(...roles)` (role gating). These two middlewares are chained on nearly every route.
- `middleware/role.js` — duplicate/alternative `authorize` (unused by most routes; `auth.js` version is canonical)
- `routes/` — one file per domain; applies express-validator inline and wires to controllers
- `controllers/` — one file per domain; all async, returns JSON
- `models/` — Mongoose schemas with `{ timestamps: true }`
- `utils/generateToken.js` — standalone JWT helper (note: `authController.js` also has its own inline `generateToken` with a different expiry)
- `seed.js` — drops all collections and creates demo users/exam/questions

### Mongoose Models and Relationships

- **User** — has `role` enum, bcrypt password hashing via pre-save hook, `matchPassword()` instance method
- **Exam** — `created_by` → User. `is_active` boolean controls student visibility. `duration` stored in minutes.
- **Question** — `exam_id` → Exam. Four fixed option fields, `correct_option` is 1-4.
- **ExamAttempt** — `exam_id` → Exam, `student_id` → User. Tracks `completed`, `is_passed`, `total_score`.
- **StudentAnswer** — `attempt_id` → ExamAttempt, `question_id` → Question. `selected_option` nullable (unanswered = null = zero marks).
- **Feedback** — `student_id` → User. Status is `Pending` or `Replied`.

### Client Structure (React 19, Vite, React Router 7)

- `main.jsx` — wraps app in `BrowserRouter` → `AuthProvider` → `App`
- `context/AuthContext.jsx` — manages JWT token in `localStorage`, exposes `login`, `register`, `logout`, `user`, `token` via React context. All API calls use `fetch` with Bearer token. Backend base URL from `VITE_API_BASE`.
- `components/ProtectedRoute.jsx` — checks `user` and `roles`; redirects unauthenticated users to `/login`, unauthorized users to their own dashboard via `utils/roleRoutes.js`
- `pages/` — one dashboard component per role (AdminDashboard, ExamManagerDashboard, QuestionManagerDashboard, ResultManagerDashboard, StudentDashboard), plus Home, Login, Register
- `styles/` — per-page CSS files, plus `global.css`

### Route → Role Mapping

| Route                | Role              |
|----------------------|-------------------|
| `/admin`             | System Admin      |
| `/exam-manager`      | Exam Manager      |
| `/question-manager`  | Question Manager  |
| `/result-manager`    | Result Manager    |
| `/student`           | Student           |

### Key Domain Rules

- Students can only attempt each exam once (enforced server-side)
- Pass/fail threshold is 40%
- Unanswered questions count as zero marks
- Exam duration can be set in minutes or hours (≥60 min); stored internally as minutes
- Result queries filter out attempts referencing deleted users/exams to avoid zombie data
- Exam name validation: letters, underscore, and full stop only
- Username validation: letters, underscore, and full stop only
- Full name validation: letters and spaces, minimum 2 characters

### Auth Flow

1. Client calls `POST /api/auth/login` (or `/register`)
2. Server returns user object + JWT (7-day expiry in authController, 30-day in generateToken util)
3. Client stores token in `localStorage` under key `auth_token`
4. Subsequent requests include `Authorization: Bearer <token>` header
5. `protect` middleware decodes JWT, attaches full user document (minus password) to `req.user`
6. `authorize(...roles)` checks `req.user.role` against allowed roles

### Demo Seed Credentials

Run `npm run seed` in `server/` first. Logins:
- `admin@example.com` / `Admin@123` (System Admin)
- `exam@example.com` / `Exam@123` (Exam Manager)
- `question@example.com` / `Question@123` (Question Manager)
- `result@example.com` / `Result@123` (Result Manager)
- `student1@example.com` / `Student@123` (Student)
