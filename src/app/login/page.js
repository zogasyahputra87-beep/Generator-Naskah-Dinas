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
      background: 'radial-gradient(circle at 50% 30%, #e0e7ff 0%, #f8fafc 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* ANIMASI CSS MODAL & CHARACTER */}
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
          animation: floatCharacter 3s ease-in-out infinite;
        }
        .animate-modal {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-backdrop {
          animation: backdropFade 0.25s ease forwards;
        }
        .btn-portal {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-portal:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
        }
      `}</style>

      {/* TAIL/HEADER MEREK INPEKTORAT */}
      <div style={{ textAlign: 'center', marginBottom: '24px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
            🏛️
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '-0.5px' }}>
            SIM-PENUGASAN
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          Inspektorat Daerah Kabupaten Malang
        </p>
      </div>

      {/* ILUSTRASI / ANIMASI KARAKTER UTAMA */}
      <div 
        onClick={() => setShowLoginModal(true)}
        className="animate-float"
        style={{
          cursor: 'pointer',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          padding: '32px 40px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(30, 27, 75, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          maxWidth: '380px',
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}
      >
        {/* GIF / ANIMASI KARAKTER (Bisa diganti dengan Lottie Player / SVG Animasi) */}
        <div style={{ fontSize: '72px', marginBottom: '12px', lineHeight: 1 }}>
          👨‍💼💼
        </div>

        <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', marginBottom: '6px' }}>
          Halo! Siap Bertugas Hari Ini?
        </div>
        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Klik karakter atau tombol di bawah ini untuk membuka pintu layanan naskah dinas & audit.
        </p>

        <button 
          onClick={(e) => { e.stopPropagation(); setShowLoginModal(true); }}
          className="btn-portal"
          style={{
            width: '100%',
            padding: '12px',
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
          <span>🔑</span> Klik Untuk Masuk Akun
        </button>
      </div>

      {/* POPUP / JENDELA LOGIN MODAL (MUNCUL SAAT DIKLIK) */}
      {showLoginModal && (
        <div className="animate-backdrop" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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

            {/* HEADER MODAL */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Autentikasi Pengguna
              </div>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Jendela Masuk Sistem
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
