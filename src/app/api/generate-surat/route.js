import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();

    // Membaca file template dari public/templates/template_surat_tugas.docx
    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'template_surat_tugas.docx'
    );

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Mengganti tanda {variabel} di Word dengan data dari form
    doc.render({
      nomor_surat: body.nomor_surat || '-',
      nama: body.nama || '-',
      nip: body.nip || '-',
      jabatan: body.jabatan || '-',
      kegiatan: body.kegiatan || '-',
      tanggal: body.tanggal || '-',
    });

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const namaFile = `Surat_Tugas_${(body.nama || 'Baru').replace(/\s+/g, '_')}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Gagal generate surat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat dokumen.' },
      { status: 500 }
    );
  }
}
