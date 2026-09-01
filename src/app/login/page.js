'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InteractiveLoginPage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* CSS STYLES */}
      <style jsx global>{`
        @keyframes floatCharacter {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-float {
          animation: floatCharacter 3.5s ease-in-out infinite;
        }
        .animate-modal {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-backdrop {
          animation: backdropFade 0.25s ease forwards;
        }
        .btn-portal {
          background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-portal:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.5);
        }
      `}</style>

      {/* HEADER PEMERINTAH KABUPATEN MALANG */}
      <div style={{ textAlign: 'center', marginBottom: '28px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '10px' }}>
          {/* Path Logo dari folder /public */}
          <img 
            src="/logo-kab-malang.png" 
            alt="Logo Kabupaten Malang" 
            style={{ width: '48px', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          />
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', lineHeight: '1.2' }}>
              PEMERINTAH KABUPATEN MALANG
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#93c5fd', letterSpacing: '0.5px' }}>
              Inspektorat Daerah
            </span>
          </div>
        </div>
      </div>

      {/* KARTU AKSES UTAMA */}
      <div 
        onClick={() => setShowLoginModal(true)}
        className="animate-float"
        style={{
          cursor: 'pointer',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          padding: '36px 32px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: '380px',
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        {/* Kontainer Logo Dalam Kartu */}
        <div style={{ 
          width: '84px', 
          height: '84px', 
          margin: '0 auto 18px auto', 
          backgroundColor: '#f8fafc', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 8px 16px -4px rgba(0,0,0,0.1)',
          padding: '10px'
        }}>
          <img 
            src="/logo-kab-malang.png" 
            alt="Kabupaten Malang" 
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

        <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
          Sistem Layanan Surat Otomatis
        </div>
        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Portal pembuatan Naskah Dinas & Administrasi Penugasan Resmi Inspektorat Kabupaten Malang.
        </p>

        <button 
          onClick={(e) => { e.stopPropagation(); setShowLoginModal(true); }}
          className="btn-portal"
          style={{
            width: '100%',
            padding: '13px',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🔑</span> Masuk Ke Portal Dinas
        </button>
      </div>

      {/* POPUP MODAL LOGIN */}
      {showLoginModal && (
        <div className="animate-backdrop" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          
          <div className="animate-modal" style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            
            {/* TOMBOL CLOSE */}
            <button 
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>

            {/* HEADER MODAL DENGAN LOGO */}
            <div style={{ textAlignment: 'center', marginBottom: '20px', textAlign: 'center' }}>
              <img 
                src="/logo-kab-malang.png" 
                alt="Logo Kab Malang" 
                style={{ width: '48px', height: 'auto', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Autentikasi Pegawai
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                PEMERINTAH KABUPATEN MALANG
              </h2>
            </div>

            {/* ISIAN LOGIN */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  NIP / Username
                </label>
                <input
                  type="text"
                  placeholder="Masukkan NIP Pegawai..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Kata Sandi
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-portal"
                style={{
                  marginTop: '8px',
                  padding: '14px',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Memverifikasi...' : 'Masuk Portal →'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
