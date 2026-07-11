const express = require('express');
const cors = require('cors');
const db = require('./db/database'); // Tu conexión a SQLite/Atlas
const invoiceRoutes = require('./routes/invoices');
// const appointmentRoutes = require('./routes/appointments'); // Para la IA después

const app = express();
const PORT = 5174; // Mantengamos el que ya tienes libre

app.use(cors());
app.use(express.json());

// Rutas que consumirá el Frontend y luego la IA
app.use('/invoices', invoiceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 API de MokesClinic lista en http://localhost:${PORT}`);
});
