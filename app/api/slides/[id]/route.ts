import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/slides/[id] — edita um slide.
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const { title, description, imageUrl } = await req.json();

  try {
    const slide = await prisma.slide.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined
          ? { description: String(description).trim() }
          : {}),
        ...(imageUrl !== undefined ? { imageUrl: String(imageUrl).trim() } : {}),
      },
    });
    return NextResponse.json({
      slide: {
        id: slide.id,
        title: slide.title,
        description: slide.description,
        imageUrl: slide.imageUrl,
      },
    });
  } catch {
    return NextResponse.json({ error: "Slide não encontrado." }, { status: 404 });
  }
}

// DELETE /api/slides/[id] — remove um slide.
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.slide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Slide não encontrado." }, { status: 404 });
  }
}
