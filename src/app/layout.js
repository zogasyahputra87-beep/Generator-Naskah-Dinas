import Link from 'next/link';

export const metadata = {
  title: 'Sistem Naskah Dinas Inspektorat',
  description: 'Pengelolaan Penugasan dan Naskah Dinas Inspektorat',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, backgroundColor: '#f8fafc', color: '#1e293b' }}>
        
        {/* HEADER TOP BAR */}
        <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>INSPEKTORAT</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>| Sistem Penugasan Dinas</span>
          </div>
          
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              Dashboard
            </Link>
            <Link href="/penugasan/baru" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              + Penugasan Baru
            </Link>
            <Link href="/login" style={{ color: '#f87171', textDecoration: 'none', fontSize: '13px', marginLeft: '10px' }}>
              Logout
            </Link>
          </nav>
        </header>

        {/* KONTEN UTAMA */}
        <main>{children}</main>

      </body>
    </html>
  );
}
