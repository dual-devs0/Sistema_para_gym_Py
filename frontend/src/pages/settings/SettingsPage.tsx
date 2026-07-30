import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { GymSettings } from "../../types/api";

async function fetchSettings(): Promise<GymSettings> {
  const { data } = await api.get("/gym/settings");
  return data;
}

async function updateSettings(body: Partial<GymSettings>) {
  const { data } = await api.put("/gym/settings", body);
  return data;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["gym-settings"], queryFn: fetchSettings });
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", currency: "MXN", timezone: "America/Mexico_City",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        currency: settings.currency || "MXN",
        timezone: settings.timezone || "America/Mexico_City",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym-settings"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <PageWrapper title="Configuración">
        <Card><p className="text-center text-gray-400 py-8">Cargando configuración...</p></Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Configuración">
      <Card>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <Input label="Nombre del gimnasio" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <Input label="Zona horaria" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          <div className="pt-2">
            <Button type="submit" loading={updateMutation.isPending}>Guardar cambios</Button>
          </div>
          {updateMutation.isSuccess && (
            <p className="text-sm text-green-600">Configuración actualizada correctamente.</p>
          )}
        </form>
      </Card>
    </PageWrapper>
  );
}
