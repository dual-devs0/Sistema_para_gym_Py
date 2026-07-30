import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Settings, Mail, Phone, Calendar, Building2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { UserInfo } from "../../types/api";

interface UserWithPhone extends UserInfo {
  phone: string | null;
}

const emptyForm = { full_name: "", phone: "" };

async function fetchUser(userId: string): Promise<UserInfo> {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { user, loadUser } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<"profile">("profile");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => fetchUser(user!.id),
    enabled: !!user?.id,
  }) as { data: UserWithPhone | undefined; isLoading: boolean };

  const updateProfileMutation = useMutation({
    mutationFn: (body: { full_name: string; phone?: string }) => api.put(`/users/${user?.id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", user?.id] });
      loadUser();
      setSuccessMessage("Perfil actualizado correctamente");
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: () => {
      setErrorMessage("Error al actualizar. Intentá de nuevo.");
      setTimeout(() => setErrorMessage(""), 4000);
    },
  });

  useMemo(() => {
    if (userDetails) {
      setForm({
        full_name: userDetails.full_name || "",
        phone: userDetails.phone || "",
      });
    }
  }, [userDetails]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    updateProfileMutation.mutate({ full_name: form.full_name, phone: form.phone || undefined });
  };

  const displayUser = (userDetails || user) as UserWithPhone;

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slide-in-up">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mi perfil</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Administrá tu información personal y preferencias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 h-fit sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center text-2xl font-bold text-on-primary-container mb-4">
                {displayUser?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "US"}
              </div>
              <h2 className="text-lg font-semibold text-on-surface">{displayUser?.full_name || "Usuario"}</h2>
              <p className="text-sm text-on-surface-variant mb-1">{displayUser?.email || ""}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {displayUser?.role === "owner" ? "Propietario" : displayUser?.role === "admin" ? "Admin" : "Entrenador"}
              </span>
            </div>
            <div className="mt-6 pt-6 border-t border-outline-variant/30 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>{displayUser?.gym?.name || "Sin gimnasio"}</span>
              </div>
              {displayUser?.phone && (
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{displayUser.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{displayUser?.email || ""}</span>
              </div>
              {displayUser?.last_login && (
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Último acceso: {new Date(displayUser.last_login).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
            <div className="flex gap-2 mb-6 border-b border-outline-variant/30">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "profile"
                    ? "bg-surface-container-highest text-on-surface border-b-2 border-primary -mb-px"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Datos personales
              </button>
            </div>

            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                {successMessage && (
                  <div className="text-xs text-secondary bg-secondary/10 px-3 py-2 rounded-lg flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 flex-shrink-0" />
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">{errorMessage}</div>
                )}
                <Input
                  label="Nombre completo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
                <Input
                  label="Teléfono (opcional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <div className="pt-2">
                  <Button type="submit" loading={updateProfileMutation.isPending} icon={<Save className="w-4 h-4" />}>
                    Guardar cambios
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Información de la cuenta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-surface-container-highest rounded-lg">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1">Rol</p>
                <p className="text-on-surface capitalize">{displayUser?.role || "—"}</p>
              </div>
              <div className="p-4 bg-surface-container-highest rounded-lg">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1">Gimnasio</p>
                <p className="text-on-surface">{displayUser?.gym?.name || "—"}</p>
              </div>
              <div className="p-4 bg-surface-container-highest rounded-lg">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1">ID de usuario</p>
                <p className="text-on-surface font-mono">{displayUser?.id?.slice(0, 8)}…</p>
              </div>
              <div className="p-4 bg-surface-container-highest rounded-lg">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1">Último acceso</p>
                <p className="text-on-surface">
                  {displayUser?.last_login
                    ? new Date(displayUser.last_login).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}