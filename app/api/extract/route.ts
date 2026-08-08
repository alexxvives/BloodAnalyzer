import { requireUser } from "@/lib/auth/session";
import { extractFromFile } from "@/lib/extraction";
import { buildUploadKey, getUploadStore } from "@/lib/storage/uploads";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Accepts multipart upload, stores via UploadStore (R2 when bound),
 * runs the extraction pipeline, returns structured markers for confirmation.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: "File too large (max 12MB)" },
      { status: 400 },
    );
  }

  try {
    const key = buildUploadKey({ userId: user.id, filename: file.name });
    const buffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";
    const stored = await (await getUploadStore()).put(key, buffer, contentType);

    const extractable = new File([buffer], file.name, { type: contentType });
    const extraction = await extractFromFile(extractable);

    return NextResponse.json({
      upload: stored,
      extraction,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
