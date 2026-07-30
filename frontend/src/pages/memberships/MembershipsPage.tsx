import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { MembershipPlan } from "../../types/api";

async function fetchPlans(): Promise<MembershipPlan[]> {
  const { data } = await api.get("/plans");
  return data;
}

async function createPlan(body: Partial<MembershipPlan>) {
  const { data } = await api.post("/plans", body);
  return data;
}

export default function MembershipsPage() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", duration_days: "", max_visits: "", type: "mensual" });

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setModalOpen(false);
      setForm({ name: "", description: "", price: "", duration_days: "", max_visits: "", type: "mensual" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      duration_days: parseInt(form.duration_days),
      max_visits: form.max_visits ? parseInt(form.max_visits) : undefined,
      type: form.type,
    });
  };

  return (
    <PageWrapper
      title="Membresías"
      action={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      }
    >
      <Card>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Cargando planes...</p>
        ) : plans && plans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Nombre</th>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 pr-4 font-medium">Precio</th>
                  <th className="pb-3 pr-4 font-medium">Duración</th>
                  <th className="pb-3 pr-4 font-medium">Visitas</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 pr-4 text-gray-600 capitalize">{p.type}</td>
                    <td className="py-3 pr-4 text-gray-600">${p.price.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-gray-600">{p.duration_days} días</td>
                    <td className="py-3 pr-4 text-gray-600">{p.max_visits ?? "Ilimitadas"}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400">No hay planes de membresía todavía.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setModalOpen(true)}>
              Crear primer plan
            </Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo plan de membresía">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Precio" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Duración (días)" type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required />
          <Input label="Máx. visitas (opcional)" type="number" value={form.max_visits} onChange={(e) => setForm({ ...form, max_visits: e.target.value })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="visitas">Por visitas</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
