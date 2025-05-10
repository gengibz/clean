// routes/vehiculosRoutes.js
const express = require('express');
const router = express.Router();
const { listarVehiculos } = require('../controllers/vehiculosController');

router.get('/vehiculos', listarVehiculos);

module.exports = router;