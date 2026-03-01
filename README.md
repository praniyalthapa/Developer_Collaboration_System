# DevConnector - Installation Guide

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (Local or Atlas)
- Git

---

## 🔧 Installation Steps

### 1. Clone the repository
```bash
git clone url
cd DevCollabSystem
```

### 2. Install dependencies

**Backend:**
```bash
cd apps/backend
npm install
```

**Frontend:**
```bash
cd apps/frontend
npm install
```

---

## ⚙️ Environment Configuration

### Backend Environment

Create `apps/backend/.env` file:
```env
PORT=7777
NODE_ENV=development
DB_CONNECTION_SECRET=mongodb://localhost:27017/devconnector
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment

Create `apps/frontend/.env` file:
```env
VITE_BACKEND_URL=http://localhost:7777
```

---

##  Run the Application

**Terminal 1 - Start Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd apps/frontend
npm run dev
```

---

## 🌐 Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:7777/api

---

## 📝 Notes

- Make sure MongoDB is running before starting backend
- Update `.env` files with your actual credentials