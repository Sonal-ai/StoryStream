const express = require('express');
const router = express.Router();
const {
  getNotifications, markAsRead, markAllRead, deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

router.get('/',                  getNotifications);    // GET  /api/notifications
router.put('/read-all',          markAllRead);         // PUT  /api/notifications/read-all
router.put('/:id/read',          markAsRead);          // PUT  /api/notifications/:id/read
router.delete('/:id',            deleteNotification);  // DELETE /api/notifications/:id

module.exports = router;
