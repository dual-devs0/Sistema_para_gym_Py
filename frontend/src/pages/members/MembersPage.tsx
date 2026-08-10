import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, SearchX } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import MembersTable from "../../components/feature/MembersTable";
import FilterBar from "../../components/feature/FilterBar";
import Pagination from "../../components/feature/Pagination";
import api from "../../services/api";
import type { Member, MemberListItem } from "../../types/api";

const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const dateFmt = (d: string) => d ? new Date(d).toLocaleDateString("es", dateOpts) : "—";

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

function transformMembers(members: Member[]): MemberListItem[] {
  return members.map((m) => ({
    id: m.id,
    avatar: m.photo_url || undefined,
    name: `${m.first_name} ${m.last_name}`,
    memberId: `#GP-${String(m.id).slice(-4)}`,
    plan: m.status === "active" ? "Premium Anual" : "Básico Mensual",
    status: m.status as "active" | "frozen" | "cancelled",
    expiration: dateFmt(m.updated_at),
    lastCheckin: dateFmt(m.created_at),
  }));
}

const ITEMS_PER_PAGE = 10;

export default function MembersPage() {
  const qc = useQueryClient();
  const { data: members, isLoading } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const [modalOpen, setModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ first_name: string; last_name: string; email: string; phone: string; document_number: string }>({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const createMutation = useMutation({
    mutationFn: (body: { first_name: string; last_name: string; email?: string; phone?: string; document_number?: string }) => editingId
      ? api.put(`/members/${editingId}`, body)
      : api.post("/members", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setModalOpen(false);
      setEditingId(null);
      setForm({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });
    },
  });

  const freezeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/members/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      document_number: form.document_number || undefined,
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const m = members?.find((x) => x.id === id);
    if (!m) return;
    setEditingId(id);
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email || "",
      phone: m.phone || "",
      document_number: m.document_number || "",
    });
    setModalOpen(true);
  };

  const handleView = (id: string) => {
    const m = members?.find((x) => x.id === id);
    if (m) setViewMember(m);
  };

  const handleFreeze = (id: string) => {
    const m = members?.find((x) => x.id === id);
    if (!m) return;
    const newStatus = m.status === "frozen" ? "active" : "frozen";
    freezeMutation.mutate({ id, status: newStatus });
  };

  const transformed = useMemo(() => {
    if (!members) return [];
    let r = transformMembers(members);
    const q = searchValue.toLowerCase();
    if (q) r = r.filter((m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q));
    if (statusFilter !== "all") r = r.filter((m) => m.status === statusFilter);
    if (planFilter !== "all") r = r.filter((m) => m.plan === planFilter);
    return r;
  }, [members, searchValue, statusFilter, planFilter]);

  const totalPages = Math.ceil(transformed.length / ITEMS_PER_PAGE);
  const paginated = transformed.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasActiveFilters = !!(searchValue || statusFilter !== "all" || planFilter !== "all");

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Miembros</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {members?.length || 0} miembros registrados
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
          Agregar Miembro
        </Button>
      </div>

      <FilterBar
        searchValue={searchValue}
        onSearchChange={(v) => { setSearchValue(v); setCurrentPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
        planFilter={planFilter}
        onPlanChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}
        onClearFilters={() => { setSearchValue(""); setStatusFilter("all"); setPlanFilter("all"); setCurrentPage(1); }}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Miembro</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Plan</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Vencimiento</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Últ. Ingreso</th>
              <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <MembersTable
            members={paginated}
            onView={handleView}
            onEdit={openEdit}
            onFreeze={handleFreeze}
            loading={isLoading}
          />
        </table>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={transformed.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}

        {!isLoading && transformed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-4">
              {hasActiveFilters ? <SearchX className="w-6 h-6 text-on-surface-variant" /> : <Users className="w-6 h-6 text-on-surface-variant" />}
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">
              {hasActiveFilters ? "Sin resultados" : "No hay miembros todavía"}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              {hasActiveFilters ? "Probá con otros filtros o limpiá la búsqueda." : "Agregá el primer miembro para empezar."}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                Agregar Miembro
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? "Editar Miembro" : "Agregar Miembro"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input label="Apellido" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Documento" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setModalOpen(false); setEditingId(null); }}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>{editingId ? "Guardar cambios" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Detalle del Miembro" size="md">
        {viewMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/30">
              <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-lg font-bold text-on-primary-container">
                {viewMember.first_name[0]}{viewMember.last_name[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-on-surface">{viewMember.first_name} {viewMember.last_name}</p>
                <p className="text-sm text-on-surface-variant">{viewMember.email || "Sin email"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Teléfono</p>
                <p className="text-on-surface mt-0.5">{viewMember.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Documento</p>
                <p className="text-on-surface mt-0.5">{viewMember.document_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Estado</p>
                <p className="text-on-surface mt-0.5 capitalize">{viewMember.status}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Registrado</p>
                <p className="text-on-surface mt-0.5">{dateFmt(viewMember.created_at)}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewMember(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
