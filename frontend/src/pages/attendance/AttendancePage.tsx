import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import type { AttendanceLog, AttendanceTodayResponse } from "../../types/api";

async function fetchAttendance(): Promise<AttendanceLog[]> {
  const { data } = await api.get("/attendance");
  return data;
}

async function fetchTodaySummary(): Promise<AttendanceTodayResponse> {
  const { data } = await api.get("/attendance/today");
  return data;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendance });
  const { data: today } = useQuery({ queryKey: ["attendance-today"], queryFn: fetchTodaySummary });
  const [checkInId, setCheckInId] = useState("");

  const checkInMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.post("/attendance/check-in", null, { params: { member_id: memberId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      setCheckInId("");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (logId: string) => {
      await api.put(`/attendance/${logId}/check-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  return (
    <PageWrapper title="Asistencias">
      {today && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm text-gray-500">Check-ins hoy</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{today.total_checkins}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Activos ahora</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{today.active_now}</p>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input label="ID del miembro para check-in" value={checkInId} onChange={(e) => setCheckInId(e.target.value)} placeholder="Ingresa el ID del miembro" />
          </div>
          <Button onClick={() => checkInMutation.mutate(checkInId)} disabled={!checkInId} loading={checkInMutation.isPending}>
            <CheckCircle className="h-4 w-4" />
            Check-in
          </Button>
        </div>
      </Card>

      <Card title="Registro de asistencias">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Cargando asistencias...</p>
        ) : logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Miembro</th>
                  <th className="pb-3 pr-4 font-medium">Entrada</th>
                  <th className="pb-3 pr-4 font-medium">Salida</th>
                  <th className="pb-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{log.member_name ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{new Date(log.check_in).toLocaleString("es-MX")}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {log.check_out ? new Date(log.check_out).toLocaleString("es-MX") : (
                        <span className="text-green-600 font-medium">Activo</span>
                      )}
                    </td>
                    <td className="py-3">
                      {!log.check_out && (
                        <Button variant="ghost" size="small" onClick={() => checkOutMutation.mutate(log.id)} loading={checkOutMutation.isPending}>
                          <XCircle className="h-4 w-4" />
                          Check-out
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No hay asistencias registradas hoy.</p>
        )}
      </Card>
    </PageWrapper>
  );
}