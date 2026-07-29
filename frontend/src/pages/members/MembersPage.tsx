import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

async function createMember(body: { first_name: string; last_name: string; email?: string; phone?: string; document_number?: string }) {
  const { data } = await api.post("/members", body);
  return data;
}

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", document_number: "" });

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
                  <th className="pb-3 pr-4 font-medium">Documento</th>
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
                    <td className="py-3 pr-4 text-gray-600">{m.document_number ?? "—"}</td>
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
    </PageWrapper>
  );
}