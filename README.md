# StoryStream 🌊

A production-ready, full-stack social media platform inspired by Twitter — built for inclusivity, safety, and great developer experience.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Vanilla CSS         |
| Backend  | Node.js, Express.js                 |
| Database | MySQL (via `mysql2` raw driver)     |
| Auth     | JWT + bcryptjs                      |
| Security | Helmet, CORS, Rate Limiting, HPP    |

---

## Features

- 🔐 **Auth** — Register, login, JWT-protected routes
- 🏠 **Feed** — Global feed and personalized "For You" feed (followed users)
- 📝 **Posts** — Create, delete, image attachments, 280-char limit
- ❤️ **Likes** — Like / unlike posts with live count
- 💬 **Comments** — Inline comments that expand directly on the post card
- #️⃣ **Hashtags** — Auto-extracted from post content; clickable hashtag pages
- 👥 **Follow System** — Follow/unfollow users, Follow Back from followers list
- 🔔 **Notifications** — Real-time in-app notifications for likes, comments, follows
- 🔍 **Search** — Search users by username or bio
- 👤 **Profiles** — View/edit profile, followers & following lists
- 🏥 **Health Check** — `GET /health` checks API + database connection
- 🛡️ **Security** — Parameterized SQL, rate limiting, XSS protection, CORS
- 🗄️ **Auto Schema** — Database & tables created automatically on server startup

---

## Prerequisites

> ⚠️ **MySQL Workbench is required** (or any MySQL 8.x server).
> Download: https://dev.mysql.com/downloads/workbench/

- Node.js v18+
- npm v9+
- MySQL 8.x running locally

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/StoryStream.git
cd StoryStream
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=storystream
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
```

> ✅ **You do NOT need to create the database manually.**
> The backend will automatically create the `storystream` database and all tables on first startup.

Start the backend:

```bash
npm run dev
```

You should see:
```
✅ Base Database Schema loaded from schema.sql
✅ MySQL connected successfully and Database is ready!
🚀 StoryStream API Server running on port 5000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Seed Data (Optional)

To populate the database with demo users, posts, likes, comments, follows, and notifications:

```bash
# From the backend directory (PowerShell / Windows):
cd backend
Get-Content database\seed.sql | mysql -u root -pyour_password storystream

# From the backend directory (bash / Mac / Linux):
mysql -u root -p storystream < database/seed.sql
```

### Seeded Demo Accounts

All seeded users share the same password: **`Password@123`**

| Username     | Email                  | Bio                                    |
|--------------|------------------------|----------------------------------------|
| `alice_dev`  | alice@example.com      | Full-stack developer & coffee lover ☕  |
| `bob_tech`   | bob@example.com        | Building things with code & curiosity 🚀|
| `carol_ux`   | carol@example.com      | UI/UX Designer \| CSS wizard 🎨         |
| `dave_ml`    | dave@example.com       | ML Engineer \| Data storyteller 📊      |
| `eve_devops` | eve@example.com        | DevOps \| Kubernetes wrangler 🐳        |

---

## API Reference

### Auth
| Method | Endpoint              | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | `/api/auth/register`  | Register new user        | ❌   |
| POST   | `/api/auth/login`     | Login, returns JWT token | ❌   |
| GET    | `/api/auth/me`        | Get current user         | ✅   |

### Users
| Method | Endpoint                          | Description               | Auth |
|--------|-----------------------------------|---------------------------|------|
| GET    | `/api/users/:username`            | Get user profile          | ❌   |
| PUT    | `/api/users/profile`              | Update own profile        | ✅   |
| GET    | `/api/users/:username/posts`      | Get user's posts          | ❌   |
| GET    | `/api/users/search?q=term`        | Search users              | ❌   |
| POST   | `/api/users/:username/follow`     | Follow a user             | ✅   |
| DELETE | `/api/users/:username/follow`     | Unfollow a user           | ✅   |
| GET    | `/api/users/:username/followers`  | List followers            | ❌   |
| GET    | `/api/users/:username/following`  | List following            | ❌   |

### Posts
| Method | Endpoint                      | Description                    | Auth |
|--------|-------------------------------|--------------------------------|------|
| GET    | `/api/posts`                  | Global feed (paginated)        | ❌   |
| GET    | `/api/posts/feed`             | Personalized feed              | ✅   |
| POST   | `/api/posts`                  | Create a post                  | ✅   |
| DELETE | `/api/posts/:id`              | Delete own post                | ✅   |
| GET    | `/api/posts/:id`              | Get single post                | ❌   |
| GET    | `/api/posts/hashtag/:tag`     | Posts by hashtag               | ❌   |

### Comments
| Method | Endpoint                          | Description          | Auth |
|--------|-----------------------------------|----------------------|------|
| GET    | `/api/posts/:postId/comments`     | Get comments on post | ❌   |
| POST   | `/api/posts/:postId/comments`     | Add a comment        | ✅   |
| DELETE | `/api/comments/:id`               | Delete own comment   | ✅   |

### Likes
| Method | Endpoint                   | Description    | Auth |
|--------|----------------------------|----------------|------|
| POST   | `/api/posts/:postId/like`  | Like a post    | ✅   |
| DELETE | `/api/posts/:postId/like`  | Unlike a post  | ✅   |

### Notifications
| Method | Endpoint                          | Description             | Auth |
|--------|-----------------------------------|-------------------------|------|
| GET    | `/api/notifications`              | Get notifications       | ✅   |
| PUT    | `/api/notifications/:id/read`     | Mark one as read        | ✅   |
| PUT    | `/api/notifications/read-all`     | Mark all as read        | ✅   |
| DELETE | `/api/notifications/:id`          | Delete notification     | ✅   |

### Health
| Method | Endpoint    | Description                        | Auth |
|--------|-------------|------------------------------------|------|
| GET    | `/health`   | API + database connectivity check  | ❌   |

---

## Project Structure

```
StoryStream/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL pool + auto DB & schema init
│   ├── controllers/           # Business logic for each resource
│   ├── database/
│   │   ├── schema.sql         # Full DB schema (auto-injected on startup)
│   │   └── seed.sql           # Demo data (optional, run manually)
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protect middleware
│   │   └── errorMiddleware.js # Global error handler
│   ├── routes/                # Express route definitions
│   ├── utils/
│   │   └── pagination.js      # Pagination helper
│   ├── .env.example           # Environment variable template
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
│
└── frontend/
    └── src/
        ├── api/               # Axios API functions
        ├── components/        # Reusable UI components
        ├── context/           # AuthContext (global user state)
        ├── pages/             # Page-level components
        └── index.css          # Global design system (dark theme)
```

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for the full reference with descriptions.

---

## Security Notes

- All SQL queries use **parameterized placeholders** (`?`) — immune to SQL injection
- Passwords hashed with **bcryptjs** (cost factor 10)
- JWT tokens expire in 7 days by default
- Rate limiting: **150 requests / 15 min per IP** on all `/api/*` routes
- **Helmet** sets hardened HTTP security headers

---

## License

MIT
