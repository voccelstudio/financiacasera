"use client";

import { useState } from "react";

export interface ShareData {
  family: string;
  month: string;
  income: number;
  expense: number;
  balance: number;
  categories: { name: string; amount: number; pct: number }[];
}

const fmt = (n: number) => "₲ " + Math.round(n).toLocaleString("es-PY");

type ShareFiles = { files: File[]; title?: string };

/**
 * Genera una imagen tipo "post" con el resumen del mes (1080×1350)
 * y la comparte o descarga. Sin dependencias: canvas nativo.
 */
export function ShareCardButton({ data }: { data: ShareData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const W = 1080;
      const H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas no disponible");

      // Fondo
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const round = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        const c = ctx as CanvasRenderingContext2D & {
          roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
        };
        if (typeof c.roundRect === "function") c.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h);
      };

      const drawCentered = (text: string, y: number) => {
        ctx.textAlign = "center";
        ctx.fillText(text, W / 2, y);
        ctx.textAlign = "left";
      };

      const truncate = (text: string, maxW: number) => {
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
        return t + "…";
      };

      // --- Encabezado ---
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 30px system-ui, sans-serif";
      drawCentered("F I N A N C I A   C A S E R A", 110);

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 62px system-ui, sans-serif";
      drawCentered(truncate(data.family, W - 160), 200);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "500 40px system-ui, sans-serif";
      drawCentered(data.month, 265);

      // --- Balance ---
      const positive = data.balance >= 0;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 32px system-ui, sans-serif";
      drawCentered(positive ? "AHORRO DEL MES" : "DEFICIT DEL MES", 380);

      ctx.fillStyle = positive ? "#4ade80" : "#f87171";
      ctx.font = "800 96px system-ui, sans-serif";
      drawCentered(fmt(data.balance), 485);

      // --- Ingresos / gastos ---
      const boxW = 440;
      const boxH = 170;
      const gap = 40;
      const boxY = 560;
      const box1X = (W - (boxW * 2 + gap)) / 2;
      const box2X = box1X + boxW + gap;

      ctx.fillStyle = "#ffffff14";
      round(box1X, boxY, boxW, boxH, 28);
      ctx.fill();
      round(box2X, boxY, boxW, boxH, 28);
      ctx.fill();

      ctx.font = "600 30px system-ui, sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.textAlign = "center";
      ctx.fillText("Ingresos", box1X + boxW / 2, boxY + 60);
      ctx.fillText("Gastos", box2X + boxW / 2, boxY + 60);
      ctx.font = "800 46px system-ui, sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.fillText(fmt(data.income), box1X + boxW / 2, boxY + 130);
      ctx.fillStyle = "#f87171";
      ctx.fillText(fmt(data.expense), box2X + boxW / 2, boxY + 130);
      ctx.textAlign = "left";

      // --- Categorías ---
      let y = boxY + boxH + 110;
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 40px system-ui, sans-serif";
      ctx.fillText("¿A dónde se fue la plata?", 90, y);

      const rows = data.categories.slice(0, 5);
      const barMax = W - 180 - 220;
      for (const cat of rows) {
        y += 34;
        ctx.font = "600 34px system-ui, sans-serif";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(truncate(cat.name, 460), 90, y + 34);

        ctx.textAlign = "right";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 32px system-ui, sans-serif";
        ctx.fillText(`${cat.pct}%  ${fmt(cat.amount)}`, W - 90, y + 34);
        ctx.textAlign = "left";

        // Barra
        y += 52;
        ctx.fillStyle = "#ffffff1f";
        round(90, y, barMax + 200, 18, 9);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        round(90, y, Math.max(18, (barMax + 200) * Math.min(1, cat.pct / 100)), 18, 9);
        ctx.fill();
        y += 44;
      }

      // --- Pie ---
      ctx.textAlign = "center";
      ctx.fillStyle = "#64748b";
      ctx.font = "500 28px system-ui, sans-serif";
      drawCentered(
        `Hecho con Financia Casera · ${new Date().toLocaleDateString("es-PY")}`,
        H - 70
      );

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("no se pudo generar la imagen");

      const slug = data.month
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
      const filename = `resumen-${slug}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // En celular, enviarlo directo a WhatsApp/Instagram si el sistema lo permite
      const nav = navigator as Navigator & {
        canShare?: (d: ShareFiles) => boolean;
        share?: (d: ShareFiles) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        try {
          await nav.share({ files: [file], title: `Resumen de ${data.family}` });
          return;
        } catch {
          // Si el usuario cancela el menú compartido, no descargamos nada
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={generate}
        disabled={busy}
        className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-60"
        title="Generar una imagen del resumen para compartir"
      >
        {busy ? "Generando…" : "🖼️ Compartir resumen"}
      </button>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
