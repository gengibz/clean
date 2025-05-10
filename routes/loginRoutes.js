const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM cho WHERE usr = '${username}' AND psw = '${password}'
    `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({ success: true, user: { id: user.ind, name: user.nom, username: user.usr } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;