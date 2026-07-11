const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5175";

export async function getPatients() {
  try {
    const response = await fetch(`${API_URL}/patients`);
    const data = await response.json();
    // Asegurar siempre un arreglo
    return data.success && Array.isArray(data.patients) ? data.patients : [];
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }
}

export async function createPatient(payload) {
  try {
    const response = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data.success ? data.patient : null;
  } catch (error) {
    console.error("Error al crear paciente:", error);
    return null;
  }
}

export async function getPatientHistory() {
  try {
    const res = await fetch(`${API_URL}/patient-history`);
    const data = await res.json();
    return data.success && Array.isArray(data.entries) ? data.entries : [];
  } catch (error) {
    console.error("Error al obtener historial de pacientes:", error);
    return [];
  }
}

export async function getPatientHistoryByDate(date) {
  try {
    const res = await fetch(`${API_URL}/patient-history/date/${date}`);
    const data = await res.json();
    return data.success ? data.snapshot : null;
  } catch (error) {
    console.error("Error al obtener historial por fecha:", error);
    return null;
  }
}

export async function savePatientHistory() {
  try {
    const res = await fetch(`${API_URL}/patient-history/save`, { method: "POST" });
    const data = await res.json();
    return data.success ? data.entry : null;
  } catch (error) {
    console.error("Error al guardar historial del día:", error);
    return null;
  }
}

export async function deletePatientHistory(id) {
  try {
    const res = await fetch(`${API_URL}/patient-history/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success || false;
  } catch (error) {
    console.error("Error al eliminar historial del día:", error);
    return false;
  }
}

export async function deletePatient(id) {
  try {
    const res = await fetch(`${API_URL}/patients/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success || false;
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    return false;
  }
}
