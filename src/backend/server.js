const express = require("express");
const cors = require("cors");

const patientsRouter = require("./routes/patients");
const appointmentsRouter = require("./routes/appointments");
const inventoryRouter = require("./routes/inventory");
const authRouter = require("./routes/auth");
const invoicesRouter = require("./routes/invoices");
const patientHistoryRouter = require("./routes/patientHistory");
const medicalRecordsRouter = require("./routes/medicalRecords");
const pointsRouter = require("./routes/points");

const app = express();

// 🔥 CORS configurado para Vite (React en localhost:5173)
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// Middleware para manejar preflight
app.options(/.*/, cors());

app.use(express.json());

// Rutas
app.use("/patients", patientsRouter);
app.use("/appointments", appointmentsRouter);
app.use("/inventory", inventoryRouter);
app.use("/auth", authRouter);
app.use("/invoices", invoicesRouter);
app.use("/patient-history", patientHistoryRouter);
app.use("/medical-records", medicalRecordsRouter);
app.use("/points", pointsRouter);

console.log("Backend inicializado correctamente");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
