import React, { useState, useEffect, useRef, useCallback } from 'react';
import auraService from '../services/auraService';

export default function AuraWidget() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Refs de control
  const wsRef = useRef(null);
  const isConnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const sessionIdRef = useRef('session-' + Date.now());

  // Refs de audio
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isRecordingRef = useRef(false);
  const vadRunningRef = useRef(false);
  const isListeningRef = useRef(false);

  // --- WebSocket (con reconexión controlada y ping/pong) ---
  useEffect(() => {
    const connect = () => {
      if (isConnectingRef.current || wsRef.current) {
        console.log('⏩ Conexión ya iniciada o existente');
        return;
      }

      console.log('🔗 Iniciando conexión WebSocket...');
      isConnectingRef.current = true;

      const ws = new WebSocket('ws://localhost:5175');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket abierto');
        isConnectingRef.current = false;
        setWsConnected(true);
        // Enviar ping cada 30 segundos para mantener la conexión viva
        if (wsRef.current) {
          wsRef.current.pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Mensaje WS:', data);

          if (data.type === 'connected') {
            console.log('✅ Conectado al servidor de Aura');
            if (data.text) speakText(data.text);
          } else if (data.type === 'reply') {
            stopRecording();
            speakText(data.text);
          } else if (data.type === 'pong') {
            // respuesta al ping, ignorar
          } else if (data.type === 'error') {
            console.error('❌ Error del servidor:', data.text);
            speakText('Lo siento, ocurrió un error.');
          }
        } catch (error) {
          console.error('❌ Error al parsear mensaje WS:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket cerrado');
        setWsConnected(false);
        if (wsRef.current?.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
          delete wsRef.current.pingInterval;
        }
        if (isListeningRef.current) stopListening();

        // Reintentar con retraso (solo si no fue cierre manual)
        if (!isConnectingRef.current) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('♻️ Reintentando conexión WebSocket...');
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    };

    connect();

    return () => {
      console.log('🧹 Limpiando WebSocket...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
          delete wsRef.current.pingInterval;
        }
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, []);

  // --- Funciones de audio con RMS ---

  const startListening = useCallback(async () => {
    if (isListeningRef.current) {
      console.warn('⚠️ Ya está escuchando');
      return;
    }

    try {
      console.log('🎤 Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      console.log('🎤 Estado del AudioContext:', audioContext.state);

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🎤 AudioContext reanudado');
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      setIsListening(true);
      isListeningRef.current = true;
      isRecordingRef.current = false;

      vadRunningRef.current = true;
      detectVoiceLoop(analyser);

      console.log('🎤 Micrófono activado, esperando voz...');
    } catch (error) {
      console.error('❌ Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('🛑 Deteniendo escucha...');
    vadRunningRef.current = false;
    isListeningRef.current = false;

    stopRecording();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    setIsListening(false);
    isRecordingRef.current = false;
    console.log('🔇 Escucha detenida');
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      console.log('⏹️ Grabación detenida');
    }
  }, []);

  const detectVoiceLoop = useCallback((analyser) => {
    if (!vadRunningRef.current) {
      console.log('🔄 Bucle VAD detenido');
      return;
    }

    // Usar time domain data para calcular RMS (más robusto)
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Escalamos RMS a un valor más intuitivo (0-1)
    const volume = rms * 10;
    console.log(`🔊 Volumen RMS: ${volume.toFixed(2)}`);

    const VOICE_THRESHOLD = 0.8;
    const SILENCE_TIMEOUT = 2000;

    if (volume > VOICE_THRESHOLD) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;

      if (!isRecordingRef.current && mediaRecorderRef.current) {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start(100);
        isRecordingRef.current = true;
        console.log('🎙️ Voz detectada, grabando...');
      }
    } else {
      if (isRecordingRef.current && mediaRecorderRef.current) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
              isRecordingRef.current = false;
              console.log('⏸️ Silencio, procesando audio...');
              processAudio();
            }
            silenceTimeoutRef.current = null;
          }, SILENCE_TIMEOUT);
        }
      }
    }

    if (vadRunningRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => detectVoiceLoop(analyser));
    }
  }, []);

  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      console.warn('⚠️ No hay chunks de audio');
      return;
    }

    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

    try {
      console.log('📤 Enviando audio a Whisper...');
      const text = await auraService.transcribeAudio(audioFile);
      console.log('📝 Texto transcrito:', text);

      if (text.trim().length === 0) {
        speakText('No entendí lo que dijiste. Intenta de nuevo.');
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'text',
          sessionId: sessionIdRef.current,
          text: text
        }));
      } else {
        console.error('❌ WebSocket no disponible, usando HTTP fallback');
        const response = await auraService.sendCommand(text);
        if (response && response.reply) {
          speakText(response.reply);
        }
      }
    } catch (error) {
      console.error('❌ Error al procesar audio:', error);
      speakText('Lo siento, no pude entender lo que dijiste.');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  }, []);

  const speakText = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.warn('TTS no soportado');
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('🗣️ TTS finalizado');
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
      <button
        onClick={toggleListening}
        disabled={isProcessing || isSpeaking}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isListening ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        } ${isProcessing ? 'animate-pulse' : ''}`}
        title={isListening ? 'Detener escucha' : 'Activar escucha'}
      >
        {isProcessing ? (
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        ) : isSpeaking ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      <div className="text-xs text-white/70 bg-black/30 px-2 py-1 rounded-full">
        {isListening ? '🎤 Escuchando...' : '🔇 Inactivo'}
      </div>
      {!wsConnected && (
        <div className="text-xs text-yellow-400 bg-black/50 px-2 py-1 rounded-full">
          ⚠️ Sin conexión
        </div>
      )}
    </div>
  );
}