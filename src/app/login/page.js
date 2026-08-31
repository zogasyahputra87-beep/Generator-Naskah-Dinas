'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulasi Login Singkat
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(241, 245, 249, 1) 90%), linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-card {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .input-focus:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
        }
        .btn-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          transition: all 0.25s ease;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.4);
        }
      `}</style>

      <div className="animate-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '20px',
        padding: '40px 32px',
        boxShadow: '0 20px 40px -15px rgba(30, 27, 75, 0.08), 0 0 1px 1px rgba(255,255,255,0.9) inset'
      }}>
        
        {/* LOGO & BRANDING */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px auto',
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}>
            <img src="/logo-kab-malang.png" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '38px', height: 'auto' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '-0.5px' }}>
            SIM-PENUGASAN
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            Inspektorat Daerah Kabupaten Malang
          </p>
        </div>

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username / NIP
            </label>
            <input
              type="text"
              placeholder="Masukkan NIP atau Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-focus"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kata Sandi
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-focus"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient"
            style={{
              marginTop: '10px',
              padding: '14px',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Memproses Masuk...' : 'Masuk ke Aplikasi Portal →'}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          Portal Layanan Naskah Dinas & Audit Sistem Internal
        </div>
      </div>
    </div>
  );
}
