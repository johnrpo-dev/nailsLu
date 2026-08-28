import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ui/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Base para resolver las URLs absolutas de la vista previa al compartir el
 * enlace (WhatsApp, redes). Sin esto Next asume localhost y la imagen no carga
 * fuera del equipo de desarrollo.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "NAILS LU SPA · Reserva tu cita",
  description: "Agenda tus servicios en NAILS LU SPA sin registro obligatorio.",
  openGraph: {
    title: "NAILS LU SPA",
    description: "Agenda tus servicios sin registro obligatorio.",
    type: "website",
    locale: "es_CO",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141110" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
