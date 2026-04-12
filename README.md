# 🌊 StoryStream

A full-stack Twitter-like social platform demonstrating **DBMS concepts**, **backend architecture**, and **real-world query handling**.

**Tech Stack:** Node.js · Express.js · MySQL (raw queries, no ORM) · React · JWT · bcrypt

---

## 📁 Project Structure

```
StoryStream/
├── backend/
│   ├── config/          # MySQL connection pool
│   ├── controllers/     # Business logic per feature
│   ├── routes/          # Express route definitions
│   ├── middleware/       # Auth (JWT) + Error handler
│   ├── utils/           # Token generation, pagination
│   ├── database/
│   │   ├── schema.sql   # Normalized DB schema (3NF/BCNF)
│   │   └── seed.sql     # Sample data
│   ├── app.js           # Express app setup
│   ├── server.js        # Entry point
│   └── .env             # Environment vars
│
└── frontend/
    └── src/
        ├── api/         # Axios client + all API calls
        ├── context/     # AuthContext (JWT session)
        ├── components/  # PostCard, CommentSection, FollowButton, etc.
        └── pages/       # Home, Profile, Login, Register, Notifications
```

---

## 🗄️ Database Design

The database is normalized to **3NF/BCNF**:

| Table           | Key Design Decisions                                          |
|-----------------|---------------------------------------------------------------|
| `users`         | Unique constraints on `email` and `username`                 |
| `posts`         | Soft-delete via `deleted_at` timestamp                        |
| `comments`      | Soft-delete via `deleted_at` timestamp                        |
| `likes`         | `UNIQUE(user_id, post_id)` — one like per user per post       |
| `follows`       | `UNIQUE(follower_id, following_id)` — no duplicate follows    |
| `hashtags`      | Normalized entity; deduplicated                               |
| `post_hashtags` | Junction table with composite PK                              |
| `notifications` | Polymorphic `reference_id` (post or user depending on `type`)|
| `audit_logs`    | Append-only, no FK (preserves history after deletions)        |

### Indexes
- `user_id` on posts, comments, likes, follows
- `post_id` on comments, likes
- `created_at` on posts, notifications (for sort performance)

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MySQL 8.0+
- npm

---

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and run schema
source backend/database/schema.sql

# Load seed data
source backend/database/seed.sql
```

Or using the CLI:
```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p storystream < backend/database/seed.sql
```

---

### 2. Backend Setup

```bash
cd backend
```

Edit `.env` and fill in your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=storystream
JWT_SECRET=your_super_secret_key
```

```bash
npm install
npm run dev       # Starts on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## 🔑 Demo Credentials

After running seed.sql:

| Username     | Email               | Password      |
|--------------|---------------------|---------------|
| alice_dev    | alice@example.com   | Password@123  |
| bob_tech     | bob@example.com     | Password@123  |
| carol_ux     | carol@example.com   | Password@123  |

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| POST   | `/api/auth/register`  | ❌   | Register new user    |
| POST   | `/api/auth/login`     | ❌   | Login, get JWT       |
| GET    | `/api/auth/me`        | ✅   | Current user info    |

### Posts
| Method | Endpoint                   | Auth | Description             |
|--------|----------------------------|------|-------------------------|
| GET    | `/api/posts`               | ❌   | Global feed (paginated) |
| GET    | `/api/posts/feed`          | ✅   | Personalized feed       |
| POST   | `/api/posts`               | ✅   | Create post             |
| GET    | `/api/posts/:id`           | ❌   | Get single post         |
| DELETE | `/api/posts/:id`           | ✅   | Soft delete post        |
| GET    | `/api/posts/hashtag/:tag`  | ❌   | Posts by hashtag        |
| POST   | `/api/posts/:id/like`      | ✅   | Like a post             |
| DELETE | `/api/posts/:id/like`      | ✅   | Unlike a post           |
| GET    | `/api/posts/:id/comments`  | ❌   | Get comments            |
| POST   | `/api/posts/:id/comments`  | ✅   | Add comment             |

### Users
| Method | Endpoint                        | Auth | Description        |
|--------|---------------------------------|------|--------------------|
| GET    | `/api/users/:username`          | ❌   | Get profile        |
| PUT    | `/api/users/profile`            | ✅   | Update profile     |
| GET    | `/api/users/:username/posts`    | ❌   | User's posts       |
| GET    | `/api/users/search?q=`          | ❌   | Search users       |
| POST   | `/api/users/:username/follow`   | ✅   | Follow user        |
| DELETE | `/api/users/:username/follow`   | ✅   | Unfollow user      |
| GET    | `/api/users/:username/followers`| ❌   | List followers     |
| GET    | `/api/users/:username/following`| ❌   | List following     |

### Notifications
| Method | Endpoint                       | Auth | Description          |
|--------|--------------------------------|------|----------------------|
| GET    | `/api/notifications`           | ✅   | Get all notifications|
| PUT    | `/api/notifications/read-all`  | ✅   | Mark all read        |
| PUT    | `/api/notifications/:id/read`  | ✅   | Mark one read        |
| DELETE | `/api/notifications/:id`       | ✅   | Delete notification  |

---

## 🧪 Sample API Response

**POST /api/auth/login**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "alice_dev",
      "email": "alice@example.com",
      "bio": "Full-stack developer & coffee lover ☕",
      "profile_picture": "https://api.dicebear.com/..."
    }
  }
}
```

**GET /api/posts?page=1&limit=10**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "Just launched my new project #nodejs #webdev",
        "author_id": 1,
        "username": "alice_dev",
        "like_count": 4,
        "comment_count": 2,
        "hashtags": ["nodejs", "webdev"],
        "created_at": "2026-04-13T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 🏗️ Key Backend Concepts Demonstrated

- **Transactions** — `createPost` wraps INSERT + hashtag linking in one transaction
- **Atomic like + notification** — `likePost` uses a transaction
- **Soft deletes** — Posts & comments use `deleted_at` instead of hard delete
- **Pagination** — All list endpoints support `?page=&limit=` using `LIMIT/OFFSET`
- **JOIN queries** — Feed uses 3-table JOIN (posts + users + follows)
- **Indexes** — `user_id`, `post_id`, `created_at` indexed on all critical tables
- **Audit logs** — Every write action is logged to `audit_logs`
- **UNIQUE constraints** — Prevents duplicate likes and follows at DB level
