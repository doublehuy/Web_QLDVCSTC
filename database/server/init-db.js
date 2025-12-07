const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pet_care_management_new',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hoquochuy',
});

async function setupDatabase() {
  let client;

  try {
    // Kiểm tra kết nối
    client = await pool.connect();
    console.log('✅ Kết nối database thành công');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`👤 User: ${process.env.DB_USER}`);

    // Kiểm tra và tạo bảng users
    await setupUsersTable(client);

    // Kiểm tra và tạo các bảng khác nếu cần
    await setupAdditionalTables(client);

    // Tạo user admin mặc định
    await createDefaultAdmin(client);

    console.log('✅ Hoàn thành thiết lập database');

  } catch (error) {
    console.error('❌ Lỗi thiết lập database:', error.message);
    console.error('❌ Chi tiết lỗi:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function setupUsersTable(client) {
  try {
    // Kiểm tra bảng users có tồn tại không
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Bảng users đã tồn tại');
      return;
    }

    console.log('📝 Tạo bảng users...');

    // Tạo bảng users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(50) DEFAULT 'customer',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tạo bảng users thành công');

  } catch (error) {
    console.error('❌ Lỗi tạo bảng users:', error.message);
    throw error;
  }
}

async function setupAdditionalTables(client) {
  try {
    // Tạo bảng pets nếu chưa có
    const petsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'pets'
      );
    `);

    if (!petsTableCheck.rows[0].exists) {
      console.log('📝 Tạo bảng pets...');

      await client.query(`
        CREATE TABLE pets (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          species VARCHAR(100),
          breed VARCHAR(100),
          age INTEGER,
          weight DECIMAL(5,2),
          owner_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Tạo bảng pets thành công');
    } else {
      console.log('✅ Bảng pets đã tồn tại');
    }

  } catch (error) {
    console.error('❌ Lỗi tạo bảng pets:', error.message);
    // Không throw error ở đây vì bảng pets không phải là critical
  }
}

async function createDefaultAdmin(client) {
  try {
    // Kiểm tra xem đã có user admin chưa
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Đã có user admin trong hệ thống');
      return;
    }

    console.log('👑 Tạo user admin mặc định...');

    // Tạo mật khẩu hash
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // Tạo user admin
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `, ['admin@example.com', passwordHash, 'Administrator', 'admin', true]);

    console.log('✅ Tạo user admin mặc định thành công');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mật khẩu: admin123');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Lỗi tạo user admin:', error.message);
    throw error;
  }
}

setupDatabase();
