import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, Clock, MapPin, Globe, MessageCircle, FileText } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { GymSettings, GymFiscalConfig, Timbrado } from "../../types/api";

async function fetchSettings(): Promise<GymSettings> {
  const { data } = await api.get("/gym/settings");
  return data;
}

async function fetchFiscalConfig(): Promise<GymFiscalConfig | null> {
  const { data } = await api.get("/invoicing/fiscal-config");
  return data;
}

async function fetchTimbrados(): Promise<Timbrado[]> {
  const { data } = await api.get("/invoicing/timbrado");
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
  const { data: fiscalConfig } = useQuery({ queryKey: ["fiscal-config"], queryFn: fetchFiscalConfig });
  const { data: timbrados } = useQuery({ queryKey: ["timbrados"], queryFn: fetchTimbrados });
  const activeTimbrado = timbrados?.find((t) => t.is_active) ?? null;

  const [fiscalForm, setFiscalForm] = useState({ ruc: "", razon_social: "" });
  const [timbradoForm, setTimbradoForm] = useState({
    establecimiento: "", punto_expedicion: "", numero_desde: "", numero_hasta: "", fecha_vencimiento: "",
  });

  useEffect(() => {
    if (fiscalConfig) {
      setFiscalForm({ ruc: fiscalConfig.ruc || "", razon_social: fiscalConfig.razon_social || "" });
    }
  }, [fiscalConfig]);

  const fiscalMutation = useMutation({
    mutationFn: (body: { ruc?: string; razon_social?: string }) => api.put("/invoicing/fiscal-config", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiscal-config"] }),
  });

  const timbradoMutation = useMutation({
    mutationFn: (body: { establecimiento: string; punto_expedicion: string; numero_desde: number; numero_hasta: number; fecha_vencimiento: string }) =>
      api.post("/invoicing/timbrado", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timbrados"] });
      setTimbradoForm({ establecimiento: "", punto_expedicion: "", numero_desde: "", numero_hasta: "", fecha_vencimiento: "" });
    },
  });

  const handleFiscalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fiscalMutation.mutate({ ruc: fiscalForm.ruc || undefined, razon_social: fiscalForm.razon_social || undefined });
  };

  const handleTimbradoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    timbradoMutation.mutate({
      establecimiento: timbradoForm.establecimiento,
      punto_expedicion: timbradoForm.punto_expedicion,
      numero_desde: parseInt(timbradoForm.numero_desde, 10),
      numero_hasta: parseInt(timbradoForm.numero_hasta, 10),
      fecha_vencimiento: timbradoForm.fecha_vencimiento,
    });
  };

  const [form, setForm] = useState({
    name: "", slug: "", logo_url: "", address: "", phone: "", email: "",
    currency: "PYG", timezone: "America/Asuncion", notifications_enabled: false,
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
        notifications_enabled: settings.notifications_enabled ?? false,
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
      notifications_enabled: form.notifications_enabled,
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

        <SectionCard icon={<MessageCircle className="w-5 h-5" />} title="Notificaciones">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notifications_enabled}
              onChange={(e) => setForm({ ...form, notifications_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/50"
            />
            <div>
              <span className="text-sm font-medium text-on-surface">Enviar notificaciones automáticas por WhatsApp</span>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Confirmación de pago y recordatorio de vencimiento. Los mensajes se envían desde
                el número de WhatsApp de GymPro (número compartido).
              </p>
            </div>
          </label>
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

      <div className="space-y-6 max-w-2xl mt-6">
        <SectionCard icon={<FileText className="w-5 h-5" />} title="Fiscal y Facturación">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${activeTimbrado ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-highest text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-sm">{activeTimbrado ? "hourglass_top" : "info"}</span>
            Sin certificado cargado — no se pueden emitir facturas todavía. Los pagos se registran
            normalmente y quedan pendientes de timbrado hasta que cargues tu certificado digital.
          </div>

          <form onSubmit={handleFiscalSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="RUC" value={fiscalForm.ruc} onChange={(e) => setFiscalForm({ ...fiscalForm, ruc: e.target.value })} placeholder="80012345-6" />
              <Input label="Razón social" value={fiscalForm.razon_social} onChange={(e) => setFiscalForm({ ...fiscalForm, razon_social: e.target.value })} placeholder="Mi Gimnasio SA" />
            </div>
            <Button type="submit" size="sm" loading={fiscalMutation.isPending}>Guardar datos fiscales</Button>
          </form>

          <div className="pt-4 border-t border-outline-variant/30">
            <p className="text-sm font-medium text-on-surface mb-2">Timbrado</p>
            {activeTimbrado ? (
              <div className="text-sm text-on-surface-variant grid grid-cols-2 gap-2 mb-4">
                <span>Establecimiento: <span className="text-on-surface font-mono">{activeTimbrado.establecimiento}</span></span>
                <span>Punto exp.: <span className="text-on-surface font-mono">{activeTimbrado.punto_expedicion}</span></span>
                <span>Rango: <span className="text-on-surface font-mono">{activeTimbrado.numero_desde}–{activeTimbrado.numero_hasta}</span></span>
                <span>Vence: <span className="text-on-surface">{activeTimbrado.fecha_vencimiento}</span></span>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant mb-4">Sin timbrado cargado.</p>
            )}
            <form onSubmit={handleTimbradoSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Establecimiento" maxLength={3} value={timbradoForm.establecimiento} onChange={(e) => setTimbradoForm({ ...timbradoForm, establecimiento: e.target.value })} placeholder="001" required />
              <Input label="Punto expedición" maxLength={3} value={timbradoForm.punto_expedicion} onChange={(e) => setTimbradoForm({ ...timbradoForm, punto_expedicion: e.target.value })} placeholder="001" required />
              <Input label="Vencimiento" type="date" value={timbradoForm.fecha_vencimiento} onChange={(e) => setTimbradoForm({ ...timbradoForm, fecha_vencimiento: e.target.value })} required />
              <Input label="Número desde" type="number" value={timbradoForm.numero_desde} onChange={(e) => setTimbradoForm({ ...timbradoForm, numero_desde: e.target.value })} placeholder="1" required />
              <Input label="Número hasta" type="number" value={timbradoForm.numero_hasta} onChange={(e) => setTimbradoForm({ ...timbradoForm, numero_hasta: e.target.value })} placeholder="9999999" required />
              <div className="flex items-end">
                <Button type="submit" size="sm" loading={timbradoMutation.isPending}>Guardar timbrado</Button>
              </div>
            </form>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
