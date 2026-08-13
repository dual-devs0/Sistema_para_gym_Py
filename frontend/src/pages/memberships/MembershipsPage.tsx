import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, SearchX } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import PlansTable from "../../components/feature/PlansTable";
import Pagination from "../../components/feature/Pagination";
import api from "../../services/api";
import type { MembershipPlan } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import { canManagePlans } from "../../utils/roles";

const ITEMS_PER_PAGE = 10;

async function fetchPlans(): Promise<MembershipPlan[]> {
  const { data } = await api.get("/plans");
  return data;
}

const emptyForm = { name: "", description: "", price: "", duration_days: "", max_visits: "", type: "mensual" };

const typeOptions = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "visitas", label: "Por visitas" },
];

export default function MembershipsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = canManagePlans(user?.role);
  const { data: plans, isLoading } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
        max_visits: form.max_visits ? parseInt(form.max_visits) : undefined,
        type: form.type,
      };
      if (editingPlan) {
        return api.put(`/plans/${editingPlan.id}`, body);
      }
      return api.post("/plans", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      setModalOpen(false);
      setEditingPlan(null);
      setForm(emptyForm);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.put(`/plans/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (plan: MembershipPlan) =>
      api.post("/plans", {
        name: `${plan.name} (copia)`,
        description: plan.description,
        price: plan.price,
        duration_days: plan.duration_days,
        max_visits: plan.max_visits,
        type: plan.type,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      max_visits: plan.max_visits ? String(plan.max_visits) : "",
      type: plan.type,
    });
    setModalOpen(true);
  };

  const filtered = (plans || []).filter((p) => {
    const q = searchValue.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
    }
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasActiveFilters = !!(searchValue || statusFilter !== "all" || typeFilter !== "all");

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Membresías</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {plans?.length || 0} planes registrados
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
            Nuevo Plan
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none transition-colors"
            placeholder="Buscar planes..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="min-w-[140px] bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="min-w-[140px] bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors"
        >
          <option value="all">Todos los tipos</option>
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchValue(""); setStatusFilter("all"); setTypeFilter("all"); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-higher border border-outline-variant transition-colors"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            <PlansTable
              plans={paginated}
              onEdit={openEdit}
              onDuplicate={(id) => {
                const p = plans?.find((x) => x.id === id);
                if (p) duplicateMutation.mutate(p);
              }}
              onStatusToggle={(id, status) => toggleActiveMutation.mutate({ id, is_active: status })}
              onRestore={(id) => toggleActiveMutation.mutate({ id, is_active: true })}
              onDelete={(id) => deleteMutation.mutate(id)}
              readOnly={!canManage}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-container-higher flex items-center justify-center mb-4">
              {hasActiveFilters ? <SearchX className="w-6 h-6 text-on-surface-variant" /> : <Package className="w-6 h-6 text-on-surface-variant" />}
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">
              {hasActiveFilters ? "Sin resultados" : "No hay planes de membresía todavía"}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              {hasActiveFilters ? "Probá con otros filtros o limpiá la búsqueda." : "Creá el primer plan para empezar."}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                Crear primer plan
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingPlan(null); setForm(emptyForm); }} title={editingPlan ? "Editar Plan" : "Nuevo Plan"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio ($)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Duración (días)" type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Máx. visitas (opcional)" type="number" value={form.max_visits} onChange={(e) => setForm({ ...form, max_visits: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setModalOpen(false); setEditingPlan(null); setForm(emptyForm); }}>Cancelar</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingPlan ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
