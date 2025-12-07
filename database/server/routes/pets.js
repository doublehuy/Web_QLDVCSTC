const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const petsController = require('../controllers/petsController');
const { authenticateToken } = require('../middleware/auth');

// Cấu hình multer cho upload ảnh thú cưng
const uploadsDir = path.join(__dirname, '..', 'uploads', 'pets');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now();
    cb(null, `${baseName || 'pet'}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Lấy danh sách pets của user hiện tại
router.get('/', authenticateToken, petsController.getUserPets);

// Lấy thông tin pet theo ID
router.get('/:id', authenticateToken, petsController.getPetById);

// Tạo pet mới (có thể kèm file ảnh)
router.post('/', authenticateToken, upload.single('image'), petsController.createPet);

// Cập nhật thông tin pet (có thể kèm file ảnh)
router.put('/:id', authenticateToken, upload.single('image'), petsController.updatePet);

// Xóa pet
router.delete('/:id', authenticateToken, petsController.deletePet);

module.exports = router;
