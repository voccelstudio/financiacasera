import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Financia Casera",
    short_name: "Financia Casera",
    description:
      "Controlá las finanzas de tu familia: ingresos, gastos, presupuestos y ahorro.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#16a34a",
    lang: "es",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
