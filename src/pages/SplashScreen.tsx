import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function SplashScreen() {
    const navigate = useNavigate()
    const [phase, setPhase] = useState<'logo' | 'text' | 'tagline' | 'done'>('logo')

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('text'), 600)
        const t2 = setTimeout(() => setPhase('tagline'), 1400)
        const t3 = setTimeout(() => setPhase('done'), 2800)
        const t4 = setTimeout(() => navigate('/login'), 3400)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
    }, [navigate])

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1D7FE8 100%)',
                opacity: phase === 'done' ? 0 : 1,
                transition: phase === 'done' ? 'opacity 0.6s ease' : 'none',
            }}
        >
            {/* Ambient circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{
                    position: 'absolute', width: 600, height: 600,
                    borderRadius: '50%', top: -200, right: -200,
                    background: 'radial-gradient(circle, rgba(29,127,232,0.15) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', width: 400, height: 400,
                    borderRadius: '50%', bottom: -100, left: -100,
                    background: 'radial-gradient(circle, rgba(29,127,232,0.1) 0%, transparent 70%)',
                }} />
            </div>

            {/* Logo mark */}
            <div
                style={{
                    opacity: phase === 'logo' ? 0 : 1,
                    transform: phase === 'logo' ? 'scale(0.6)' : 'scale(1)',
                    transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    marginBottom: 32,
                }}
            >
                <div style={{
                    width: 96, height: 96, borderRadius: 28,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                }}>
                    {/* Eye icon */}
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="12" cy="12" r="1" fill="white" stroke="none" />
                    </svg>
                </div>
            </div>

            {/* Clinic name */}
            <div
                style={{
                    opacity: phase === 'logo' || phase === 'text' && false ? 0 : phase === 'text' || phase === 'tagline' || phase === 'done' ? 1 : 0,
                    transform: phase === 'logo' ? 'translateY(20px)' : 'translateY(0)',
                    transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
                    textAlign: 'center',
                }}
            >
                <h1 style={{
                    fontSize: 36, fontWeight: 700, color: 'white',
                    letterSpacing: '-0.5px', margin: 0,
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                    KORENE
                </h1>
                <p style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.6)',
                    letterSpacing: 4, textTransform: 'uppercase',
                    margin: '6px 0 0', fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                    Eye Clinic
                </p>
            </div>

            {/* Tagline */}
            <div
                style={{
                    marginTop: 24,
                    opacity: phase === 'tagline' || phase === 'done' ? 1 : 0,
                    transform: phase === 'tagline' || phase === 'done' ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    textAlign: 'center',
                }}
            >
                <p style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    margin: 0,
                }}>
                    Clinic Management System
                </p>
            </div>

            {/* Loading bar */}
            <div style={{
                position: 'absolute', bottom: 60,
                width: 120, height: 2,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 99, overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%', borderRadius: 99,
                    background: 'rgba(255,255,255,0.6)',
                    width: phase === 'logo' ? '0%' : phase === 'text' ? '40%' : phase === 'tagline' ? '80%' : '100%',
                    transition: 'width 0.8s ease',
                }} />
            </div>

            {/* Version */}
            <p style={{
                position: 'absolute', bottom: 24,
                fontSize: 11, color: 'rgba(255,255,255,0.25)',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: 0,
            }}>
                v1.0.0
            </p>
        </div>
    )
}
