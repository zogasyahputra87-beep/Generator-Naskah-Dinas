import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'template_spd.xlsx'
    );

    // Cek ketersediaan file template
    if (!fs.existsSync(templatePath)) {
      console.error('File template tidak ditemukan di:', templatePath);
      return NextResponse.json(
        { success: false, message: 'Template Excel tidak ditemukan di server.' },
        { status: 444 }
      );
    }

    const fileBuffer = fs.readFileSync(templatePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const dataMapping = {
      '{nomor_spd}': body.nomor_spd || '-',
      '{pengguna_anggaran}': body.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      '{nama}': body.nama || '-',
      '{nip}': body.nip || '-',
      '{pangkat_gol}': body.pangkat_gol || '-',
      '{jabatan}': body.jabatan || '-',
      '{tingkat_biaya}': body.tingkat_biaya || '-',
      '{maksud_penugasan}': body.maksud_penugasan || '-',
      '{alat_angkutan}': body.alat_angkutan || 'Angkutan Darat',
      '{tempat_berangkat}': body.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      '{tempat_tujuan}': body.tempat_tujuan || '-',
      '{lama_hari}': body.lama_hari || '1 (satu) hari',
      '{tgl_berangkat}': formatTanggalIndo(body.tgl_berangkat),
      '{tgl_kembali}': formatTanggalIndo(body.tgl_kembali),
      '{skpd}': body.skpd || 'Inspektorat Daerah Kabupaten Malang',
      '{akun}': body.akun || '-',
      '{keterangan_lain}': body.keterangan_lain || '-',
      '{tgl_spd}': formatTanggalIndo(body.tgl_spd || body.tgl_berangkat),
      '{nip_pa}': body.nip_pa || '198008012010011018'
    };

    // Replace tag pada semua sheet (Sheet 1 & Sheet 2)
    workbook.worksheets.forEach((sheet) => {
      sheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          if (cell.value && typeof cell.value === 'string') {
            let text = cell.value;
            Object.keys(dataMapping).forEach((tag) => {
              if (text.includes(tag)) {
                text = text.replaceAll(tag, dataMapping[tag]);
              }
            });
            cell.value = text;
          }
        });
      });
    });

    const outputBuffer = await workbook.xlsx.writeBuffer();
    const namaFile = `SPD_${(body.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.xlsx`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Gagal generate Excel SPD:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat file Excel SPD.', detail: error.message },
      { status: 500 }
    );
  }
}
