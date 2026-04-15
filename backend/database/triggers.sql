-- ============================================================
-- StoryStream Database Triggers
-- Loaded at startup after schema.sql
-- ============================================================

USE storystream;

-- ============================================================
-- TRIGGER 1: trg_audit_post_soft_delete
-- Auto-creates an audit_log entry when a post is soft-deleted
-- (deleted_at changes from NULL to a timestamp).
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_post_soft_delete;

DELIMITER $$
CREATE TRIGGER trg_audit_post_soft_delete
  BEFORE UPDATE ON posts
  FOR EACH ROW
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, meta)
    VALUES (
      NEW.user_id,
      'SOFT_DELETE_POST',
      'posts',
      NEW.id,
      JSON_OBJECT('trigger', 'trg_audit_post_soft_delete', 'deleted_at', NEW.deleted_at)
    );
  END IF;
END$$
DELIMITER ;


-- ============================================================
-- TRIGGER 2: trg_audit_comment_soft_delete
-- Auto-creates an audit_log entry when a comment is soft-deleted.
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_comment_soft_delete;

DELIMITER $$
CREATE TRIGGER trg_audit_comment_soft_delete
  BEFORE UPDATE ON comments
  FOR EACH ROW
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, meta)
    VALUES (
      NEW.user_id,
      'SOFT_DELETE_COMMENT',
      'comments',
      NEW.id,
      JSON_OBJECT('trigger', 'trg_audit_comment_soft_delete', 'deleted_at', NEW.deleted_at)
    );
  END IF;
END$$
DELIMITER ;


-- ============================================================
-- TRIGGER 3: trg_prevent_self_follow
-- Raises an error if a user tries to follow themselves.
-- Defense-in-depth — backs up the CHECK constraint.
-- ============================================================
DROP TRIGGER IF EXISTS trg_prevent_self_follow;

DELIMITER $$
CREATE TRIGGER trg_prevent_self_follow
  BEFORE INSERT ON follows
  FOR EACH ROW
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A user cannot follow themselves.';
  END IF;
END$$
DELIMITER ;


-- ============================================================
-- TRIGGER 4: trg_prevent_self_notification
-- Raises an error if a notification targets the same user
-- who triggered it (e.g., liking your own post).
-- Defense-in-depth — backs up the CHECK constraint.
-- ============================================================
DROP TRIGGER IF EXISTS trg_prevent_self_notification;

DELIMITER $$
CREATE TRIGGER trg_prevent_self_notification
  BEFORE INSERT ON notifications
  FOR EACH ROW
BEGIN
  IF NEW.user_id = NEW.actor_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot create a notification where actor and receiver are the same user.';
  END IF;
END$$
DELIMITER ;


-- ============================================================
-- TRIGGER 5: trg_cleanup_notifications_on_unlike
-- When a like is deleted (unlike), remove the corresponding
-- 'like' notification so the receiver's feed stays clean.
-- ============================================================
DROP TRIGGER IF EXISTS trg_cleanup_notifications_on_unlike;

DELIMITER $$
CREATE TRIGGER trg_cleanup_notifications_on_unlike
  AFTER DELETE ON likes
  FOR EACH ROW
BEGIN
  DELETE FROM notifications
  WHERE actor_id     = OLD.user_id
    AND type         = 'like'
    AND reference_id = OLD.post_id;
END$$
DELIMITER ;


-- ============================================================
-- TRIGGER 6: trg_cleanup_notifications_on_unfollow
-- When a follow is deleted (unfollow), remove the corresponding
-- 'follow' notification.
-- ============================================================
DROP TRIGGER IF EXISTS trg_cleanup_notifications_on_unfollow;

DELIMITER $$
CREATE TRIGGER trg_cleanup_notifications_on_unfollow
  AFTER DELETE ON follows
  FOR EACH ROW
BEGIN
  DELETE FROM notifications
  WHERE actor_id     = OLD.follower_id
    AND type         = 'follow'
    AND reference_id = OLD.follower_id
    AND user_id      = OLD.following_id;
END$$
DELIMITER ;
