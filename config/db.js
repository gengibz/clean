// db.js
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'D1P30.37.9i',
  server: '82.223.100.177',
  database: 'Dipesa2',
  options: { encrypt: false, trustServerCertificate: true }
};

const getConnection = async () => {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    throw new Error('❌ Error de conexión SQL: ' + err.message);
  }
};

module.exports = { sql, getConnection };
