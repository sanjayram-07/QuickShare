# ⚡ QuickShare — Secure File Sharing Platform

A production-ready, full-stack file sharing platform with temporary expiring download links, JWT authentication, and a modern dark UI.

---

## 📦 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, Vite, React Router v6   |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB with Mongoose             |
| Auth        | JWT (jsonwebtoken) + bcryptjs     |
| File Upload | Multer middleware                 |
| Security    | Helmet, CORS, express-rate-limit  |
| Scheduler   | node-cron (auto-cleanup)          |
| Fonts       | Syne + Space Mono (Google Fonts)  |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone / extract the project

```bash
cd quickshare
```

---

### 2. Backend Setup

```bash
cd server
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT secret, etc.)

npm run dev   # development with nodemon
# OR
npm start     # production
```

The API runs on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The UI runs on **http://localhost:5173**

> The Vite dev server proxies `/api` calls to the backend automatically.

---

## ⚙️ Environment Variables

Create `server/.env` from `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quickshare
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRES_IN=7d
LINK_EXPIRY_HOURS=24
MAX_FILE_SIZE_MB=50
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 📂 Project Structure

```
quickshare/
├── server/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # register, login, me
│   │   └── fileController.js    # upload, list, download, delete, cleanup
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verify
│   │   └── uploadMiddleware.js  # Multer + file validation
│   ├── models/
│   │   ├── User.js              # User schema + bcrypt
│   │   └── File.js              # File schema + tokens
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   └── fileRoutes.js        # /api/files/*
│   ├── uploads/                 # Stored files (auto-created)
│   ├── server.js                # Express app entry point
│   ├── .env.example             # Environment template
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── FileUploader.jsx  # Drag & drop with progress
    │   │   ├── FileList.jsx      # Cards with expiry timers + copy link
    │   │   └── StatsBar.jsx      # User analytics bar
    │   ├── context/
    │   │   └── AuthContext.jsx   # Auth state + token management
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx
    │   ├── utils/
    │   │   └── api.js            # Axios instance with auth interceptors
    │   ├── main.jsx              # App entry + routing
    │   └── index.css             # Design system CSS variables
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔌 REST API Reference

### Auth Endpoints

| Method | Endpoint             | Auth | Description       |
|--------|----------------------|------|-------------------|
| POST   | /api/auth/register   | No   | Create account    |
| POST   | /api/auth/login      | No   | Get JWT token     |
| GET    | /api/auth/me         | Yes  | Get current user  |

**Register body:**
```json
{
  "username": "cooluser",
  "email": "user@example.com",
  "password": "Secure123"
}
```

**Login body:**
```json
{
  "email": "user@example.com",
  "password": "Secure123"
}
```

---

### File Endpoints

| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| POST   | /api/files/upload            | Yes  | Upload files (multipart) |
| GET    | /api/files                   | Yes  | List my files            |
| GET    | /api/files/download/:token   | No   | Download by token        |
| GET    | /api/files/info/:token       | No   | Get file metadata        |
| DELETE | /api/files/:id               | Yes  | Delete my file           |

**Upload request (multipart/form-data):**
```
files: File[] (max 5, 50MB each)
description: string (optional, max 200 chars)
```

**Upload response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "...",
      "originalName": "report.pdf",
      "size": 204800,
      "sizeFormatted": "200 KB",
      "downloadToken": "abc123...",
      "downloadUrl": "http://localhost:5000/api/files/download/abc123...",
      "expiresAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 🛡️ Security Features

- **Passwords**: bcryptjs with 12 salt rounds
- **JWT**: Short-lived tokens (7d default), signed with HS256
- **Rate Limiting**: 10 auth attempts / 100 general requests per 15 min
- **Helmet**: 15+ security headers (CSP, HSTS, etc.)
- **File Validation**: Blocked extensions (.exe, .bat, .sh, .cmd, etc.) + MIME type checking
- **File Size**: Configurable max (default 50MB)
- **Expiring Links**: Tokens invalidated after 24h (configurable)
- **Ownership**: Files can only be deleted by their uploader
- **Input Sanitization**: express-validator on all auth inputs
- **CORS**: Restricted to configured client origin

---

## 🧹 Auto-Cleanup

A **node-cron** job runs every hour to:
1. Find all expired files in MongoDB
2. Delete physical files from disk
3. Remove database records

Also runs once on server startup.

---

## 📊 Analytics (Per-User)

Each user tracks:
- Total files uploaded
- Total downloads received
- Storage used (bytes)
- Member since date

---

## 🔧 Production Deployment

### Backend
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Atlas URI
JWT_SECRET=<64 char random string>
CLIENT_URL=https://yourdomain.com
```

### Frontend
```bash
cd client
npm run build
# Serve the dist/ folder with nginx or similar
```

### Nginx config snippet
```nginx
server {
    listen 80;
    root /var/www/quickshare/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📝 Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number

---

## 🔒 Blocked File Types

For security, the following cannot be uploaded:
`.exe`, `.bat`, `.sh`, `.cmd`, `.com`, `.scr`, `.ps1`, `.vbs`, `.js`, `.msi`, `.deb`, `.rpm`

---

## License

MIT
