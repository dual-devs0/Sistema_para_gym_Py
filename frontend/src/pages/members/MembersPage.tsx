import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import MembersTable from "../../components/feature/MembersTable";
import FilterBar from "../../components/feature/FilterBar";
import Pagination from "../../components/feature/Pagination";
import api from "../../services/api";
import type { Member, MemberListItem } from "../../types/api";

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

async function createMember(body: { first_name: string; last_name: string; email?: string; phone?: string; document_number?: string }) {
  const { data } = await api.post("/members", body);
  return data;
}

function transformMembers(members: Member[]): MemberListItem[] {
  return members.map((m) => ({
    id: m.id,
    avatar: m.photo_url || undefined,
    name: `${m.first_name} ${m.last_name}`,
    memberId: `#GP-${String(m.id).slice(-4)}`,
    plan: m.status === "active" ? "Premium Annual" : "Monthly Basic",
    status: m.status as "active" | "frozen" | "cancelled",
    expiration: m.updated_at ? new Date(m.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    lastCheckin: m.registered_at ? new Date(m.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never",
  }));
}

const ITEMS_PER_PAGE = 10;

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const createMutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setModalOpen(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });
    },
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

  const transformedMembers = useMemo(() => {
    if (!members) return [];
    let result = transformMembers(members);

    if (searchValue) {
      const q = searchValue.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.memberId.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    if (planFilter !== "all") {
      result = result.filter((m) => m.plan === planFilter);
    }

    return result;
  }, [members, searchValue, statusFilter, planFilter]);

  const totalPages = Math.ceil(transformedMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = transformedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setPlanFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchValue || statusFilter !== "all" || planFilter !== "all");

  const handleView = (id: string) => {
    console.log("View member:", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit member:", id);
    setModalOpen(true);
  };

  const handleFreeze = (id: string) => {
    console.log("Freeze/Unfreeze member:", id);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <div className="mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Miembros</h1>
          <p className="text-on-surface-variant font-body-md text-body-md mt-unit">
            {members?.length || 0} miembros registrados
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          + Agregar Miembro
        </Button>
      </div>

      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        planFilter={planFilter}
        onPlanChange={setPlanFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <Card className="flex flex-col">
        <MembersTable
          members={paginatedMembers}
          onView={handleView}
          onEdit={handleEdit}
          onFreeze={handleFreeze}
          loading={isLoading}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={transformedMembers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            onItemsPerPageChange={() => {}}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}

        {!isLoading && transformedMembers.length === 0 && (
          <div className="p-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
              No se encontraron miembros.
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
              Ajustá la búsqueda o filtros, o agregá un nuevo miembro.
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar Miembro
            </Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar Nuevo Miembro" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input label="Apellido" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Documento" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
