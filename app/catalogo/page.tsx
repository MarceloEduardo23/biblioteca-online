"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Star, Filter } from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { BookModal } from "@/components/book-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CatalogoPage() {
  const { books } = useLibrary();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const genreOptions = useMemo(
    () => ["Todos", ...Array.from(new Set(books.map((b) => b.genre).filter(Boolean)))],
    [books]
  );

  const filteredBooks = useMemo(() => {
    let result = books;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    if (selectedGenre !== "Todos") {
      result = result.filter((book) => book.genre === selectedGenre);
    }

    return result;
  }, [books, searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 md:px-12 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Catálogo</h1>
              <p className="text-muted-foreground mt-1">
                {filteredBooks.length} livro(s) encontrado(s)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por título ou autor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-0"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div
            className={cn(
              "flex flex-wrap gap-2",
              !showFilters && "hidden md:flex"
            )}
          >
            {genreOptions.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="cursor-pointer group"
                onClick={() => setSelectedBook(book)}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                  {book.availableCopies === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Indisponível
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-foreground line-clamp-1 text-sm">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.author}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    {book.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Nenhum livro encontrado
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Tente ajustar os filtros ou busca
              </p>
            </div>
          )}
        </div>
      </main>

      <BookModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
