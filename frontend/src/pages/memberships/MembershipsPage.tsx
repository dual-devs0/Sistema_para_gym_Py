import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PlanCard from "../../components/feature/PlanCard";
import PlansTable from "../../components/feature/PlansTable";
import SidePanel from "../../components/layout/SidePanel";
import api from "../../services/api";
import type { MembershipPlan } from "../../types/api";

async function fetchPlans(): Promise<MembershipPlan[]> {
  const { data } = await api.get("/plans");
  return data;
}

const mockPlans: MembershipPlan[] = [
  { id: "1", gym_id: "1", name: "Básico Mensual", description: "Acceso básico para miembros casuales", price: 29, duration_days: 30, max_visits: 12, type: "mensual", is_active: true },
  { id: "2", gym_id: "1", name: "Premium Anual", description: "Acceso completo con todas las instalaciones", price: 299, duration_days: 365, max_visits: null, type: "anual", is_active: true },
  { id: "3", gym_id: "1", name: "Flex Trimestral", description: "Plan trimestral para regulares", price: 85, duration_days: 90, max_visits: 45, type: "trimestral", is_active: true },
  { id: "4", gym_id: "1", name: "Pase Estudiantil", description: "Descuento mensual para estudiantes", price: 19, duration_days: 30, max_visits: 20, type: "mensual", is_active: true },
  { id: "5", gym_id: "1", name: "Ejecutivo Interno", description: "Solo para staff y socios", price: 0, duration_days: -1, max_visits: null, type: "internal", is_active: true },
];

function mapPlanToCard(plan: MembershipPlan) {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: (plan.type === "anual" ? "/año" : plan.type === "trimestral" ? "/trim" : "/mes") as "/mes" | "/año" | "/trim",
    type: plan.type.charAt(0).toUpperCase() + plan.type.slice(1) as "Mensual" | "Trimestral" | "Anual" | "Clases Sueltas" | "Pase Diario" | "Internal",
    duration: `${plan.duration_days} Días`,
    visits: plan.max_visits ?? "Ilimitado",
    activeMembers: Math.floor(Math.random() * 500),
    autoRenew: plan.type !== "internal",
    internal: plan.type === "internal",
    recommended: plan.id === "2",
    onEdit: () => console.log("Edit", plan.id),
  };
}

export default function MembershipsPage() {
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    staleTime: 30_000,
    placeholderData: mockPlans,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const cards = useMemo(() => plans?.map(mapPlanToCard) ?? [], [plans]);

  const handleOpenEditor = (plan?: MembershipPlan) => {
    setSelectedPlan(plan || null);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedPlan(null);
  };

  const handleSave = () => {
    console.log("Save plan:", selectedPlan);
    handleCloseEditor();
  };

  return (
    <div>
      <div className="mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Planes de Membresía
          </h2>
          <p className="font-body-md text-on-surface-variant mt-xs">
            Gestioná los planes disponibles y controlá las tendencias de inscripción.
          </p>
        </div>
        <Button variant="primary" onClick={() => handleOpenEditor()} icon={<Plus className="w-4 h-4" />}>
          + Nuevo Plan
        </Button>
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-md p-lg">
          {cards.map((card) => (
            <PlanCard key={card.id} {...card} onEdit={() => handleOpenEditor(plans?.find((p) => p.id === card.id))} />
          ))}
          {cards.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-xxl bg-surface-container-low border border-outline-variant border-dashed rounded-xl text-center">
              <span className="material-symbols-outlined text-[48px] text-outline mb-md">
                card_membership
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                No hay planes creados
              </h3>
              <p className="font-body-md text-on-surface-variant max-w-sm mb-lg">
                Creá tu primer plan para comenzar a inscribir miembros. Los planes definen precios,
                duración y límites de visitas para tu gimnasio.
              </p>
              <Button variant="primary" onClick={() => handleOpenEditor()} icon={<Plus className="w-4 h-4" />}>
                Crear mi Primer Plan
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-xl">
        <PlansTable
          plans={plans || []}
          onDuplicate={(id) => console.log("Duplicate", id)}
          onStatusToggle={(id, status) => console.log("Toggle", id, status)}
          onRestore={(id) => console.log("Restore", id)}
          onDelete={(id) => console.log("Delete", id)}
        />
      </Card>

      <SidePanel
        open={editorOpen}
        onClose={handleCloseEditor}
        title={selectedPlan ? "Editar Plan" : "Crear Nuevo Plan"}
        size="lg"
        onSubmit={handleSave}
        submitLabel="Guardar Plan"
      >
        <div className="space-y-lg">
          <div className="grid grid-cols-2 gap-lg">
            <div className="sm:col-span-2">
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Nombre del Plan
              </label>
              <Input placeholder="Ej: Premium Anual" defaultValue={selectedPlan?.name || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <div>
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Precio
              </label>
              <Input type="number" placeholder="299" defaultValue={selectedPlan?.price || ""} />
            </div>
            <div>
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Período
              </label>
              <select className="w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-10 text-on-surface text-body-sm appearance-none focus:border-primary focus:ring-0 focus:outline-none transition-colors">
                <option>/mes</option>
                <option>/trim</option>
                <option>/año</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <div>
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Tipo de Plan
                
              </label>
              <select className="w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-10 text-on-surface text-body-sm appearance-none focus:border-primary focus:ring-0 focus:outline-none transition-colors">
                <option>Mensual</option>
                <option>Trimestral</option>
                <option>Anual</option>
                <option>Clases Sueltas</option>
                <option>Pase Diario</option>
                <option>Internal</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Duración (días)
              </label>
              <Input type="number" placeholder="365" defaultValue={selectedPlan?.duration_days || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <div>
              <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
                Visitas Máx. (0 = ilimitado)
              </label>
              <Input type="number" placeholder="0" defaultValue={selectedPlan?.max_visits || ""} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary"
                  defaultChecked={selectedPlan?.is_active ?? true}
                />
                <span className="font-body-sm text-body-sm text-on-surface">Activo</span>
              </label>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-label-caps text-label-caps text-on-surface-variant">
              Descripción
            </label>
            <textarea
              className="w-full bg-surface border border-outline-variant rounded py-2 pl-3 pr-4 text-on-surface text-body-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              rows={3}
              placeholder="Descripción del plan, beneficios, restricciones..."
              defaultValue={selectedPlan?.description || ""}
            />
          </div>

          <div className="flex items-center gap-md pt-lg border-t border-outline-variant">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary"
              />
              <span className="font-body-sm text-body-sm text-on-surface">Visible para miembros (público)</span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer ml-auto">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary"
              />
              <span className="font-body-sm text-body-sm text-on-surface">Renovación automática</span>
            </label>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}