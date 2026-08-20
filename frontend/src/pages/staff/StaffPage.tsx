import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, ShieldCheck, Copy } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { User } from "../../types/api";
import { roleLabel } from "../../utils/roles";

async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get("/users");
  return data;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "trainer", label: "Entrenador" },
  { value: "receptionist", label: "Recepción" },
  { value: "owner", label: "Propietario" },
];

const emptyInviteForm = { email: "", full_name: "", role: "trainer" };
const emptyEditForm = { full_name: "", phone: "", role: "trainer", is_active: true };

export default function StaffPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [inviteError, setInviteError] = useState("");
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState("");

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; full_name: string; role: string }) => api.post("/users/invite", body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setTempCredentials({ email: res.data.user.email, password: res.data.temporary_password });
      setInviteForm(emptyInviteForm);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setInviteError(detail || "No se pudo invitar al usuario. Intentá de nuevo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ full_name: string; phone: string; role: string; is_active: boolean }> }) =>
      api.put(`/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setEditError(detail || "No se pudo actualizar. Intentá de nuevo.");
    },
  });

  const openInvite = () => {
    setInviteForm(emptyInviteForm);
    setInviteError("");
    setTempCredentials(null);
    setInviteOpen(true);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setTempCredentials(null);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    inviteMutation.mutate(inviteForm);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ full_name: user.full_name, phone: user.phone || "", role: user.role, is_active: user.is_active });
    setEditError("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, body: editForm });
  };

  const toggleActive = (user: User) => {
    updateMutation.mutate({ id: user.id, body: { is_active: !user.is_active } });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Staff</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {users?.length || 0} personas con acceso a este gimnasio
          </p>
        </div>
        <Button variant="primary" onClick={openInvite} icon={<Plus className="w-4 h-4" />}>
          Invitar persona
        </Button>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users && users.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Persona</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Rol</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Estado</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Últ. acceso</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-higher/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                        {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{u.full_name}</p>
                        <p className="text-[11px] text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-secondary" : "bg-on-surface-variant/40"}`} />
                      <span className={`text-xs font-medium ${u.is_active ? "text-secondary" : "text-on-surface-variant"}`}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : "Nunca"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-higher hover:text-on-surface transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                        title={u.is_active ? "Desactivar" : "Reactivar"}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          {u.is_active ? "block" : "check_circle"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-container-higher flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-on-surface-variant" />
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">Todavía no invitaste a nadie</p>
            <p className="text-xs text-on-surface-variant mb-4">Invitá recepción o entrenadores para que puedan usar la consola.</p>
            <Button variant="primary" size="sm" onClick={openInvite}>Invitar persona</Button>
          </div>
        )}
      </div>

      <Modal open={inviteOpen} onClose={closeInvite} title="Invitar persona" size="md">
        {tempCredentials ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
              <p className="text-xs text-secondary">Invitación creada. Compartí estas credenciales temporales de forma segura.</p>
            </div>
            <div className="bg-surface-container-highest rounded-lg p-4 space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Usuario</span>
                <span className="text-on-surface">{tempCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Contraseña temporal</span>
                <span className="text-on-surface flex items-center gap-1">
                  {tempCredentials.password}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(tempCredentials.password)}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    title="Copiar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              La persona debería cambiar esta contraseña la primera vez que entre (Perfil → Seguridad).
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={closeInvite}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            {inviteError && <p className="text-xs text-error font-medium">{inviteError}</p>}
            <Input
              label="Nombre completo"
              value={inviteForm.full_name}
              onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Rol</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={closeInvite}>Cancelar</Button>
              <Button type="submit" loading={inviteMutation.isPending}>Invitar</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Editar persona" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && <p className="text-xs text-error font-medium">{editError}</p>}
          <Input
            label="Nombre completo"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            required
          />
          <Input
            label="Teléfono (opcional)"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface">Rol</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button type="submit" loading={updateMutation.isPending}>Guardar cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
