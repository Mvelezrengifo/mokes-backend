// =========================================
// 🔥 CONFIGURACIÓN DE ENTORNO (FORZADA)
// =========================================
const path = require('path');
// Forzar la carga del .env desde la carpeta actual (backend/)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// 🔍 Diagnóstico rápido para verificar que se cargó
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY NO ENCONTRADA. Revisa que el archivo .env esté en la raíz de backend/");
} else {
  console.log("✅ OPENAI_API_KEY cargada correctamente desde", path.resolve(__dirname, '.env'));
}

// =========================================
// 📦 IMPORTS PRINCIPALES
// =========================================
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { handleTextMessage } = require('./utils/webSocketHandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// =========================================
// ⚙️ MIDDLEWARE
// =========================================
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// =========================================
// 🛣️ RUTAS EXISTENTES
// =========================================
const patientsRouter = require("./routes/patients");
const appointmentsRouter = require("./routes/appointments");
const inventoryRouter = require("./routes/inventory");
const authRouter = require("./routes/auth");
const invoicesRouter = require("./routes/invoices");
const patientHistoryRouter = require("./routes/patientHistory");
const medicalRecordsRouter = require("./routes/medicalRecords");
const pointsRouter = require("./routes/points");
const mokesAiRoutes = require('./routes/mokesAi');

app.use("/patients", patientsRouter);
app.use("/appointments", appointmentsRouter);
app.use("/inventory", inventoryRouter);
app.use("/auth", authRouter);
app.use("/invoices", invoicesRouter);
app.use("/patient-history", patientHistoryRouter);
app.use("/medical-records", medicalRecordsRouter);
app.use("/points", pointsRouter);
app.use('/api/mokes-ai', mokesAiRoutes);

// =========================================
// 🏥 HEALTH CHECK
// =========================================
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend de MokesClinic volando 🚀" });
});

// =========================================
// 🔌 WEBSOCKET: CONEXIONES ENTRANTES
// =========================================
wss.on('connection', (ws) => {
  console.log('🔗 Cliente WebSocket conectado');

  // Enviar saludo personalizado de Aura
  ws.send(JSON.stringify({
    type: 'connected',
    text: '¡Hola Mauro! Soy Aura, tu asistente virtual. Estoy lista para ayudarte con lo que necesites. 😊'
  }));

  ws.on('message', (message) => {
    handleTextMessage(ws, message);
  });

  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
  });

  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
  });
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================
const PORT = process.env.PORT || 5175;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket y HTTP en http://localhost:${PORT}`);
});