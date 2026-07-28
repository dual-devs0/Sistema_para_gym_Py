import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";

export default function AttendancePage() {
  return (
    <PageWrapper title="Asistencias">
      <Card>
        <p className="text-gray-500">Control de check-in / check-out — próximo.</p>
      </Card>
    </PageWrapper>
  );
}
