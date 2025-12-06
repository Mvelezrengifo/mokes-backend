const API_URL = "http://localhost:3001";

export async function getPoints() {
  try {
    const res = await fetch(`${API_URL}/points`);
    const data = await res.json();
    return data.success && Array.isArray(data.points) ? data.points : [];
  } catch (err) {
    return [];
  }
}

export async function createPoint(payload) {
  try {
    const res = await fetch(`${API_URL}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.success ? data.point : null;
  } catch (err) {
    return null;
  }
}

export async function deletePoint(id) {
  try {
    const res = await fetch(`${API_URL}/points/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    return false;
  }
}

