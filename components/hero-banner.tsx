"use client";

import Image from "next/image";
import { Play, Info } from "lucide-react";
import type { Book } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  book: Book;
  onOpenBook: (book: Book) => void;
}

export function HeroBanner({ book, onOpenBook }: HeroBannerProps) {
  return (
    <div className="relative h-[70vh] min-h-[500px] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-4 md:px-12">
        <div className="max-w-2xl space-y-6">
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Destaque da Semana
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mt-2 text-balance">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">{book.author}</p>
          </div>

          <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
            {book.description}
          </p>

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => onOpenBook(book)}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Emprestar Agora
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => onOpenBook(book)}
              className="gap-2"
            >
              <Info className="h-5 w-5" />
              Mais Informações
            </Button>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>{book.genre}</span>
            <span>|</span>
            <span>{book.publishedYear}</span>
            <span>|</span>
            <span
              className={
                book.availableCopies > 0 ? "text-emerald-500" : "text-red-500"
              }
            >
              {book.availableCopies} cópias disponíveis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
