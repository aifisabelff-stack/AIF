import Link from "next/link";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { BookingReservaWidget } from "@/components/booking/booking-reserva-widget";
import { getActiveOfferedTherapies } from "@/lib/queries";

export default async function ReservaPage() {
  let therapies: Awaited<ReturnType<typeof getActiveOfferedTherapies>> = [];
  try {
    therapies = await getActiveOfferedTherapies();
  } catch (err) {
    console.error("[ReservaPage] No se pudieron cargar las terapias:", err);
  }

  return (
    <div className="landing-page min-h-screen px-5 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-iaf-700 hover:text-gold-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark width={72} presentation="transparent" />
          <h1 className="mt-4 flex items-center justify-center gap-2 font-display text-2xl font-semibold text-iaf-900">
            <CalendarDays className="h-6 w-6 text-gold-600" />
            Reserva de cita
          </h1>
        </div>
        <BookingReservaWidget therapies={therapies} />
      </div>
    </div>
  );
}
