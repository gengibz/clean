const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
const loginRoutes = require('./routes/loginRoutes');
const vehiculosRoutes = require('./routes/vehiculosRoutes');
app.use('/api', loginRoutes);
app.use('/api', vehiculosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
