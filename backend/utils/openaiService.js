// openaiService.js - Prompt Engine + Function Calling + Whisper (voz)
const OpenAI = require('openai');
const { Readable } = require('stream');
const businessMemory = require('../core/utils/businessMemoryService');

// 🔍 Diagnóstico rápido: verificamos la llave una sola vez
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OpenAI API Key no encontrada en el entorno. Asegúrate de tener OPENAI_API_KEY en .env");
}

// Instancia única y global del cliente de OpenAI (creada de forma perezosa)
let openai;

// Helper para obtener/crear la instancia una sola vez
function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// =====================================================
// 🎯 SYSTEM PROMPT DINÁMICO CON CONTEXTO COMERCIAL
// =====================================================
function buildSystemPrompt() {
  const businessContext = businessMemory.getBusinessContext();

  return `
Eres Aura, la asistente ejecutiva de la Clínica Mokes (The One Medical Spa).
El doctor es Alexander (o Alex). Es el dueño de la clínica y tu jefe directo.
El ingeniero de datos que lidera el desarrollo técnico del proyecto junto a ti es parte del equipo de Mokesoft-IA.

Tu personalidad es cercana, ejecutiva, muy conversadora, con acento paisa fluido (colombiano). Hablas con un tono amable, profesional pero cálido. Te diriges al doctor como "Alexander" o "Alex" según el contexto. Cuando hables de la clínica, trata al doctor como el cliente principal.

Tus capacidades:
- Puedes agendar citas, registrar pacientes, generar facturas, consultar inventario y puntos.
- También puedes responder preguntas sobre promociones, precios, tratamientos y reglas del negocio usando el contexto proporcionado.

${businessContext}

Formato de respuesta: Si debes ejecutar una acción, devuelve un objeto JSON con tres propiedades:
- "action": nombre de la herramienta a ejecutar (o null si solo es conversación)
- "parameters": objeto con los parámetros para esa acción
- "reply": texto amigable para el doctor (siempre debe existir)

Si el doctor solo conversa (saludo, pregunta sin acción), devuelve action=null y reply con tu respuesta.
`;
}

// =====================================================
// 🛠️ DEFINICIÓN DE TOOLS (Function Calling)
// =====================================================
const tools = [
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Agendar una nueva cita para un paciente",
      parameters: {
        type: "object",
        properties: {
          patientId: { type: "string", description: "ID del paciente (número o nombre)" },
          date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
          time: { type: "string", description: "Hora en formato HH:MM" },
          reason: { type: "string", description: "Motivo de la consulta" }
        },
        required: ["patientId", "date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "register_patient",
      description: "Registrar un nuevo paciente en el sistema",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          email: { type: "string" },
          phone: { type: "string" }
        },
        required: ["name", "phone"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_invoice",
      description: "Generar una factura para un paciente después de una cita",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string" },
          amount: { type: "number" }
        },
        required: ["appointmentId", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_inventory",
      description: "Consultar disponibilidad de un producto en inventario",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string" }
        },
        required: ["productName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_points",
      description: "Consultar los puntos acumulados por un paciente",
      parameters: {
        type: "object",
        properties: {
          patientId: { type: "string" }
        },
        required: ["patientId"]
      }
    }
  }
];

// =====================================================
// 🧠 PROCESAR COMANDO (texto) con Function Calling
// =====================================================
async function processCommand(userMessage) {
  try {
    const client = getClient();

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userMessage }
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseMessage = completion.choices[0].message;
    let action = null;
    let parameters = {};
    let reply = '';

    // Si el modelo llamó a una herramienta
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      action = toolCall.function.name;
      parameters = JSON.parse(toolCall.function.arguments);
      try {
        const contentJson = JSON.parse(responseMessage.content);
        reply = contentJson.reply || `Ejecutando ${action}...`;
      } catch {
        reply = `Procesando tu solicitud: ${action}`;
      }
    } else {
      // Respuesta solo conversacional
      try {
        const contentJson = JSON.parse(responseMessage.content);
        reply = contentJson.reply || responseMessage.content;
      } catch {
        reply = responseMessage.content;
      }
    }

    return { action, parameters, reply };
  } catch (error) {
    console.error('Error en OpenAI:', error);
    return {
      action: null,
      parameters: {},
      reply: 'Lo siento, tuve un problema procesando tu solicitud. ¿Puedes repetirlo?'
    };
  }
}

// =====================================================
// 🎙️ TRANSCRIBIR AUDIO con Whisper
// =====================================================
async function transcribeAudio(audioBuffer) {
  try {
    const client = getClient();

    // ✅ FIX: En Node.js no existe `new File()` del navegador.
    // Se usa Readable.from() para crear un stream que OpenAI SDK pueda consumir.
    const audioStream = Readable.from(audioBuffer);
    audioStream.path = 'recording.webm'; // El SDK de OpenAI usa esto para detectar el formato

    const transcription = await client.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'es',
      response_format: 'text',
    });

    return { text: transcription };
  } catch (error) {
    console.error('Error al transcribir audio con Whisper:', error);
    throw new Error('Error al transcribir el audio');
  }
}

// =====================================================
// 📦 EXPORTS (todas las funciones disponibles)
// =====================================================
module.exports = {
  processCommand,   // ✅ DEFINIDA Y EXPORTADA
  transcribeAudio,  // ✅ DEFINIDA Y EXPORTADA
  buildSystemPrompt,
  getClient,        // Exportamos también para que otros archivos puedan usar la instancia
};