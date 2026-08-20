import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { Product } from "../../types/api";
import { formatPYG } from "../../utils";

async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get("/products");
  return data;
}

const emptyForm = { name: "", price: "", stock: "", low_stock_threshold: "5" };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        low_stock_threshold: parseInt(form.low_stock_threshold, 10),
      };
      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, body);
      }
      return api.post("/products", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.put(`/products/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      low_stock_threshold: String(product.low_stock_threshold),
    });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Cantina</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {products?.length || 0} productos registrados
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
          Nuevo producto
        </Button>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Producto</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Precio</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Stock</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {products.map((p) => {
                const lowStock = p.stock < p.low_stock_threshold;
                return (
                  <tr key={p.id} className="hover:bg-surface-container-higher/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-on-surface tabular-nums">{formatPYG(p.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold tabular-nums ${lowStock ? "text-error" : "text-on-surface"}`}>
                        {p.stock}
                      </span>
                      {lowStock && (
                        <span className="ml-2 text-[11px] font-medium text-error bg-error/10 px-2 py-0.5 rounded-full">
                          Stock bajo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: p.id, is_active: !p.is_active })}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                          p.is_active ? "bg-secondary/10 text-secondary" : "bg-surface-container-higher text-on-surface-variant"
                        }`}
                      >
                        {p.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-container-higher flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-on-surface-variant" />
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">No hay productos registrados todavía</p>
            <p className="text-xs text-on-surface-variant mb-4">Agregá el primer producto de cantina para empezar a venderlo.</p>
            <Button variant="primary" size="sm" onClick={openCreate}>
              Agregar producto
            </Button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? "Editar producto" : "Nuevo producto"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Precio (₲)" type="number" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Stock" type="number" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          <Input
            label="Umbral de stock bajo"
            type="number"
            step="1"
            value={form.low_stock_threshold}
            onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            helperText="Se resalta el producto en la lista cuando el stock baja de este número."
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saveMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
