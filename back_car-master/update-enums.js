const mysql = require('mysql2/promise');

async function updateCarEnums() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'car_rental'
  });

  try {
    // อัปเดต car_type
    await connection.execute(`
      ALTER TABLE cars 
      MODIFY car_type ENUM('sedan','suv','hatchback','pickup','van','luxury','motorbike') 
      NOT NULL DEFAULT 'sedan';
    `);

    // อัปเดต transmission
    await connection.execute(`
      ALTER TABLE cars 
      MODIFY transmission ENUM('auto','manual') 
      NOT NULL DEFAULT 'auto';
    `);

    // อัปเดต fuel_type
    await connection.execute(`
      ALTER TABLE cars 
      MODIFY fuel_type ENUM('gasoline','diesel','hybrid','electric') 
      NOT NULL DEFAULT 'gasoline';
    `);

    console.log('ENUM columns updated successfully.');
  } catch (err) {
    console.error('Error updating ENUMs:', err);
  } finally {
    await connection.end();
  }
}

updateCarEnums();
