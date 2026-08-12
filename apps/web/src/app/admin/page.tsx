import { redirect } from "next/navigation";

export default function AdminHomePage() {
  // Las reservas son lo que se consulta a diario: el panel abre directamente ahi.
  redirect("/admin/bookings");
}
