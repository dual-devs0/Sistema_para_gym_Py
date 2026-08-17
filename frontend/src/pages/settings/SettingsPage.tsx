import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, Clock, MapPin, Globe } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { GymSettings } from "../../types/api";

async function fetchSettings(): Promise<GymSettings> {
  const { data } = await api.get("/gym/settings");
  return data;
}

const timezoneOptions = [
  { value: "America/Asuncion", label: "Paraguay (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (GMT-3)" },
  { value: "America/Santiago", label: "Chile (GMT-4)" },
  { value: "America/Bogota", label: "Colombia (GMT-5)" },
  { value: "America/Lima", label: "Perú (GMT-5)" },
  { value: "America/Caracas", label: "Venezuela (GMT-4)" },
  { value: "America/Montevideo", label: "Uruguay (GMT-3)" },
  { value: "America/Mexico_City", label: "México (GMT-6)" },
  { value: "America/La_Paz", label: "Bolivia (GMT-4)" },
  { value: "America/Guatemala", label: "Guatemala (GMT-6)" },
  { value: "America/Puerto_Rico", label: "Puerto Rico (GMT-4)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "Europe/London", label: "London (GMT+0)" },
];

const currencyOptions = [
  { value: "PYG", label: "PYG - Guaraní paraguayo" },
  { value: "ARS", label: "ARS - Peso argentino" },
  { value: "CLP", label: "CLP - Peso chileno" },
  { value: "COP", label: "COP - Peso colombiano" },
  { value: "PEN", label: "PEN - Sol peruano" },
  { value: "VES", label: "VES - Bolívar venezolano" },
  { value: "UYU", label: "UYU - Peso uruguayo" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "BOB", label: "BOB - Boliviano" },
  { value: "GTQ", label: "GTQ - Quetzal guatemalteco" },
  { value: "USD", label: "USD - Dólar estadounidense" },
  { value: "EUR", label: "EUR - Euro" },
];

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-outline-variant/30">
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-primary">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["gym-settings"], queryFn: fetchSettings });
  const [form, setForm] = useState({
    name: "", slug: "", logo_url: "", address: "", phone: "", email: "",
    currency: "PYG", timezone: "America/Asuncion",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || "",
        slug: settings.slug || "",
        logo_url: settings.logo_url || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        currency: settings.currency || "PYG",
        timezone: settings.timezone || "America/Asuncion",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<GymSettings>) => api.put("/gym/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-settings"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name,
      logo_url: form.logo_url || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      currency: form.currency,
      timezone: form.timezone,
    });
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-on-surface">Configuración</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Administrá los datos de tu gimnasio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <SectionCard icon={<Building2 className="w-5 h-5" />} title="Información general">
          <Input label="Nombre del gimnasio" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-on-surface mb-1 block">Slug</label>
            <div className="flex items-center gap-2 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface-variant">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="font-mono">{form.slug}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Identificador único del gimnasio (no editable).</p>
          </div>
          <Input label="URL del logo" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://ejemplo.com/logo.png" />
        </SectionCard>

        <SectionCard icon={<MapPin className="w-5 h-5" />} title="Contacto">
          <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle y número, colonia, ciudad" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 55 1234 5678" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@gimnasio.com" />
          </div>
        </SectionCard>

        <SectionCard icon={<Clock className="w-5 h-5" />} title="Preferencias regionales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Moneda</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50">
                {currencyOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface">Zona horaria</label>
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/50">
                {timezoneOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={updateMutation.isPending} icon={<Save className="w-4 h-4" />}>
            Guardar cambios
          </Button>
          {updateMutation.isSuccess && (
            <span className="text-sm text-secondary font-medium animate-fade-in">✓ Cambios guardados</span>
          )}
          {updateMutation.isError && (
            <span className="text-sm text-error font-medium animate-fade-in">Error al guardar. Intentá de nuevo.</span>
          )}
        </div>
      </form>
    </div>
  );
}
