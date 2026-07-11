// backend/routes/mokesAi.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

const mokesAiController = require('../controllers/mokesAiController');
const transcribeController = require('../controllers/transcribeController');
const vapiWebhookController = require('../controllers/vapiWebhookController');

const upload = multer({ storage: multer.memoryStorage() });

// =========================================
// 🎙️ ENDPOINT PARA TRANSCRIPCIÓN (proxy de Whisper)
// =========================================
router.post('/transcribe', upload.single('audio'), transcribeController.transcribeAudio);

// =========================================
// 💬 ENDPOINT PARA COMANDOS DE TEXTO
// =========================================
router.post('/command', mokesAiController.handleCommand);

// =========================================
// 📞 ENDPOINT PARA WEBHOOKS DE VAPI (llamadas telefónicas)
// =========================================
router.post('/vapi-webhook', express.json(), vapiWebhookController.handleVapiWebhook);

// =========================================
// 🏥 HEALTH CHECK
// =========================================
router.get('/health', (req, res) => {
  res.json({ status: 'Mokes AI Assistant OK', timestamp: new Date().toISOString() });
});

// ✅ Exportar el router correctamente
module.exports = router;