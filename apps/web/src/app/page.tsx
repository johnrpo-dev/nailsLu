import { BrandLogo } from "@/components/brand/brand-logo";
import { BookingExperience } from "@/features/public-booking/components/booking-experience";

export default function HomePage() {
  // BrandLogo lee el sistema de archivos, asi que se resuelve en el servidor y
  // se inyecta ya renderizado en la experiencia, que es un componente cliente.
  return <BookingExperience brand={<BrandLogo />} />;
}
