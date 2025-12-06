const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getAppointments() {
  try {
    const response = await fetch(`${API_URL}/appointments`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener citas:", error);
    return [];
  }
}

export async function createAppointment(payload) {
  try {
    const response = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data.success ? data.appointment : null;
  } catch (error) {
    console.error("Error al crear cita:", error);
    return null;
  }
}

export async function cancelAppointment(id) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    return false;
  }
}
