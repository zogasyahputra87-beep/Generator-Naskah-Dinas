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
    const listPegawai = body.pegawai_spd || (body.nama ? [body] : []);

    if (listPegawai.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data pegawai untuk dicetak.' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.xlsx');

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ success: false, message: 'Template Excel tidak ditemukan di server.' }, { status: 444 });
    }

    const fileBuffer = fs.readFileSync(templatePath);
    const outputWorkbook = new ExcelJS.Workbook();

    for (let index = 0; index < listPegawai.length; index++) {
      const dataPegawai = listPegawai[index];

      // Membaca template master per pegawai
      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(fileBuffer);

      const dataMapping = {
        '{nomor_spd}': dataPegawai.nomor_spd || '-',
        '{pengguna_anggaran}': dataPegawai.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
        '{nama}': dataPegawai.nama || '-',
        '{nip}': dataPegawai.nip || '-',
        '{pangkat_gol}': dataPegawai.pangkat_gol || '-',
        '{jabatan}': dataPegawai.jabatan || '-',
        '{tingkat_biaya}': dataPegawai.tingkat_biaya || '-',
        '{maksud_penugasan}': dataPegawai.maksud_penugasan || '-',
        '{alat_angkutan}': dataPegawai.alat_angkutan || 'Angkutan Darat',
        '{tempat_berangkat}': dataPegawai.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
        '{tempat_tujuan}': dataPegawai.tempat_tujuan || '-',
        '{lama_hari}': dataPegawai.lama_hari || '1 (satu) hari',
        '{tgl_berangkat}': formatTanggalIndo(dataPegawai.tgl_berangkat),
        '{tgl_kembali}': formatTanggalIndo(dataPegawai.tgl_kembali),
        '{skpd}': dataPegawai.skpd || 'Inspektorat Daerah Kabupaten Malang',
        '{akun}': dataPegawai.akun || '-',
        '{keterangan_lain}': dataPegawai.keterangan_lain || '-',
        '{tgl_spd}': formatTanggalIndo(dataPegawai.tgl_spd || dataPegawai.tgl_berangkat),
        '{nip_pa}': dataPegawai.nip_pa || '198008012010011018'
      };

      // Terapkan data ke sheet
      templateWorkbook.worksheets.forEach((sheet, sheetIdx) => {
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

        // Penamaan Sheet unik per pegawai
        const cleanNama = (dataPegawai.nama || `Pegawai_${index + 1}`).substring(0, 15).replace(/[\\/*?:[\]]/g, '');
        const sheetName = sheetIdx === 0 ? `Depan_${cleanNama}` : `Belakang_${cleanNama}`;
        sheet.name = sheetName;
      });

      // Pindahkan sheet dari templateWorkbook ke outputWorkbook utama
      templateWorkbook.worksheets.forEach((sheet) => {
        const newSheet = outputWorkbook.addWorksheet(sheet.name);
        newSheet.model = sheet.model;
      });
    }

    const outputBuffer = await outputWorkbook.xlsx.writeBuffer();
    const namaFile = `SPD_GABUNGAN_${listPegawai.length}_PEGAWAI.xlsx`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Gagal generate Excel SPD Massal:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat file Excel SPD Massal.', detail: error.message },
      { status: 500 }
    );
  }
}
