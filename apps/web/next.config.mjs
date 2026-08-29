/**
 * El aviso por WhatsApp es el unico camino para confirmar una cita, asi que el
 * numero del spa es obligatorio: sin el, la clienta reserva y nadie se entera
 * hasta que alguien abra el panel.
 *
 * Las variables NEXT_PUBLIC_ se incrustan al compilar, de modo que este es el
 * ultimo momento en que se puede impedir un despliegue mal configurado. En
 * desarrollo solo avisa, para no bloquear a quien clona el repositorio.
 */
function verificarWhatsapp() {
  const crudo = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digitos = crudo.replace(/\D/g, "");
  if (digitos.length >= 10) return;

  const problema = crudo
    ? `NEXT_PUBLIC_WHATSAPP_NUMBER tiene ${digitos.length} digitos y hacen falta al menos 10.`
    : "NEXT_PUBLIC_WHATSAPP_NUMBER no esta definido.";

  const mensaje = [
    "",
    "  No se puede compilar para produccion sin el numero de WhatsApp del spa.",
    "",
    `  ${problema}`,
    "",
    "  Es el numero al que la clienta envia el aviso al terminar de reservar,",
    "  con indicativo de pais y sin signos. Para Colombia: 573045442496.",
    "",
    "  Definelo en apps/web/.env.local o en el entorno del servidor.",
    "",
  ].join("\n");

  if (process.env.NODE_ENV === "production") throw new Error(mensaje);
  console.warn(mensaje);
}

verificarWhatsapp();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@spa/shared", "@spa/ui"],
};

export default nextConfig;
