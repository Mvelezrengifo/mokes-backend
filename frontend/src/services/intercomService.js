// frontend/src/services/intercomService.js
import { useState, useEffect, useRef, useCallback } from 'react';

// Estados del intercomunicador
const STATES = {
  REPOSO: 'reposo',
  ACTIVADO: 'activado',
  ESCUCHANDO: 'escuchando',
  PROCESANDO: 'procesando',
  RESPONDIENDO: 'respondiendo',
  POST_RESPUESTA: 'post-respuesta'
};

export function useIntercom() {
  const [state, setState] = useState(STATES.REPOSO);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sessionIdRef = useRef(null);

  // Generar ID de sesión único
  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:5175'}/api/mokes-ai/stream`);
    wsRef.current = ws;
    sessionIdRef.current = generateSessionId();

    ws.onopen = () => {
      console.log('WebSocket conectado');
      // Enviar mensaje de inicio
      ws.send(JSON.stringify({
        type: 'start',
        deviceId: 'phone-001',
        sessionId: sessionIdRef.current
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket cerrado');
      setState(STATES.REPOSO);
    };
  }, []);

  // Manejar mensajes del backend
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        console.log('Sesión conectada:', data.sessionId);
        setState(STATES.ACTIVADO);
        playBeep('activation');
        break;

      case 'processing':
        console.log('Procesando...');
        setState(STATES.PROCESANDO);
        playBeep('processing');
        break;

      case 'speak':
        console.log('Recibiendo respuesta de voz');
        setState(STATES.RESPONDIENDO);
        // Reproducir audio TTS
        playAudioResponse(data.audio);
        break;

      case 'response_end':
        console.log('Respuesta finalizada');
        setState(STATES.POST_RESPUESTA);
        // Reactivar escucha después de un breve retraso
        setTimeout(() => {
          setState(STATES.ESCUCHANDO);
        }, 1500);
        break;

      case 'error':
        console.error('Error del backend:', data.message);
        playBeep('error');
        setState(STATES.REPOSO);
        break;

      default:
        console.log('Mensaje no reconocido:', data);
    }
  };

  // Reproducir beep (sonido corto)
  const playBeep = (type) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'activation' ? 880 : type === 'processing' ? 660 : 440;
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  // Reproducir audio de respuesta
  const playAudioResponse = (audioBase64) => {
    try {
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        // Cuando termina la respuesta, notificar al backend
        wsRef.current.send(JSON.stringify({
          type: 'resume',
          sessionId: sessionIdRef.current
        }));
      };
      audio.play();
    } catch (error) {
      console.error('Error al reproducir audio:', error);
    }
  };

  // Inicializar audio (micrófono)
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);

      // Conectar WebSocket automáticamente
      connectWebSocket();

      // Iniciar detección de Wake Word
      detectWakeWord();

      return true;
    } catch (error) {
      console.error('Error al inicializar audio:', error);
      return false;
    }
  };

  // Detectar Wake Word ("Aura on")
  const detectWakeWord = () => {
    // Aquí se integraría Porcupine o un modelo similar
    // Por simplicidad, usamos un placeholder
    console.log('Escuchando Wake Word...');
    // Simulación: después de 2 segundos, activar
    setTimeout(() => {
      if (state === STATES.REPOSO) {
        console.log('Wake Word detectado!');
        setState(STATES.ACTIVADO);
        // Iniciar escucha activa
        startListening();
      }
    }, 5000);
  };

  // Iniciar escucha activa
  const startListening = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    setState(STATES.ESCUCHANDO);
    console.log('Escuchando...');

    // Función para procesar audio y detectar silencio
    const processAudio = () => {
      if (state !== STATES.ESCUCHANDO) return;

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      // Calcular RMS (volumen)
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const value = (dataArrayRef.current[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);
      const volume = rms * 100;

      // Detectar voz (umbral ajustable)
      const isSpeech = volume > 5;

      if (isSpeech) {
        // Reiniciar timeout de silencio
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // Enviar frame de audio si estamos en estado ESCUCHANDO
        if (state === STATES.ESCUCHANDO) {
          // Aquí se enviaría el audio al backend
          // Por simplicidad, solo simulamos el envío
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            sessionId: sessionIdRef.current,
            frame: 'base64-encoded-audio-chunk', // En la práctica, codificar el buffer en base64
            vad: true,
            timestamp: Date.now()
          }));
        }
      } else {
        // Si no hay voz, esperar 1.5 segundos de silencio para enviar "pause"
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            // Enviar mensaje de pausa al backend
            wsRef.current.send(JSON.stringify({
              type: 'pause',
              sessionId: sessionIdRef.current
            }));
            setState(STATES.PROCESANDO);
            silenceTimeoutRef.current = null;
          }, 1500);
        }
      }

      requestAnimationFrame(processAudio);
    };

    processAudio();
  };

  // Función para desactivar (Aura off)
  const deactivate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end',
        sessionId: sessionIdRef.current
      }));
    }
    setState(STATES.REPOSO);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    state,
    isProcessing,
    initAudio,
    deactivate,
    STATES
  };
}