"use client";

import { useState, useMemo } from "react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { HeroBanner } from "@/components/hero-banner";
import { SlideCarousel } from "@/components/slide-carousel";
import { BookCarousel } from "@/components/book-carousel";
import { BookModal } from "@/components/book-modal";
import type { Book } from "@/lib/types";

export default function HomePage() {
  const { books, slides } = useLibrary();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const featuredBook = books[0];

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  const booksByGenre = useMemo(() => {
    const grouped: Record<string, Book[]> = {};
    const usedGenres = Array.from(
      new Set(filteredBooks.map((book) => book.genre).filter(Boolean))
    );
    usedGenres.forEach((genre) => {
      const genreBooks = filteredBooks.filter((book) => book.genre === genre);
      if (genreBooks.length > 0) {
        grouped[genre] = genreBooks;
      }
    });
    return grouped;
  }, [filteredBooks]);

  const recentlyAdded = useMemo(() => {
    return [...filteredBooks].slice(0, 10);
  }, [filteredBooks]);

  const available = useMemo(() => {
    return filteredBooks.filter((book) => book.availableCopies > 0).slice(0, 10);
  }, [filteredBooks]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main>
        {!searchQuery &&
          (slides.length > 0 ? (
            <SlideCarousel slides={slides} />
          ) : (
            featuredBook && (
              <HeroBanner book={featuredBook} onOpenBook={setSelectedBook} />
            )
          ))}

        <div className="pb-20 space-y-2">
          {searchQuery && (
            <div className="px-4 md:px-12 py-8">
              <h2 className="text-2xl font-bold text-foreground">
                Resultados para &quot;{searchQuery}&quot;
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredBooks.length} livro(s) encontrado(s)
              </p>
            </div>
          )}

          {searchQuery ? (
            <BookCarousel
              title="Resultados da Busca"
              books={filteredBooks}
              onBookClick={setSelectedBook}
            />
          ) : (
            <>
              <BookCarousel
                title="Disponíveis Agora"
                books={available}
                onBookClick={setSelectedBook}
              />

              <BookCarousel
                title="Adicionados Recentemente"
                books={recentlyAdded}
                onBookClick={setSelectedBook}
              />

              {Object.entries(booksByGenre).map(([genre, genreBooks]) => (
                <BookCarousel
                  key={genre}
                  title={genre}
                  books={genreBooks}
                  onBookClick={setSelectedBook}
                />
              ))}
            </>
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
