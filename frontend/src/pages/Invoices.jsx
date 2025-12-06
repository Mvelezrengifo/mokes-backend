import React, { useEffect, useState } from "react";
import { getInvoices } from "../services/invoicesService";
import jsPDF from "jspdf";

export default function Invoices() {
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchInvoices();
}, []);

const fetchInvoices = async () => {
  setLoading(true);
  try {
    const data = await getInvoices();
    setInvoices(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error fetch invoices:", err);
    setInvoices([]);
  } finally {
    setLoading(false);
  }
};

const parseItems = (items) => {
  if (!items) return [];
  try {
    const parsedOnce = typeof items === "string" ? JSON.parse(items) : items;
    const parsedTwice = parsedOnce && typeof parsedOnce === "string" ? JSON.parse(parsedOnce) : parsedOnce;
    return Array.isArray(parsedTwice) ? parsedTwice : [];
  } catch {
    return [];
  }
};

const toMoney = (n) => (Number(n || 0)).toFixed(2);
const safeName = (s) => (s || "Paciente").replace(/\s+/g, "_").replace(/[^\w_]/g, "");

const fetchLogoDataURL = async () => {
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const handleDownloadPDF = async (inv) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await fetchLogoDataURL();
  if (logo) doc.addImage(logo, "PNG", 15, 10, 22, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("The One Medical Spa", 42, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Factura #${inv.id}`, 15, 40);
  doc.text(`Paciente: ${inv.patient_name || "Desconocido"}`, 15, 47);
  doc.text(`Fecha: ${inv.date}`, 15, 54);

  const items = parseItems(inv.items);
  const headerY = 70;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, headerY, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Artículo", 18, headerY + 6);
  doc.text("Cantidad", 120, headerY + 6);
  doc.text("Precio", 145, headerY + 6);
  doc.text("Subtotal", 170, headerY + 6);
  doc.setFont("helvetica", "normal");

  let y = headerY + 14;
  items.forEach((i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.price) || 0;
    const subtotal = qty * price;
    doc.text(String(i.name || "-"), 18, y);
    doc.text(String(qty), 120, y);
    doc.text(`$${toMoney(price)}`, 145, y);
    doc.text(`$${toMoney(subtotal)}`, 170, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  const total = Number(inv.total) || items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const totalY = Math.min(y + 10, 280);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${toMoney(total)}`, 170, totalY, { align: "right" });

  const fileName = `${safeName(inv.patient_name)}_factura_${inv.id}.pdf`;
  doc.save(fileName);
};

return (
  <div className="content">
    <h2>Facturas</h2>
    {loading ? (
      <p>Cargando facturas...</p>
    ) : invoices.length === 0 ? (
      <p>No hay facturas disponibles</p>
    ) : (
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Paciente</th>
            <th>Artículos</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const items = parseItems(inv.items);
            return (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.patient_name || "Sin nombre"}</td>
                <td>
                  {items.length > 0
                    ? items.map((i) => `${i.name} (${i.quantity})`).join(", ")
                    : "Sin items"}
                </td>
                <td>{inv.date}</td>
                <td>${inv.total}</td>
                <td>
                  <button onClick={() => handleDownloadPDF(inv)}>PDF</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);
}