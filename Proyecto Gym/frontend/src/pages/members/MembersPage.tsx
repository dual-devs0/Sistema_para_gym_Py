import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { Member } from "../../types/api";

async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get("/members");
  return data;
}

export default function MembersPage() {
  const { data: members, isLoading } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageWrapper
      title="Miembros"
      action={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo miembro
        </Button>
      }
    >
      <Card>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Cargando miembros...</p>
        ) : members && members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Nombre</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Teléfono</th>
                  <th className="pb-3 pr-4 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{m.first_name} {m.last_name}</td>
                    <td className="py-3 pr-4 text-gray-600">{m.email ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{m.phone ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {m.status === "active" ? "Activo" : m.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {m.registered_at ? new Date(m.registered_at).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400">No hay miembros registrados todavía.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setModalOpen(true)}>
              Registrar primer miembro
            </Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo miembro">
        <p className="text-sm text-gray-500">Formulario de registro próximo.</p>
      </Modal>
    </PageWrapper>
  );
}
