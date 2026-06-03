"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookCarouselProps {
  title: string;
  books: Book[];
  onBookClick: (book: Book) => void;
}

export function BookCarousel({ title, books, onBookClick }: BookCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (books.length === 0) return null;

  return (
    <div className="relative group py-4">
      <h2 className="text-xl font-semibold mb-4 px-4 md:px-12 text-foreground">
        {title}
      </h2>

      <div className="relative">
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 rounded-none bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => onBookClick(book)} />
          ))}
        </div>

        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 rounded-none bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer transition-all duration-300 ease-out",
        isHovered ? "scale-110 z-10" : "scale-100"
      )}
      style={{ width: "160px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover"
          sizes="160px"
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <h3 className="text-sm font-semibold text-white line-clamp-2">{book.title}</h3>
          <p className="text-xs text-white/70 mt-1">{book.author}</p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-white/90">{book.rating}</span>
          </div>
          <div className="mt-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                book.availableCopies > 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {book.availableCopies > 0
                ? `${book.availableCopies} disponíveis`
                : "Indisponível"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
