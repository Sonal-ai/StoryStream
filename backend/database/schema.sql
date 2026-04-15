-- ============================================================
-- StoryStream Database Schema
-- Normalized to 3NF / BCNF
-- ============================================================

CREATE DATABASE IF NOT EXISTS storystream CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE storystream;

-- ============================================================
-- TABLE 1: users
-- Core user entity. Passwords stored as bcrypt hashes.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)   NOT NULL UNIQUE,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  bio             TEXT,
  profile_picture VARCHAR(500)  DEFAULT NULL,
  full_name       VARCHAR(100)  DEFAULT NULL,
  date_of_birth   DATE          DEFAULT NULL,
  location        VARCHAR(100)  DEFAULT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Assertions (CHECK constraints)
  CONSTRAINT chk_username_min_len  CHECK (CHAR_LENGTH(username) >= 3),
  CONSTRAINT chk_email_format      CHECK (email LIKE '%_@__%.__%'),
  CONSTRAINT chk_password_hash_len CHECK (CHAR_LENGTH(password) >= 8),

  INDEX idx_users_username (username),
  INDEX idx_users_email    (email),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 2: posts
-- User posts (tweets). Soft-deleted via deleted_at.
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED   NOT NULL,
  content     TEXT           NOT NULL,
  image_url   VARCHAR(500)   DEFAULT NULL,
  deleted_at  TIMESTAMP      DEFAULT NULL,             -- soft delete
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Assertions (CHECK constraints)
  CONSTRAINT chk_post_content_not_empty CHECK (CHAR_LENGTH(TRIM(content)) > 0),
  CONSTRAINT chk_post_content_max_len   CHECK (CHAR_LENGTH(content) <= 280),

  INDEX idx_posts_user_id    (user_id),
  INDEX idx_posts_created_at (created_at),
  INDEX idx_posts_deleted_at (deleted_at)              -- used in WHERE deleted_at IS NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 3: comments
-- Comments on posts. Soft-deleted via deleted_at.
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED   NOT NULL,
  user_id     INT UNSIGNED   NOT NULL,
  content     TEXT           NOT NULL,
  deleted_at  TIMESTAMP      DEFAULT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Assertions (CHECK constraints)
  CONSTRAINT chk_comment_content_not_empty CHECK (CHAR_LENGTH(TRIM(content)) > 0),
  CONSTRAINT chk_comment_content_max_len   CHECK (CHAR_LENGTH(content) <= 500),

  INDEX idx_comments_post_id    (post_id),
  INDEX idx_comments_user_id    (user_id),
  INDEX idx_comments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 4: likes
-- Tracks which user liked which post.
-- UNIQUE constraint enforces one-like-per-user-per-post.
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED   NOT NULL,
  post_id     INT UNSIGNED   NOT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

  -- Ensures a user can like a post only ONCE
  UNIQUE KEY uq_likes_user_post (user_id, post_id),

  INDEX idx_likes_post_id (post_id),
  INDEX idx_likes_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 5: follows
-- Directed follow relationship between users.
-- follower_id follows following_id.
-- Self-follow prevented at application layer.
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  follower_id  INT UNSIGNED   NOT NULL,
  following_id INT UNSIGNED   NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_follows_follower  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Assertion: prevent self-follow at DB level
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id),

  -- A user can follow another user only once
  UNIQUE KEY uq_follows_pair (follower_id, following_id),

  INDEX idx_follows_follower_id  (follower_id),
  INDEX idx_follows_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 6: hashtags
-- Normalized hashtag entity. Each unique tag stored once.
-- ============================================================
CREATE TABLE IF NOT EXISTS hashtags (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)   NOT NULL UNIQUE,          -- e.g. 'technology'
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_hashtags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 7: post_hashtags
-- Junction table: resolves many-to-many between posts and hashtags.
-- Composite PK eliminates duplicate associations.
-- ============================================================
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id    INT UNSIGNED NOT NULL,
  hashtag_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (post_id, hashtag_id),                 -- Composite PK = unique pairing

  CONSTRAINT fk_ph_post    FOREIGN KEY (post_id)    REFERENCES posts(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ph_hashtag FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE,

  INDEX idx_ph_hashtag_id (hashtag_id)               -- supports "Find posts by hashtag"
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 8: notifications
-- Stores in-app notifications for events: like, comment, follow.
-- reference_id is polymorphic: refers to post_id or user_id
-- depending on the type column.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NOT NULL,               -- notification receiver
  actor_id     INT UNSIGNED  NOT NULL,               -- who triggered the action
  type         ENUM('like','comment','follow') NOT NULL,
  reference_id INT UNSIGNED  DEFAULT NULL,           -- post_id or user_id based on type
  is_read      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Assertion: no self-notifications
  CONSTRAINT chk_no_self_notification CHECK (user_id <> actor_id),

  INDEX idx_notif_user_id    (user_id),
  INDEX idx_notif_is_read    (is_read),
  INDEX idx_notif_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE 9: audit_logs
-- Immutable audit trail. No FK on user_id (user may be deleted).
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED   DEFAULT NULL,           -- nullable: system actions
  action_type VARCHAR(100)   NOT NULL,               -- e.g. 'CREATE_POST', 'DELETE_COMMENT'
  table_name  VARCHAR(100)   NOT NULL,               -- affected table
  record_id   INT UNSIGNED   DEFAULT NULL,           -- affected record's PK
  meta        JSON           DEFAULT NULL,           -- optional extra context
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user_id    (user_id),
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_table      (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
