import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { Payment } from "../../types/api";

async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get("/payments");
  return data;
}

async function registerPayment(body: { member_id: string; amount: number; payment_method: string; reference?: string; notes?: string }) {
  const { data } = await api.post("/payments", body);
  return data;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ member_id: "", amount: "", payment_method: "efectivo", reference: "", notes: "" });

  const createMutation = useMutation({
    mutationFn: registerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setModalOpen(false);
      setForm({ member_id: "", amount: "", payment_method: "efectivo", reference: "", notes: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      member_id: form.member_id,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <PageWrapper
      title="Pagos"
      action={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar pago
        </Button>
      }
    >
      <Card>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Cargando pagos...</p>
        ) : payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Miembro</th>
                  <th className="pb-3 pr-4 font-medium">Monto</th>
                  <th className="pb-3 pr-4 font-medium">Método</th>
                  <th className="pb-3 pr-4 font-medium">Referencia</th>
                  <th className="pb-3 pr-4 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{p.member_name ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">${p.amount.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-gray-600 capitalize">{p.payment_method}</td>
                    <td className="py-3 pr-4 text-gray-600">{p.reference ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "completed" ? "bg-green-100 text-green-700" :
                        p.status === "refunded" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {p.status === "completed" ? "Completado" : p.status === "refunded" ? "Reembolsado" : p.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400">No hay pagos registrados todavía.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setModalOpen(true)}>
              Registrar primer pago
            </Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar pago">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="ID del miembro" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required />
          <Input label="Monto" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Método de pago</label>
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <Input label="Referencia (opcional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Input label="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
