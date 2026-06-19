import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Define strict security limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
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

    const uniqueSuffix = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}.${extension}`;

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
    console.error('Upload Error:', err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}