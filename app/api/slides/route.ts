import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";

// GET /api/slides — lista pública (carrossel da home).
export async function GET() {
  const slides = await prisma.slide.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({
    slides: slides.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl,
    })),
  });
}

// POST /api/slides — cria um slide (admin/bibliotecário).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { title, description, imageUrl } = await req.json();
  if (!String(title || "").trim()) {
    return NextResponse.json({ error: "Informe um título." }, { status: 400 });
  }

  const slide = await prisma.slide.create({
    data: {
      title: String(title).trim(),
      description: String(description || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
    },
  });
  return NextResponse.json(
    {
      slide: {
        id: slide.id,
        title: slide.title,
        description: slide.description,
        imageUrl: slide.imageUrl,
      },
    },
    { status: 201 }
  );
}
