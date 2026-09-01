import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_st.docx');
    let content;

    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath);
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const response = await fetch(`${protocol}://${host}/templates/template_st.docx`, { cache: 'no-store' });

      if (!response.ok) {
        return NextResponse.json({ message: 'Template ST tidak ditemukan' }, { status: 404 });
      }
      const arrayBuffer = await response.arrayBuffer();
      content = Buffer.from(arrayBuffer);
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // Formatting Data Personil
    const personilFormatted = (Array.isArray(body.personil) ? body.personil : []).map((p, index) => ({
      no: index + 1,
      nama: p.nama || '-',
      nip: p.nip || '-',
      pangkat_gol: p.pangkat_gol || '-',
      jabatan: p.jabatan || '-'
    }));

    // Formatting Dasar Hukum
    const dasarFormatted = (Array.isArray(body.dasar_hukum) ? body.dasar_hukum : []).map((d, index, arr) => {
      let teks = typeof d === 'object' ? (d?.dasar_hukum || d?.teks || '') : String(d || '');
      teks = teks.trim().replace(/[.;,]+$/, '');
      return {
        no: index + 1,
        teks: index === arr.length - 1 ? `${teks}, dengan ini:` : `${teks};`
      };
    });

    const payloadST = {
      nomor_surat: body.nomor_surat || '-',
      maksud_penugasan: body.maksud_penugasan || '-',
      tempat_tujuan: body.tempat_tujuan ? ` bertempat di ${body.tempat_tujuan}.` : '.',
      tanggal_surat: body.tanggal_surat || '-',
      dasar_hukum: dasarFormatted,
      personil: personilFormatted,
      inspektur_nama: 'ARRIE HENDRAWAN MAHARDHIEKA, S.H.',
      inspektur_nip: '198008012010011018'
    };

    doc.setData(payloadST);
    doc.render();

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    const safeNum = (body.nomor_surat || 'Naskah').replace(/[\/\\\s]+/g, '_');

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Surat_Tugas_${safeNum}.docx"`
      }
    });

  } catch (error) {
    console.error('API Generate ST Error:', error);
    return NextResponse.json({ message: 'Gagal merender Surat Tugas', error: error.message }, { status: 500 });
  }
}
