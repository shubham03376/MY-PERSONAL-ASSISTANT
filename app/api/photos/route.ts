import { NextRequest, NextResponse } from "next/server";
import { getPhotos, savePhoto } from "@/lib/vault-store";
import { uploadOrUpdateFileToGitHub } from "@/lib/github-storage";
import { getSessionUser } from "@/lib/auth";
import { validatePhotoUpload } from "@/lib/file-validator";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photos = await getPhotos(session.sub);
    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Failed to fetch photos:", err);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) || "";
    const title = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const validation = validatePhotoUpload(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const photo = await savePhoto(
      session.sub,
      buffer,
      validation.sanitizedName || file.name,
      file.type,
      caption,
      title || validation.sanitizedName || file.name
    );

    uploadOrUpdateFileToGitHub(
      `vault/${session.username}/photos/${photo.filename}`,
      buffer,
      `Upload photo: ${photo.originalName}`
    ).catch(() => {});

    return NextResponse.json({ success: true, photo }, { status: 201 });
  } catch (err) {
    console.error("Photo upload failed:", err);
    return NextResponse.json({ error: "Photo upload failed" }, { status: 500 });
  }
}
