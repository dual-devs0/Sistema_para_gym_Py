import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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
      {/* Page Header */}
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

      {/* Filters */}
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

      {/* Members Table */}
      <Card className="flex flex-col">
        <MembersTable
          members={paginatedMembers}
          onView={handleView}
          onEdit={handleEdit}
          onFreeze={handleFreeze}
          loading={isLoading}
        />

        {/* Pagination */}
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

        {/* Empty State */}
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

      {/* Add Member Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar Nuevo Miembro" size="lg">
        <div className="space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <Input label="Nombre" placeholder="Juan" />
            <Input label="Apellido" placeholder="Pérez" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <Input label="Email" type="email" placeholder="correo@ejemplo.com" />
            <Input label="Teléfono" type="tel" placeholder="+52 55 1234 5678" />
          </div>
          <Input label="Documento" placeholder="Nro. de identidad/pasaporte" />
          <div className="grid grid-cols-2 gap-md">
            <Input label="Fecha de Nac." type="date" />
            <select className="w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-10 text-on-surface text-body-sm appearance-none focus:border-primary focus:ring-0 focus:outline-none transition-colors">
              <option>Género: Masculino</option>
              <option>Género: Femenino</option>
              <option>Género: Otro</option>
            </select>
          </div>
          <Input label="Notas" placeholder="Alergias, restricciones, etc." />
          <div className="flex justify-end gap-sm pt-md border-t border-outline-variant">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalOpen(false)}>Guardar Miembro</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}