import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emma Care Studio 🎮🐾 | Crea tu juego de mascotas",
  description:
    "El juego de mascotas de Emma: 9 animales con voces y expresiones, 4 mundos (Jardín, Casa, Hospital y Playa), monedas, tienda y reglas mágicas. Sin instalar nada, desde el navegador.",
  keywords: ["juegos para niños", "mascotas", "Emma Care", "mundo abierto", "sonidos de animales"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎮</text></svg>",
  },
  openGraph: {
    title: "Emma Care Studio 🎮🐾",
    description:
      "9 mascotas con sonidos reales, 4 mundos por desbloquear y miles de reglas mágicas. ¡Entra a jugar!",
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF7ED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        {/* alertas pequeñas abajo a la derecha: no tapan el título ni el HUD */}
        <Toaster
          position="bottom-right"
          richColors
          visibleToasts={2}
          gap={6}
          offset={12}
          toastOptions={{ className: "emma-toast", duration: 3400 }}
        />
      </body>
    </html>
  );
}
