const tips = [
  {
    icon: "🎯",
    title: "Regla 50 / 30 / 20",
    color: "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900",
    body: "De cada sueldo: 50% para lo necesario (casa, comida, servicios), 30% para lo deseable (salidas, ropa) y 20% directo a ahorro. Ajustá los porcentajes a tu realidad, pero nunca saltees el ahorro.",
  },
  {
    icon: "🏦",
    title: "Fondo de emergencia",
    color: "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900",
    body: "Guardá el equivalente a 3 a 6 meses de gastos en una cuenta separada. Si alguien se queda sin trabajo o hay un gasto médico, no hace falta pedir prestado.",
  },
  {
    icon: "🛒",
    title: "Hacé mercado con lista",
    color: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900",
    body: "El gasto hormiga es el enemigo número uno. Andá con lista, comprá de temporada y evitá ir con hambre. Revisá el ticket antes de pagar.",
  },
  {
    icon: "💡",
    title: "Revisá los servicios",
    color: "bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900",
    body: "Luz (ANDE), agua (ESSAP), internet y cable: verificá que los consumos sean reales, contratá solo lo que usan y mirá si hay planes más económicos.",
  },
  {
    icon: "💳",
    title: "Cuidado con las cuotas",
    color: "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900",
    body: "La tarjeta de crédito en cuotas sin intereses puede servir, pero las cuotas con interés encarecen todo. Antes de comprar, calculá el precio final y anotalo en «Cuentas por pagar».",
  },
  {
    icon: "📅",
    title: "Día de pago, día de presupuesto",
    color: "bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-900",
    body: "El día que cobrás, cargá el ingreso y revisá los presupuestos del mes. Repartí el dinero de las cuentas fijas primero: lo que queda es lo que se puede usar.",
  },
  {
    icon: "🤝",
    title: "Hablen de plata en familia",
    color: "bg-pink-50 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-900",
    body: "Definan juntos un objetivo mensual (ahorrar para un viaje, la cuota del terreno, la fiesta). Revisen los reportes cada domingo: 10 minutos que evitan discusiones.",
  },
  {
    icon: "🎯",
    title: "Gastos personales vs. familia",
    color: "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-900",
    body: "Cuando un gasto es solo tuyo (tu ropa, tu salida con amigos), cargalo con alcance «Miembros». Así los reportes muestran cuánto consume cada uno y la cuenta de la familia queda clara.",
  },
  {
    icon: "🧾",
    title: "Guardá los recibos",
    color: "bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-900",
    body: "Dejá el ticket del mercado o la factura en un lugar fijo. Si algo no cierra en el mes, podés comparar con lo cargado en la app y encontrar el descuadre.",
  },
  {
    icon: "📱",
    title: "Cargá los gastos al toque",
    color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900",
    body: "Lo que no se registra, no existe. Cargá el gasto apenas lo hacés (o usá «Pagar» en Cuentas fijas). Dos semanas sin cargar y el reporte deja de servir.",
  },
];

export default function TipsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">💡 Tips y recomendaciones</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Consejos prácticos para organizar la economía del hogar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t) => (
          <section
            key={t.title}
            className={`rounded-2xl border p-4 ${t.color}`}
          >
            <h2 className="mb-1.5 text-sm font-bold">
              {t.icon} {t.title}
            </h2>
            <p className="text-xs leading-relaxed opacity-90">{t.body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">🏝️ Hecho para Paraguay</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Todo en guaraníes, categorías locales (ANDE, ESSAP, mercado) y pensado para
          familias que organizan la plata entre varios.
        </p>
      </section>
    </div>
  );
}
