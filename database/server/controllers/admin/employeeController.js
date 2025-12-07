const pool = require('../../config/database');

// Lấy danh sách nhân viên
exports.getEmployees = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        full_name as name,
        email,
        phone,
        specialization
      FROM users 
      WHERE role = 'employee'
      ORDER BY full_name
    `;
    
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
