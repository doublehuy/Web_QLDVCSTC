const pool = require('../config/database');

// Lấy danh sách pets của user hiện tại
const getUserPets = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, species, breed, age, weight, color, gender, medical_notes,
              image_url, created_at, updated_at, is_active
       FROM pets
       WHERE owner_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách pets:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách pets'
    });
  }
};

// Lấy thông tin pet theo ID
const getPetById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, species, breed, age, weight, color, gender, medical_notes,
              image_url, created_at, updated_at, is_active
       FROM pets
       WHERE id = $1 AND owner_id = $2 AND is_active = true`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thú cưng'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin pet'
    });
  }
};

// Tạo pet mới
const createPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, species, breed, age, weight, color, gender, medical_notes, image_url } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Tên và loài là bắt buộc'
      });
    }

    // Nếu có file upload từ multer thì ưu tiên dùng
    let finalImageUrl = image_url || null;
    if (req.file) {
      // Đường dẫn public để client truy cập (phục vụ qua /uploads)
      const relativePath = `/uploads/pets/${req.file.filename}`;
      finalImageUrl = relativePath;
    }

    const result = await pool.query(
      `INSERT INTO pets (owner_id, name, species, breed, age, weight, color, gender, medical_notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, species, breed, age, weight, color, gender, medical_notes, image_url, created_at`,
      [userId, name, species, breed, age, weight, color, gender || 'unknown', medical_notes, finalImageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo thú cưng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi tạo pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo pet'
    });
  }
};

// Cập nhật thông tin pet
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, species, breed, age, weight, color, gender, medical_notes, image_url } = req.body;

    let finalImageUrl = image_url || null;
    if (req.file) {
      const relativePath = `/uploads/pets/${req.file.filename}`;
      finalImageUrl = relativePath;
    }

    const result = await pool.query(
      `UPDATE pets
       SET name = $1, species = $2, breed = $3, age = $4, weight = $5,
           color = $6, gender = $7, medical_notes = $8, image_url = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND owner_id = $11 AND is_active = true
       RETURNING id, name, species, breed, age, weight, color, gender, medical_notes, image_url, updated_at`,
      [name, species, breed, age, weight, color, gender, medical_notes, finalImageUrl, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng để cập nhật'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin thú cưng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật pet'
    });
  }
};

// Xóa pet (soft delete)
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE pets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng để xóa'
      });
    }

    res.json({
      success: true,
      message: 'Xóa thú cưng thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa pet:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa pet'
    });
  }
};

module.exports = {
  getUserPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
};
