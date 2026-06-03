"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, AlertCircle } from "lucide-react";

// Formatos que nos interessam: QR (etiqueta do exemplar) e os códigos de barras
// usados em livros (ISBN costuma vir como EAN-13).
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
]);

type Props = {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
};

export function BarcodeScanner({ onResult, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  // Guarda a última leitura para evitar disparos repetidos do mesmo código.
  const lastRef = useRef<{ text: string; t: number }>({ text: "", t: 0 });
  // Refs para os callbacks, evitando reiniciar a câmera a cada render do pai.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    // A câmera só funciona em contexto seguro (HTTPS ou localhost).
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setStatus("error");
      setMessage(
        "A câmera exige HTTPS. Acesse pelo site publicado (Vercel) ou por https — em http comum (IP da rede) o navegador bloqueia a câmera."
      );
      onErrorRef.current?.("insecure-context");
      return;
    }

    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current as HTMLVideoElement,
          (result) => {
            if (!result) return;
            const text = result.getText();
            const now = Date.now();
            if (text === lastRef.current.text && now - lastRef.current.t < 2500) return;
            lastRef.current = { text, t: now };
            onResultRef.current(text);
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus("scanning");
      } catch (err) {
        setStatus("error");
        const name = (err as { name?: string })?.name || "";
        setMessage(
          name === "NotAllowedError"
            ? "Permissão de câmera negada. Autorize o acesso à câmera e tente de novo."
            : name === "NotFoundError"
            ? "Nenhuma câmera foi encontrada neste dispositivo."
            : "Não foi possível iniciar a câmera."
        );
        onErrorRef.current?.(String(err));
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        className="h-64 w-full object-cover md:h-80"
        muted
        playsInline
        autoPlay
      />
      {/* Moldura-guia */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-56 rounded-lg border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 text-xs text-white/90">
        <Camera className="h-4 w-4" />
        {status === "starting"
          ? "Iniciando câmera…"
          : "Aponte para o ISBN (código de barras) ou o QR do livro"}
      </div>
    </div>
  );
}
