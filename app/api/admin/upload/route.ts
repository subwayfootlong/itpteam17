import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { randomUUID } from 'node:crypto';

// Define strict security limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  try {
    let formData: FormData;
    try { formData = await req.formData(); } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ==========================================
    // 🛡️ SECURITY CHECKS
    // ==========================================
    
    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' }, 
        { status: 400 }
      );
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WEBP are allowed.' }, 
        { status: 400 }
      );
    }

    // ==========================================

    const header = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const matchesSignature =
      (file.type === 'image/jpeg' && header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
      (file.type === 'image/png' && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.type === 'image/webp' && header.length >= 16 && header.toString('ascii', 0, 4) === 'RIFF' &&
        header.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(header.toString('ascii', 12, 16)) &&
        header.readUInt32LE(4) + 8 === file.size);
    if (!matchesSignature) {
      return NextResponse.json({ error: 'Image contents do not match the declared file type' }, { status: 400 });
    }
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const fileName = `${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('pergas-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('pergas-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });

  } catch (err) {
    console.error('Upload Error:');
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
