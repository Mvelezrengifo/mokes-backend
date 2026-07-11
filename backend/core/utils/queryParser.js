// backend/core/utils/queryParser.js
// Parser simple para consultas comunes (sin OpenAI)
// Se puede mejorar con una IA más adelante.

function parseNaturalLanguage(query) {
  const lower = query.toLowerCase();

  // Detectar intención "agenda de mañana / hoy / [fecha]"
  if (lower.includes('mañana') || lower.includes('pasado mañana')) {
    const date = new Date();
    if (lower.includes('pasado mañana')) {
      date.setDate(date.getDate() + 2);
    } else {
      date.setDate(date.getDate() + 1);
    }
    return {
      type: 'agenda_query',
      date: date.toISOString().split('T')[0],
    };
  }

  if (lower.includes('hoy')) {
    return {
      type: 'agenda_query',
      date: new Date().toISOString().split('T')[0],
    };
  }

  // Detectar "citas de [día] [mes] [año]"? (podríamos implementar con regex)
  const dateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch) {
    return {
      type: 'agenda_query',
      date: dateMatch[1],
    };
  }

  // Si no se detecta nada, devolver null para que OpenAI lo maneje
  return null;
}

module.exports = { parseNaturalLanguage };