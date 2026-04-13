-- ============================================================
-- StoryStream Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE storystream;

-- ============================================================
-- Seed: users
-- Passwords are bcrypt hashes of 'Password@123'
-- ============================================================
INSERT IGNORE INTO users (username, email, password, bio, profile_picture) VALUES
('alice_dev',   'alice@example.com',   '$2b$10$YCVlMK9MJVqKhShOp9Wn2.N6f.NTTy9dq3Y2c.UimrUaFW1R7jD5i', 'Full-stack developer & coffee lover ☕', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
('bob_tech',    'bob@example.com',     '$2b$10$YCVlMK9MJVqKhShOp9Wn2.N6f.NTTy9dq3Y2c.UimrUaFW1R7jD5i', 'Building things with code & curiosity 🚀', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
('carol_ux',    'carol@example.com',   '$2b$10$YCVlMK9MJVqKhShOp9Wn2.N6f.NTTy9dq3Y2c.UimrUaFW1R7jD5i', 'UI/UX Designer | CSS wizard 🎨', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'),
('dave_ml',     'dave@example.com',    '$2b$10$YCVlMK9MJVqKhShOp9Wn2.N6f.NTTy9dq3Y2c.UimrUaFW1R7jD5i', 'ML Engineer | Data storyteller 📊', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave'),
('eve_devops',  'eve@example.com',     '$2b$10$YCVlMK9MJVqKhShOp9Wn2.N6f.NTTy9dq3Y2c.UimrUaFW1R7jD5i', 'DevOps | Kubernetes wrangler 🐳', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve');

-- ============================================================
-- Seed: posts
-- ============================================================
INSERT IGNORE INTO posts (user_id, content, image_url) VALUES
(1, 'Just launched my new project #nodejs #webdev — check it out!', NULL),
(1, 'SQL indexes are underrated. Proper indexing on user_id and created_at made my queries 10x faster. #database #performance', NULL),
(2, 'Docker + Kubernetes = Pure DevOps love ❤️ #devops #kubernetes', NULL),
(2, 'Hot take: CSS Grid is better than Flexbox for 2D layouts. Fight me. #css #webdesign', NULL),
(3, 'Figma + React is the perfect design-to-code pipeline. #ux #reactjs #design', NULL),
(3, 'Accessibility in UI is not optional. Build for everyone. #a11y #webdev', NULL),
(4, 'Neural networks are just fancy function approximators. Change my mind. #machinelearning #ai', NULL),
(4, 'Just finished optimizing a JOIN query that was taking 3 seconds down to 50ms with proper indexes. #sql #optimization', NULL),
(5, 'Terraform state files are sacred. Never touch them manually. #devops #terraform', NULL),
(5, 'Learning #golang this weekend. Coming from Node.js, the concurrency model is mind-blowing.', NULL);

-- ============================================================
-- Seed: follows
-- ============================================================
INSERT IGNORE INTO follows (follower_id, following_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 3), (2, 5),
(3, 1), (3, 2),
(4, 1), (4, 5),
(5, 1), (5, 2), (5, 3);

-- ============================================================
-- Seed: likes
-- ============================================================
INSERT IGNORE INTO likes (user_id, post_id) VALUES
(2, 1), (3, 1), (4, 1), (5, 1),
(1, 2), (3, 2),
(1, 3), (4, 3),
(1, 4), (2, 4), (5, 4),
(2, 5), (4, 5),
(1, 7), (3, 7), (5, 7),
(1, 8), (2, 8), (3, 8);

-- ============================================================
-- Seed: comments
-- ============================================================
INSERT IGNORE INTO comments (post_id, user_id, content) VALUES
(1, 2, 'Congrats on the launch! What tech stack did you use? 🔥'),
(1, 3, 'Love the design! Super clean.'),
(2, 4, 'Totally agree — composite indexes changed my life.'),
(2, 5, 'Great tip! What was your query before and after?'),
(3, 1, 'K8s is love, K8s is life. Also check out Helm charts!'),
(7, 1, 'Technically accurate, but also beautiful when they work 😅'),
(8, 3, 'What indexes did you add specifically?'),
(8, 1, 'Index on (user_id, created_at) for feed queries works great.');

-- ============================================================
-- Seed: hashtags
-- ============================================================
INSERT IGNORE INTO hashtags (name) VALUES
('nodejs'), ('webdev'), ('database'), ('performance'),
('devops'), ('kubernetes'), ('css'), ('webdesign'),
('ux'), ('reactjs'), ('design'), ('a11y'),
('machinelearning'), ('ai'), ('sql'), ('optimization'),
('terraform'), ('golang');

-- ============================================================
-- Seed: post_hashtags
-- ============================================================
-- Post 1: #nodejs #webdev
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 1, id FROM hashtags WHERE name IN ('nodejs','webdev');
-- Post 2: #database #performance
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 2, id FROM hashtags WHERE name IN ('database','performance');
-- Post 3: #devops #kubernetes
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 3, id FROM hashtags WHERE name IN ('devops','kubernetes');
-- Post 4: #css #webdesign
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 4, id FROM hashtags WHERE name IN ('css','webdesign');
-- Post 5: #ux #reactjs #design
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 5, id FROM hashtags WHERE name IN ('ux','reactjs','design');
-- Post 6: #a11y #webdev
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 6, id FROM hashtags WHERE name IN ('a11y','webdev');
-- Post 7: #machinelearning #ai
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 7, id FROM hashtags WHERE name IN ('machinelearning','ai');
-- Post 8: #sql #optimization
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 8, id FROM hashtags WHERE name IN ('sql','optimization');
-- Post 9: #devops #terraform
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 9, id FROM hashtags WHERE name IN ('devops','terraform');
-- Post 10: #golang
INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) SELECT 10, id FROM hashtags WHERE name IN ('golang');

-- ============================================================
-- Seed: notifications
-- ============================================================
INSERT IGNORE INTO notifications (user_id, actor_id, type, reference_id) VALUES
(1, 2, 'like',    1),   -- bob liked alice's post 1
(1, 3, 'like',    1),   -- carol liked alice's post 1
(1, 2, 'comment', 1),   -- bob commented on alice's post 1
(1, 2, 'follow',  2),   -- bob followed alice
(2, 1, 'follow',  1),   -- alice followed bob
(4, 1, 'comment', 2),   -- alice commented on dave's post
(1, 4, 'like',    2);   -- dave liked alice's post 2
