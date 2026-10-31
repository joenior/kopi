import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      return new NextResponse(sqlContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    return new NextResponse('-- File schema.sql tidak ditemukan', { status: 404 });
  } catch {
    return new NextResponse('-- Error membaca file schema', { status: 500 });
  }
}
