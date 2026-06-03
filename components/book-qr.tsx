"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/types";

// Prefixo que identifica nossos QRs (o scanner reconhece "BIBLIO:<id>").
export const QR_PREFIX = "BIBLIO:";

export function BookQR({ book, size = 160 }: { book: Book; size?: number }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const value = `${QR_PREFIX}${book.id}`;

  function printLabel() {
    const svg = wrapRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=420,height=560");
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><title>Etiqueta - ${book.title}</title>
       <style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px}
       h1{font-size:16px;margin:16px 0 4px}p{font-size:12px;color:#555;margin:0}</style>
       </head><body>${svg}<h1>${book.title}</h1><p>${book.author}</p>
       <p>ISBN: ${book.isbn || "—"}</p></body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrapRef} className="rounded-lg bg-white p-3">
        <QRCodeSVG value={value} size={size} marginSize={4} />
      </div>
      <Button variant="outline" size="sm" onClick={printLabel}>
        <Printer className="mr-2 h-4 w-4" />
        Imprimir etiqueta
      </Button>
    </div>
  );
}
