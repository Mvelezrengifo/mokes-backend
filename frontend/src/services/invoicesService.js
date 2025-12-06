const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getInvoices() {
  try {
    const res = await fetch(`${API_URL}/invoices`);
    const data = await res.json();
    return data.success && Array.isArray(data.invoices) ? data.invoices : [];
  } catch (err) {
    console.error("Error al obtener facturas:", err);
    return [];
  }
}

export async function createInvoice(payload) {
  try {
    const res = await fetch(`${API_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.success ? data.invoice : null;
  } catch (err) {
    console.error("Error al crear factura:", err);
    return null;
  }
}

export async function deleteInvoice(id) {
  try {
    const res = await fetch(`${API_URL}/invoices/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error al eliminar factura:", err);
    return false;
  }
}
