// auraService.js - Comunicación con el backend de Aura
// Usa Web Speech API directamente + integración con backend para audio

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5175';

// Verificar disponibilidad de Web Speech API
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognitionAPI;

// ============================================
// 🎤 RECONOCIMIENTO DE VOZ (Speech-to-Text)
// ============================================

/**
 * Usa la Web Speech API del navegador para escuchar y transcribir en tiempo real
 * @returns {Promise<string>} Texto transcrito
 */
export async function listenAndTranscribe() {
  if (!isSpeechSupported) {
    throw new Error('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.');
  }

  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log('🎤 Texto transcrito:', text);
      resolve(text);
    };

    recognition.onerror = (event) => {
      console.error('❌ Error de reconocimiento:', event.error);
      reject(new Error(`Error de reconocimiento: ${event.error}`));
    };

    recognition.onend = () => {
      console.log('🎤 Reconocimiento finalizado');
    };

    recognition.start();
    console.log('🎤 Escuchando...');
  });
}

/**
 * Envía un archivo de audio al backend para transcribirlo con Whisper
 * @param {File} audioFile - Archivo de audio (mp3, wav, webm, etc.)
 * @returns {Promise<string>} Texto transcrito
 */
export async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await fetch(`${API_URL}/api/mokes-ai/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error al transcribir: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}

/**
 * Envía un archivo de audio al backend como comando de voz (procesamiento completo)
 * @param {File} audioFile - Archivo de audio grabado
 * @returns {Promise<Object>} Respuesta del backend con la acción y reply
 */
export async function sendAudio(audioFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await fetch(`${API_URL}/api/mokes-ai/voice-command`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el servidor: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// ============================================
// 💬 ENVÍO DE COMANDOS DE TEXTO
// ============================================

/**
 * Envía un comando de texto al backend para procesarlo con Aura
 * @param {string} text - Texto del comando
 * @returns {Promise<Object>} Respuesta del backend con action, parameters y reply
 */
export async function sendCommand(text) {
  const response = await fetch(`${API_URL}/api/mokes-ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// ============================================
// 🔊 SÍNTESIS DE VOZ (Text-to-Speech)
// ============================================

/**
 * Reproduce un texto en voz usando la Web Speech API del navegador
 * @param {string} text - Texto a reproducir
 */
export async function speakResponse(text) {
  if (!window.speechSynthesis) {
    console.warn('⚠️ SpeechSynthesis no soportado en este navegador');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  // Intentar usar una voz en español si está disponible
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  window.speechSynthesis.cancel(); // Detener cualquier voz anterior
  window.speechSynthesis.speak(utterance);
}

// ============================================
// 📦 EXPORTS (Named + Default para compatibilidad)
// ============================================

// Exportación por defecto (objeto con todas las funciones)
export default {
  listenAndTranscribe,
  transcribeAudio,
  sendAudio,
  sendCommand,
  speakResponse,
  isSupported: isSpeechSupported
};