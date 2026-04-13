const { pool } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * @route  GET /api/notifications
 * @desc   Get paginated notifications for the authenticated user
 *         Joins actor user to provide rich notification data.
 * @access Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, offset, page } = getPagination(req.query);

    // pool.query() used (not execute) — mysql2 prepared statements reject LIMIT/OFFSET
    const [notifications] = await pool.query(
      `SELECT 
         n.id, n.type, n.reference_id, n.is_read, n.created_at,
         u.id AS actor_id, u.username AS actor_username, u.profile_picture AS actor_avatar
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?',
      [userId]
    );

    const [[{ unread_count }]] = await pool.execute(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { notifications, unread_count },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/notifications/:id/read
 * @desc   Mark a single notification as read
 * @access Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id);
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notifId]
    );

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/notifications/read-all
 * @desc   Mark ALL unread notifications as read for the authenticated user
 * @access Private
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: `${result.affectedRows} notification(s) marked as read.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/notifications/:id
 * @desc   Delete a specific notification
 * @access Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id);
    const userId = req.user.id;

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, deleteNotification };
