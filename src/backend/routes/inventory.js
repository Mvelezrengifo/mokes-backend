const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

// Obtener inventario
router.get("/", inventoryController.getInventory);

// Agregar producto
router.post("/", inventoryController.addItem);

// Editar producto
router.put("/:id", inventoryController.updateStock);

// Eliminar producto
router.delete("/:id", inventoryController.deleteItem);

module.exports = router;
