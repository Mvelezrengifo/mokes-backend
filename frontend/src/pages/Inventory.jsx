import React, { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/inventoryService";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", quantity: 0, price: 0 });
  const [editingId, setEditingId] = useState(null);

  // Cargar inventario
  async function loadInventory() {
    const data = await getProducts();
    setProducts(data);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  // Manejar cambios del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convertimos quantity y price a número
    setForm({
      ...form,
      [name]: name === "quantity" || name === "price" ? Number(value) : value,
    });
  };

  // Crear o actualizar producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.quantity <= 0 || form.price <= 0) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    if (editingId) {
      await updateProduct(editingId, form);
    } else {
      await createProduct(form);
    }

    setForm({ name: "", description: "", quantity: 0, price: 0 });
    setEditingId(null);
    loadInventory();
  };

  // Preparar edición
  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      quantity: product.quantity,
      price: product.price,
    });
  };

  // Eliminar producto
  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar producto ${product.name}?`)) return;
    await deleteProduct(product.id);
    loadInventory();
  };

  return (
    <div>
      <h1>Inventario</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="description"
          placeholder="Descripción"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="quantity"
          type="number"
          placeholder="Cantidad"
          value={form.quantity}
          onChange={handleChange}
        />
        <input
          name="price"
          type="number"
          placeholder="Precio"
          value={form.price}
          onChange={handleChange}
        />
        <button type="submit">{editingId ? "Actualizar" : "Crear"}</button>
      </form>

      <table border="1" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.quantity}</td>
              <td>{p.price}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Editar</button>
                <button onClick={() => handleDelete(p)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;
