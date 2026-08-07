'use client';
import { useState, useEffect } from 'react';

// KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

// URL Logo Kabupaten Malang
const LOGO_KAB_MALANG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lambang_Kabupaten_Malang.png/1200px-Lambang_Kabupaten_Malang.png';

export default function HomePage() {
  const [klasifikasi, setKlasifikasi] = useState('700.1.2');
  const [nomorUrut, setNomorUrut] = useState('');
  const kodeOPD = '35.07.200';
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(today);
  const [tanggalSPD, setTanggalSPD] = useState(today);
  const tahun = tanggal ? new Date(tanggal).getFullYear() : new Date().getFullYear();

  const nomorSuratLengkap = `${klasifikasi}/${nomorUrut || '...'}/${kodeOPD}/${tahun}`;
  const [penugasan, setPenugasan] = useState('');
  const [tempatTujuan, setTempatTujuan] = useState('');

  // Master Data Pegawai dari Supabase
  const [masterPegawai, setMasterPegawai] = useState([]);
  const [loadingPegawai, setLoadingPegawai] = useState(true);

  // Dynamic Lists Form
  const [dasarList, setDasarList] = useState([{ no: '1', isi_dasar: '' }]);
  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '', selected: true }
  ]);
  const [tampilkanParaf, setTampilkanParaf] = useState(true);
  const [parafList, setParafList] = useState([
    { jabatan_paraf: 'Plt. Sekretaris' },
    { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
    { jabatan_paraf: 'Auditor Ahli Madya' }
  ]);

  // Modal Views State
  const [showPreviewSurat, setShowPreviewSurat] = useState(false);
  const [showPreviewSPD, setShowPreviewSPD] = useState(false);
  const [spdPrintData, setSpdPrintData] = useState([]);

  // Fetch Bezitting Pegawai dari Supabase REST API
  useEffect(() => {
    async function fetchPegawai() {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/pegawai?select=*&order=nama.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMasterPegawai(data);
        }
      } catch (err) {
        console.error('Gagal mengambil data dari Supabase:', err);
      } finally {
        setLoadingPegawai(false);
      }
    }

    if (!SUPABASE_URL.includes('AKUN_SUPABASE_ANDA')) {
      fetchPegawai();
    }
  }, []);

  const handleSelectPegawaiOtomatis = (index, selectedId) => {
    const p = masterPegawai.find((item) => String(item.id) === String(selectedId));
    if (p) {
      const updated = [...pegawaiList];
      updated[index] = {
        ...updated[index],
        id_supabase: p.id,
        nama: p.nama || '',
        nip: p.nip || '',
        pangkat_gol: p.pangkat_gol || '',
        jabatan: p.jabatan || '',
        selected: true
      };
      setPegawaiList(updated);
    }
  };

  const handleDasarChange = (index, value) => {
    const updated = [...dasarList];
    updated[index].isi_dasar = value;
    setDasarList(updated);
  };
  const tambahDasar = () => setDasarList([...dasarList, { no: String(dasarList.length + 1), isi_dasar: '' }]);
  const hapusDasar = (index) => {
    setDasarList(dasarList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const toggleSelectPegawai = (index) => {
    const updated = [...pegawaiList];
    updated[index].selected = !updated[index].selected;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => setPegawaiList([...pegawaiList, { no: String(pegawaiList.length + 1), id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '', selected: true }]);
  const hapusPegawai = (index) => {
    setPegawaiList(pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handleParafChange = (index, value) => {
    const updated = [...parafList];
    updated[index].jabatan_paraf = value;
    setParafList(updated);
  };
  const tambahParaf = () => setParafList([...parafList, { jabatan_paraf: '' }]);
  const hapusParaf = (index) => setParafList(parafList.filter((_, i) => i !== index));

  // Handler Download Surat Tugas (.docx)
  const handleDownloadDocx = async () => {
    const payload = {
      nomor_surat: nomorSuratLengkap,
      dasar_list: dasarList,
      pegawai_list: pegawaiList,
      penugasan: penugasan,
      tanggal: tanggal,
      tampilkan_paraf: tampilkanParaf,
      paraf_list: parafList
    };

    const response = await fetch('/api/generate-surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Tugas_${nomorSuratLengkap.replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh file Word Surat Tugas.');
    }
  };

  // Handler Download SPD Word (.docx)
  const handleDownloadSPDWord = async (targetList) => {
    const listPegawaiToDownload = targetList || pegawaiList.filter(p => p.selected && p.nama);

    if (listPegawaiToDownload.length === 0) {
      alert('Silakan pilih minimal 1 pegawai!');
      return;
    }

    const p = listPegawaiToDownload[0]; // Download per orang untuk Word
    const payloadSPD = {
      nomor_spd: `000.1.2.3/${nomorUrut || '...'}/${kodeOPD}/${tahun}`,
      nama: p.nama,
      nip: p.nip,
      pangkat_gol: p.pangkat_gol,
      jabatan: p.jabatan,
      maksud_penugasan: penugasan,
      tempat_tujuan: tempatTujuan || 'Lokasi Penugasan',
      tgl_berangkat: tanggal,
      tgl_kembali: tanggal,
      tgl_spd: tanggalSPD,
    };

    try {
      const response = await fetch('/api/generate-spd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadSPD),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPD_${p.nama.replace(/[\/\s]+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Gagal mengunduh file Word SPD. Pastikan public/templates/template_spd.docx sudah diupload.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  // Handler Modal Preview SPD PDF
  const handlePrepareSPDPrint = (targetList) => {
    const listPegawaiToPrint = targetList || pegawaiList.filter(p => p.selected && p.nama);
    if (listPegawaiToPrint.length === 0) {
      alert('Silakan pilih minimal 1 pegawai!');
      return;
    }

    const payloadSPDList = listPegawaiToPrint.map(p => ({
      nomor_spd: `000.1.2.3/${nomorUrut || '...'}/${kodeOPD}/${tahun}`,
      nama: p.nama,
      nip: p.nip,
      pangkat_gol: p.pangkat_gol,
      jabatan: p.jabatan,
      maksud_penugasan: penugasan,
      tempat_tujuan: tempatTujuan || 'Lokasi Penugasan',
      tgl_berangkat: tanggal,
      tgl_kembali: tanggal,
      tgl_spd: tanggalSPD,
    }));

    setSpdPrintData(payloadSPDList);
    setShowPreviewSPD(true);
  };

  const formatTanggalIndo = (str) => {
    if (!str) return '-';
    const date = new Date(str);
    return isNaN(date.getTime()) ? str : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <main style={{ maxWidth: '850px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* FORMULIR INPUT */}
      <div className="no-print" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Sistem Naskah Dinas Inspektorat</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); setShowPreviewSurat(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Penomoran & Tanggal Surat */}
          <div style={{ border: '1px solid #0066cc', padding: '15px', borderRadius: '6px', backgroundColor: '#f0f7ff' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#004080' }}>Penomoran & Tanggal Surat:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode Klasifikasi</label>
                <select value={klasifikasi} onChange={(e) => setKlasifikasi(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                  <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nomor Urut Surat</label>
                <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 015" required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode OPD (Otomatis)</label>
                <input type="text" value={kodeOPD} disabled style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9ecef', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Tgl. Surat Tugas</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#d9534f' }}>Tgl. Cetak SPD (Custom)</label>
                <input type="date" value={tanggalSPD} onChange={(e) => setTanggalSPD(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box', border: '1px solid #d9534f' }} />
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '6px', backgroundColor: '#fff', border: '1px dashed #0066cc', borderRadius: '4px', textAlign: 'center' }}>
              Preview Nomor: <strong style={{ color: '#0066cc' }}>{nomorSuratLengkap}</strong>
            </div>
          </div>

          {/* Dasar Hukum */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Dasar Hukum:</label>
            {dasarList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '8px 0' }}>{item.no}.</span>
                <input value={item.isi_dasar} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px' }} />
                {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>}
              </div>
            ))}
            <button type="button" onClick={tambahDasar} style={{ padding: '6px 12px', cursor: 'pointer' }}>+ Tambah Dasar Hukum</button>
          </div>

          {/* Pegawai / Bezitting Supabase */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Daftar Personil Yang Ditugaskan:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadSPDWord()}
                  style={{ backgroundColor: '#0066cc', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  📥 Unduh Word SPD (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrepareSPDPrint()}
                  style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  🖨️ Cetak / Simpan PDF
                </button>
              </div>
            </div>

            {pegawaiList.map((item, index) => (
              <div key={index} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={item.selected ?? true}
                      onChange={() => toggleSelectPegawai(index)}
                    />
                    Pegawai Ke-{item.no} (Centang untuk cetak SPD)
                  </label>
                  {item.nama && (
                    <button
                      type="button"
                      onClick={() => handleDownloadSPDWord([item])}
                      style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      📄 Word Orang Ini Saja
                    </button>
                  )}
                </div>
                
                {/* PILIH OTOMATIS DARI SUPABASE */}
                <div style={{ marginBottom: '10px', backgroundColor: '#eef6ff', padding: '8px', borderRadius: '4px', border: '1px solid #b3d7ff' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#004080' }}>
                    ⚡ Pilih Cepat dari Master Bezitting Supabase:
                  </label>
                  <select
                    onChange={(e) => handleSelectPegawaiOtomatis(index, e.target.value)}
                    value={item.id_supabase || ""}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', cursor: 'pointer' }}
                  >
                    <option value="" disabled>
                      {loadingPegawai ? 'Memuat data pegawai...' : '-- Klik untuk Memilih Pegawai --'}
                    </option>
                    {masterPegawai.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} - {p.jabatan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INPUT DATA PEGAWAI */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap" required style={{ padding: '8px' }} />
                  <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required style={{ padding: '8px' }} />
                  <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat/Gol" required style={{ padding: '8px' }} />
                  <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan" required style={{ padding: '8px' }} />
                </div>
                {pegawaiList.length > 1 && <button type="button" onClick={() => hapusPegawai(index)} style={{ color: 'red', marginTop: '8px', cursor: 'pointer' }}>Hapus Pegawai Ini</button>}
              </div>
            ))}
            <button type="button" onClick={tambahPegawai} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#eef', border: '1px solid #99c' }}>+ Tambah Personil</button>
          </div>

          {/* Maksud Penugasan & Lokasi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Untuk (Maksud Penugasan):</label>
              <textarea value={penugasan} onChange={(e) => setPenugasan(e.target.value)} rows="3" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tempat Tujuan SPD (Khusus SPD):</label>
              <textarea value={tempatTujuan} onChange={(e) => setTempatTujuan(e.target.value)} placeholder="Contoh: Desa Srigonco Kecamatan Bantur" rows="3" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Paraf Hierarki */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={tampilkanParaf} onChange={(e) => setTampilkanParaf(e.target.checked)} />
              Cetak Tabel Paraf Hierarki
            </label>
            {tampilkanParaf && (
              <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                {parafList.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input value={item.jabatan_paraf} onChange={(e) => handleParafChange(index, e.target.value)} style={{ flex: 1, padding: '6px' }} />
                    <button type="button" onClick={() => hapusParaf(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>
                  </div>
                ))}
                <button type="button" onClick={tambahParaf} style={{ marginTop: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Tambah Baris Paraf</button>
              </div>
            )}
          </div>

          {/* Tombol Aksi Utama */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, backgroundColor: '#28a745', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              👁️ Preview & Print Surat Tugas
            </button>
            <button type="button" onClick={handleDownloadDocx} style={{ flex: 1, backgroundColor: '#0066cc', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              📥 Unduh Word Surat Tugas (.docx)
            </button>
          </div>

        </form>
      </div>

      {/* MODAL 1: PREVIEW SURAT TUGAS */}
      {showPreviewSurat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px 0' }}>
          <div className="no-print" style={{ width: '100%', maxWidth: '210mm', backgroundColor: '#222', color: '#fff', padding: '12px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 'bold' }}>Pratinjau Surat Tugas (A4)</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                🖨️ Cetak / Print
              </button>
              <button onClick={handleDownloadDocx} style={{ backgroundColor: '#0066cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                📥 Unduh .docx
              </button>
              <button onClick={() => setShowPreviewSurat(false)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                ✕ Tutup
              </button>
            </div>
          </div>

          <div className="print-area" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#fff', padding: '20mm', boxSizing: 'border-box', fontFamily: 'Times New Roman, Times, serif', fontSize: '11pt', lineHeight: '1.3', color: '#000', boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}>
            
            {/* Kop Surat */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '8px', marginBottom: '16px', position: 'relative' }}>
              <img src={LOGO_KAB_MALANG} alt="Logo Kab Malang" style={{ position: 'absolute', left: '10px', top: '0px', width: '65px', height: 'auto' }} />
              <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</div>
              <div style={{ fontSize: '15pt', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</div>
              <div style={{ fontSize: '8.5pt' }}>Jalan Raya Mondoroko 178 Singosari, Kabupaten Malang, Jawa Timur</div>
              <div style={{ fontSize: '8.5pt' }}>Telepon/Faksimile (0341) 451905 Laman: inspektorat.malangkab.go.id</div>
              <div style={{ fontSize: '8.5pt' }}>Pos-el: inspektorat@malangkab.go.id, Kode Pos: 65153</div>
            </div>

            {/* Judul & Nomor */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>SURAT TUGAS</div>
              <div>NOMOR: {nomorSuratLengkap}</div>
            </div>

            {/* Tabel Dasar Hukum */}
            <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Dasar</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {dasarList.map((d, i) => {
                          const isLast = i === dasarList.length - 1;
                          let teks = (d.isi_dasar || '').trim();
                          if (isLast && teks.length > 0) {
                            if (teks.endsWith('.')) teks = teks.slice(0, -1);
                            teks = `${teks}, dengan ini:`;
                          } else if (teks.length > 0) {
                            if (teks.endsWith('.')) teks = teks.slice(0, -1);
                            teks = `${teks};`;
                          }
                          return (
                            <tr key={i}>
                              <td style={{ width: '20px', verticalAlign: 'top', paddingBottom: '4px' }}>{i + 1}.</td>
                              <td style={{ verticalAlign: 'top', paddingBottom: '4px', textAlign: 'justify' }}>{teks}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0' }}>MEMERINTAHKAN:</div>

            {/* Tabel Pegawai */}
            <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Kepada</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top' }}>
                    {pegawaiList.map((p, i) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '20px', verticalAlign: 'top' }}>{i + 1}.</td>
                              <td style={{ width: '100px', verticalAlign: 'top' }}>Nama</td>
                              <td style={{ verticalAlign: 'top' }}>: {p.nama}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>NIP</td>
                              <td>: {p.nip}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>Pangkat/Gol</td>
                              <td>: {p.pangkat_gol}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>Jabatan</td>
                              <td>: {p.jabatan}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Maksud Penugasan */}
            <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Untuk</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'justify' }}>{penugasan}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
            </p>
            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan.
            </p>

            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
            </p>

            {/* Tanda Tangan & Paraf */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', pageBreakInside: 'avoid' }}>
              <div style={{ width: '45%' }}>
                {tampilkanParaf && (
                  <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%', fontSize: '9.5pt' }}>
                    <thead>
                      <tr>
                        <th colSpan="2" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>PARAF HIERARKI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parafList.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #000', padding: '4px' }}>{item.jabatan_paraf}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', width: '45px' }}></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ width: '50%', paddingLeft: '20px', textAlign: 'center' }}>
                Malang, {formatTanggalIndo(tanggal)}<br />
                Plt. Inspektur Kabupaten Malang<br /><br /><br /><br /><br />
                <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                Penata Tingkat I<br />
                NIP. 198008012010011018
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW CETAK PDF SPD */}
      {showPreviewSPD && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px 0' }}>
          <div className="no-print" style={{ width: '100%', maxWidth: '210mm', backgroundColor: '#222', color: '#fff', padding: '12px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 'bold' }}>Pratinjau SPD ({spdPrintData.length} Pegawai) - Siap Cetak/Simpan PDF</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                🖨️ Cetak / Simpan PDF
              </button>
              <button onClick={() => setShowPreviewSPD(false)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                ✕ Tutup
              </button>
            </div>
          </div>

          <div className="print-area" style={{ display: 'flex', flexDirection: 'column' }}>
            {spdPrintData.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* HALAMAN 1 SPD (LEMBAR DEPAN) */}
                <div className="page-break" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#fff', padding: '12mm 15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', lineHeight: '1.25', color: '#000', boxShadow: '0 0 15px rgba(0,0,0,0.3)', position: 'relative' }}>
                  
                  {/* Kop SPD dengan Logo */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '10px', position: 'relative' }}>
                    <img src={LOGO_KAB_MALANG} alt="Logo Kab Malang" style={{ position: 'absolute', left: '10px', top: '0px', width: '55px', height: 'auto' }} />
                    <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</div>
                    <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</div>
                    <div style={{ fontSize: '8pt' }}>Jalan Raya Mondoroko 17B Singosari, Jawa Timur</div>
                    <div style={{ fontSize: '8pt' }}>Telepon. (0341) 451905 Laman: http://inspektorat.malangkab.go.id</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', fontSize: '9pt' }}>
                    <table>
                      <tbody>
                        <tr><td>Lembar ke</td><td>:</td><td>....................</td></tr>
                        <tr><td>Kode No</td><td>:</td><td>....................</td></tr>
                        <tr><td>Nomor</td><td>:</td><td><strong>{item.nomor_spd}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', textDecoration: 'underline', marginBottom: '12px' }}>
                    SURAT PERJALANAN DINAS (S P D)
                  </div>

                  {/* Tabel SPD Halaman 1 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ width: '25px', padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>1.</td>
                        <td style={{ width: '200px', padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Pengguna Anggaran</td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>ARRIE HENDRAWAN MAHADHIEKA, S.H.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>2.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Nama Pegawai yang diperintah</td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>
                          <strong>{item.nama}</strong><br />
                          NIP. {item.nip}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>3.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          a. Pangkat dan Golongan<br />
                          b. Jabatan<br />
                          c. Tingkat Biaya Perjalanan Dinas
                        </td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>
                          {item.pangkat_gol}<br />
                          {item.jabatan}<br />
                          Tingkat B
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>4.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Maksud perjalanan dinas</td>
                        <td style={{ padding: '5px', textAlign: 'justify', verticalAlign: 'top' }}>{item.maksud_penugasan}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>5.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Alat angkutan yang dipergunakan</td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>Angkutan Darat</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>6.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          a. Tempat berangkat<br />
                          b. Tempat tujuan
                        </td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>
                          Inspektorat Daerah Kab. Malang<br />
                          {item.tempat_tujuan}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>7.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          a. Lamanya Perjalanan Dinas<br />
                          b. Tanggal berangkat<br />
                          c. Tanggal harus kembali
                        </td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>
                          1 (satu) hari<br />
                          {formatTanggalIndo(item.tgl_berangkat)}<br />
                          {formatTanggalIndo(item.tgl_kembali)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>8.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Pengikut: Nama</td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>-</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>9.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          Pembebanan Anggaran<br />
                          a. SKPD<br />
                          b. Akun
                        </td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>
                          <br />
                          Inspektorat Daerah Kabupaten Malang<br />
                          -
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>10.</td>
                        <td style={{ padding: '5px', borderRight: '1px solid #000', verticalAlign: 'top' }}>Keterangan lain-lain</td>
                        <td style={{ padding: '5px', verticalAlign: 'top' }}>-</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* TTD Halaman 1 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <div style={{ width: '280px', textAlign: 'center' }}>
                      <div style={{ textAlign: 'left', marginBottom: '4px' }}>
                        Dikeluarkan di : Singosari<br />
                        Tanggal : {formatTanggalIndo(item.tgl_spd)}
                      </div>
                      <strong style={{ display: 'block', margin: '8px 0' }}>Pengguna Anggaran</strong>
                      <div style={{ height: '65px' }}></div>
                      <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                      <span>NIP. 198008012010011018</span>
                    </div>
                  </div>
                </div>

                {/* HALAMAN 2 SPD (VISUM / LEMBAR BELAKANG DENGAN TTD LURUS SIMETRIS) */}
                <div className="page-break" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#fff', padding: '12mm 15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '9pt', lineHeight: '1.2', color: '#000', boxShadow: '0 0 15px rgba(0,0,0,0.3)', position: 'relative' }}>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <tbody>
                      {/* Kolom I */}
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ width: '50%', padding: '6px', borderRight: '1px solid #000', verticalAlign: 'top' }}></td>
                        <td style={{ width: '50%', padding: '6px', verticalAlign: 'top' }}>
                          I. Berangkat dari : Inspektorat Daerah Kab. Malang<br />
                          &nbsp;&nbsp;&nbsp;Ke : {item.tempat_tujuan}<br />
                          &nbsp;&nbsp;&nbsp;Pada Tanggal : {formatTanggalIndo(item.tgl_berangkat)}<br />
                          <div style={{ textAlign: 'center', marginTop: '6px' }}>
                            Plt. Inspektur Kabupaten Malang<br /><br /><br /><br />
                            <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                            <span>NIP. 198008012010011018</span>
                          </div>
                        </td>
                      </tr>
                      {/* Kolom II */}
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          II. Tiba di : {item.tempat_tujuan}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal : {formatTanggalIndo(item.tgl_berangkat)}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Kepala : ..............................................<br /><br /><br />
                          &nbsp;&nbsp;&nbsp;&nbsp;(.........................................................)<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;NIP.
                        </td>
                        <td style={{ padding: '6px', verticalAlign: 'top' }}>
                          Berangkat dari : {item.tempat_tujuan}<br />
                          Ke : Inspektorat Daerah Kab. Malang<br />
                          Pada tanggal : {formatTanggalIndo(item.tgl_kembali)}<br />
                          Kepala : ..............................................<br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                      </tr>
                      {/* Kolom III */}
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          III. Tiba di :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Kepala :<br /><br /><br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(.........................................................)<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NIP.
                        </td>
                        <td style={{ padding: '6px', verticalAlign: 'top' }}>
                          Berangkat dari :<br />
                          Ke :<br />
                          Pada tanggal :<br />
                          Kepala :<br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                      </tr>
                      {/* Kolom IV */}
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                          IV. Tiba kembali di : Inspektorat Daerah Kab. Malang<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : {formatTanggalIndo(item.tgl_kembali)}<br />
                          <div style={{ textAlign: 'center', marginTop: '6px' }}>
                            Plt. Inspektur Kabupaten Malang<br /><br /><br /><br />
                            <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                            <span>NIP. 198008012010011018</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px', verticalAlign: 'top', textAlign: 'justify' }}>
                          Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: '10px', border: '1px solid #000', padding: '6px', fontSize: '8.5pt' }}>
                    <strong>V. Catatan Lain-lain</strong><br />
                    <strong>VI. PERHATIAN</strong><br />
                    Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta Bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan.
                  </div>

                  {/* TTD PENGGUNA ANGGARAN LURUS DI BAGIAN BAWAH VISUM */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <div style={{ width: '280px', textAlign: 'center' }}>
                      <strong>Pengguna Anggaran</strong><br /><br /><br /><br />
                      <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                      <span>NIP. 198008012010011018</span>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; padding: 0 !important; width: 100% !important; }
          .page-break { page-break-after: always !important; break-after: page !important; }
        }
      `}</style>
    </main>
  );
}
