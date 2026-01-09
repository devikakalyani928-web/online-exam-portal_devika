## Online Exam Portal (MERN)

Simple role-based online exam portal built with **MongoDB, Express, React, Node.js**.

### Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
- **Frontend**: React (Vite), React Router

### Folder Structure
- `server` – Express API, MongoDB models, auth, exam logic
- `client` – React frontend (Vite app)

---

## 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)

Set your `.env` in `server/.env`:

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

---

## 2. Install & Run

### Backend
```bash
cd server
npm install
npm run dev      # or: npm start
```

Backend runs on `http://localhost:5000`.

### Frontend
```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (default Vite port).

---

## 3. Seed Demo Data

To quickly create sample users, one exam, and questions:

```bash
cd server
npm run seed
```

Demo logins:
- **System Admin**: `admin@example.com` / `Admin@123`
- **Exam Manager**: `exam@example.com` / `Exam@123`
- **Question Manager**: `question@example.com` / `Question@123`
- **Result Manager**: `result@example.com` / `Result@123`
- **Student**: `student1@example.com` / `Student@123`

Run the seed before starting the server for a clean demo.

---

## 4. User Roles & Main Screens

All roles log in from the same React app. Routing is handled in `client/src/App.jsx`.

- **System Admin**
  - Page: `/admin`
  - Can create, list, and delete users; assign roles.
- **Exam Manager**
  - Page: `/exam-manager`
  - Create exams, set schedule/duration, activate/deactivate exams.
- **Question Manager**
  - Page: `/question-manager`
  - Select an exam, add MCQ questions (4 options, correct answer), list & delete questions.
- **Result Manager**
  - Page: `/result-manager`
  - View all exam attempts with exam name, student, score, and completion status.
- **Student**
  - Page: `/student`
  - View **available exams**, start exam, answer MCQs, submit, and see:
    - Immediate score for the submitted exam
    - Past attempts in **My Results** table.

---

## 5. API Overview (Simplified)

Base URL: `http://localhost:5000`

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Users** (System Admin)
  - `GET /api/users`
  - `POST /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
- **Exams**
  - (Exam Manager) `GET /api/exams`, `POST /api/exams`, `PUT /api/exams/:id`,
    `POST /api/exams/:id/activate`, `POST /api/exams/:id/deactivate`
  - (Student) `GET /api/exams/available`, `GET /api/exams/:id/questions`,
    `POST /api/exams/:id/start`, `POST /api/exams/:id/submit`
- **Questions** (Question Manager)
  - `POST /api/questions`
  - `GET /api/questions/:examId`
  - `PUT /api/questions/:id`
  - `DELETE /api/questions/:id`
- **Results**
  - (Result Manager) `GET /api/results`, `GET /api/results/:examId`
  - (Student) `GET /api/results/student/me`

---

## 6. Suggested Demo Flow (Viva)

1. **Login as System Admin** (`/admin`):
   - Show user management (list + create).
2. **Login as Exam Manager** (`/exam-manager`):
   - Show creating an exam and activating it.
3. **Login as Question Manager** (`/question-manager`):
   - Select the exam and add questions.
4. **Login as Student** (`/student`):
   - Show available exam, take it, submit, and view score + My Results.
5. **Login as Result Manager** (`/result-manager`):
   - Show overall attempts, scores, and completion status.

This covers authentication, role-based access, exam management, question bank, exam attempts, and automatic result calculation in a way that is easy to explain to evaluators.


