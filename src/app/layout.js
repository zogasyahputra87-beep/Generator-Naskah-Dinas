'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Jalur di mana Sidebar TIDAK perlu ditampilkan (misalnya halaman Login)
  const isLoginPage = pathname === '/login';

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/login');
  };

  if (isLoginPage) {
    return (
      <html lang="id">
        <body style={{ margin: 0, backgroundColor: '#f8fafc', color: '#1e293b' }}>
          <main>{children}</main>
        </body>
      </html>
    );
  }

  // Helper style menu sidebar aktif
  const getMenuItemStyle = (path) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: isActive ? 'bold' : 'normal',
      backgroundColor: isActive ? '#2b6cb0' : 'transparent',
      color: isActive ? '#ffffff' : '#cbd5e0',
      transition: 'all 0.2s ease',
      marginBottom: '6px'
    };
  };

  return (
    <html lang="id">
      <body style={{ margin: 0, backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: 'sans-serif' }}>
        
        {/* TOPBAR / HEADER ATAS */}
        <header style={{ 
          height: '60px', 
          backgroundColor: '#1e293b', 
          color: '#fff', 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          padding: '0 24px', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 100 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.5px' }}>INSPEKTORAT DAERAH</span>
            <span style={{ color: '#64748b', fontSize: '14px' }}>| SIM-PENUGASAN</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Administrator</span>
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#ef4444', 
                color: '#fff', 
                border: 'none', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                cursor: 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              Logout 🚪
            </button>
          </div>
        </header>

        {/* BUNGKUS UTAMA (SIDEBAR + KONTEN) */}
        <div style={{ display: 'flex', marginTop: '60px', minHeight: 'calc(100vh - 60px)' }}>
          
          {/* SIDEBAR NAVIGASI KIRI */}
          <aside style={{ 
            width: '250px', 
            backgroundColor: '#0f172a', 
            padding: '20px 14px', 
            position: 'fixed', 
            top: '60px', 
            bottom: 0, 
            left: 0, 
            overflowY: 'auto' 
          }}>
            
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '10px', letterSpacing: '0.5px' }}>
              Menu Utama
            </div>

            <nav>
              <Link href="/dashboard" style={getMenuItemStyle('/dashboard')}>
                📊 Dashboard
              </Link>

              <Link href="/penugasan/baru" style={getMenuItemStyle('/penugasan/baru')}>
                ➕ Buat Penugasan Baru
              </Link>

              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', paddingLeft: '12px', marginTop: '24px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                Naskah Dinas & Alur
              </div>

              <Link href="/dashboard?filter=st" style={getMenuItemStyle('/dashboard?filter=st')}>
                📄 Surat Tugas & SPD
              </Link>

              <Link href="/dashboard?filter=lhp" style={getMenuItemStyle('/dashboard?filter=lhp')}>
                📋 LHP (Laporan Hasil)
              </Link>

              <Link href="/dashboard?filter=tlhp" style={getMenuItemStyle('/dashboard?filter=tlhp')}>
                ✅ TLHP (Tindak Lanjut)
              </Link>
            </nav>

          </aside>

          {/* AREA KONTEN UTAMA */}
          <main style={{ 
            marginLeft: '250px', 
            flex: 1, 
            padding: '30px', 
            backgroundColor: '#f8fafc',
            minHeight: 'calc(100vh - 60px)' 
          }}>
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}
