// appointmentsService.js - Versión con compatibilidad
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5175";

export async function getAppointments() {
  try {
    const response = await fetch(`${API_URL}/appointments`);
    if (!response.ok) throw new Error('Error al obtener citas');
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
    if (!data.success) throw new Error(data.message || 'Error al crear cita');
    return data.appointment;
  } catch (error) {
    console.error("Error al crear cita:", error);
    throw error;
  }
}

export async function updateAppointmentStatus(id, status) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al actualizar estado');
    return data;
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw error;
  }
}

// ✅ Alias para compatibilidad con Dashboard.jsx
export const cancelAppointment = (id) => updateAppointmentStatus(id, 'cancelled');

export async function deleteAppointment(id) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al eliminar');
    return data;
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    throw error;
  }
}