"use client";

import { useEffect, useState } from "react";

// Mostra o tempo restante (mm:ss) até a reserva expirar. Quando zera, avisa
// que a reserva expirou.
export function ReservationCountdown({
  expiresAt,
  className = "",
}: {
  expiresAt?: Date;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!expiresAt) return null;

  const ms = expiresAt.getTime() - now;
  if (ms <= 0) {
    return <span className={`text-red-500 ${className}`}>Reserva expirada</span>;
  }

  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return <span className={className}>{label}</span>;
}
