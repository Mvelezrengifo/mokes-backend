import React, { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function InvoicesMinimal() {
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchInvoices();
}, []);

const fetchInvoices = async () => {
setLoading(true);
try {
const res = await fetch(`${API_URL}/invoices`);
const data = await res.json();
console.log("DATA BACKEND:", data);
setInvoices(Array.isArray(data.facturas) ? data.facturas : []);
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
const parsedTwice = typeof parsedOnce === "string" ? JSON.parse(parsedOnce) : parsedOnce;
return Array.isArray(parsedTwice) ? parsedTwice : [];
} catch {
return [];
}
};

const handleDownloadPDF = (id) => {
alert(`Simulación: se descargaría factura_${id}.pdf`);
};

return (
<div style={{ padding: "20px" }}> <h2>Facturas</h2>
{loading ? ( <p>Cargando facturas...</p>
) : invoices.length === 0 ? ( <p>No hay facturas disponibles</p>
) : ( <table border="1" cellPadding="5"> <thead> <tr> <th>ID</th> <th>Paciente</th> <th>Artículos</th> <th>Fecha</th> <th>Total</th> <th>Acciones</th> </tr> </thead> <tbody>
{invoices.map((inv) => {
const items = parseItems(inv.artículos);
return ( <tr key={inv.id}> <td>{inv.id}</td> <td>{inv.nombre_paciente || "Sin nombre"}</td> <td>
{items.length > 0
? items.map((i, idx) => `${i.nombre} (${i.cantidad})`).join(", ")
: "Sin items"} </td> <td>{inv.fecha}</td> <td>${inv.total}</td> <td>
<button onClick={() => handleDownloadPDF(inv.id)}>PDF</button> </td> </tr>
);
})} </tbody> </table>
)} </div>
);
}
