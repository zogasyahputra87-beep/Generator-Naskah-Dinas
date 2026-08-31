'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AppNavbar({ title = "Portal Penugasan" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* OVERLAY SEMBUNYI SAAT SIDEBAR BUKA */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* SIDEBAR FITUR TERLENGKAP */}
      <aside style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: '300px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#f8fafc',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 18px',
        boxShadow: isOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        {/* HEADER SIDEBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
              🏛️
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff', letterSpacing: '-0.3px' }}>INSPEKTORAT</div>
              <div style={{ fontSize: '11px', color: '#a5b4fc', letterSpacing: '0.5px' }}>KABUPATEN MALANG</div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{ border: 'none', background: '#1e293b', color: '#94a3b8', fontSize: '16px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* MENU FITUR LAYANAN PENGANWASAN TERLENGKAP */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* GRUP 1: UTAMA */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '8px' }}>
              Layanan Utama
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: '700', textDecoration: 'none', fontSize: '13.5px' }}>
                <span>📊</span> Dashboard Utama
              </Link>
              <Link href="/penugasan/baru" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>📝</span> Buat Penugasan Baru
              </Link>
            </div>
          </div>

          {/* GRUP 2: TAHAPAN PENGAWASAN */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '8px' }}>
              Tahapan Audit & Reviu
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>🗓️</span> Perencanaan (PKPT)
              </Link>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>📁</span> Pelaksanaan (KKP & Field)
              </Link>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>📄</span> Pelaporan (LHP / LHR)
              </Link>
            </div>
          </div>

          {/* GRUP 3: PASCA AUDIT & KONSULTASI */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '8px' }}>
              Pasca Audit & Layanan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>🎯</span> Tindak Lanjut (TLHP)
              </Link>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>💬</span> E-Consulting (PAMAN SIGIT)
              </Link>
            </div>
          </div>

          {/* GRUP 4: MASTER DATA */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '8px' }}>
              Master Data & Akun
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600' }}>
                <span>👥</span> Master Pegawai & Bezitting
              </Link>
            </div>
          </div>

        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
          SIM-PENUGASAN v2.0 • PORTAL
        </div>
      </aside>

      {/* TOP NAVBAR BERWARNA MODERN */}
      <header style={{ 
        height: '64px', 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
        color: '#fff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 20px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 40, 
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 4px 15px rgba(30, 27, 75, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsOpen(true)}
            style={{ 
              border: 'none', 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              color: '#fff', 
              fontSize: '13.5px', 
              cursor: 'pointer', 
              padding: '8px 14px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backdropFilter: 'blur(4px)'
            }}
          >
            <span>☰</span> Menu Layanan
          </button>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>Tim Pengawasan</span>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)' }}>
            TP
          </div>
        </div>
      </header>
    </>
  );
}
