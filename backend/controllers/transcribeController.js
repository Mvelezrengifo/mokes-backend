// backend/controllers/transcribeController.js
const { getClient } = require('../utils/openaiService');
const { Readable } = require('stream');

exports.transcribeAudio = async (req, res) => {
  try {
    const client = getClient();  // ✅ Esto garantiza que la key esté cargada

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de audio' });
    }

    const audioBuffer = req.file.buffer;

    // ✅ CORRECCIÓN: Usar Readable.from() en lugar de new File()
    // Whisper necesita saber el formato a través de la extensión del path
    const audioStream = Readable.from(audioBuffer);
    audioStream.path = 'recording.webm'; // Extensión .webm para que Whisper lo reconozca

    const transcription = await client.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'es',
      response_format: 'text',
    });

    res.json({ text: transcription });
  } catch (error) {
    console.error('Error en transcribeAudio:', error);
    res.status(500).json({ error: error.message || 'Error al transcribir el audio' });
  }
};