const pool = require('../config/database');

const notificationController = {
  // Tạo thông báo mới
  createNotification: async (notificationData, client = pool) => {
    try {
      const {
        receiver_type,
        receiver_id,
        title,
        message,
        type = 'info',
        user_id = null
      } = notificationData;

      const query = `
        INSERT INTO notifications (receiver_type, receiver_id, user_id, title, message, type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;

      const values = [receiver_type, receiver_id, user_id, title, message, type];

      const result = await client.query(query, values);
      const inserted = result.rows[0];

      if (global.io) {
        const room = `${receiver_type}_${receiver_id}`;
        global.io.to(room).emit('new_notification', {
          id: inserted.id,
          title,
          message,
          type,
          receiver_type,
          receiver_id,
          created_at: inserted.created_at
        });
      }

      return inserted.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Lấy thông báo theo người dùng (khách hàng)
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
        SELECT * FROM notifications
        WHERE receiver_type = 'user' AND receiver_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query, [userId]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
    }
  },

  // Đánh dấu đã đọc
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1 AND receiver_type = 'user' AND receiver_id = $2`,
        [id, userId]
      );

      res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái' });
    }
  }
};

module.exports = notificationController;
