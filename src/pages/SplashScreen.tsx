import { useNavigate } from 'react-router-dom'
import { Eye, Stethoscope, ClipboardList, ShieldCheck, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'

const roles = [
    {
        icon: Stethoscope,
        title: 'Doctor',
        color: '#1D7FE8',
        bg: 'rgba(29,127,232,0.1)',
        border: 'rgba(29,127,232,0.25)',
        description: 'Manage patient consultations, write case notes, issue prescriptions, and track your daily appointments.',
        features: ['Patient case notes', 'Glasses prescriptions', 'Appointment queue', 'Drug prescriptions'],
    },
    {
        icon: ClipboardList,
        title: 'Assistant',
        color: '#0D9488',
        bg: 'rgba(13,148,136,0.1)',
        border: 'rgba(13,148,136,0.25)',
        description: 'Register patients, manage appointments, dispense drugs, process glasses orders, and handle outreach.',
        features: ['Patient registration', 'Drug dispensing', 'Glasses orders', 'Patient outreach'],
    },
    {
        icon: ShieldCheck,
        title: 'Admin',
        color: '#4F46E5',
        bg: 'rgba(79,70,229,0.1)',
        border: 'rgba(79,70,229,0.25)',
        description: 'Full system access — manage staff, oversee all operations, view audit logs, and export backups.',
        features: ['User management', 'Audit logs', 'Inventory control', 'System settings'],
    },
    {
        icon: BarChart3,
        title: 'Accountant',
        color: '#059669',
        bg: 'rgba(5,150,105,0.1)',
        border: 'rgba(5,150,105,0.25)',
        description: 'Track daily revenue, manage payments, generate financial reports, and monitor subscriptions.',
        features: ['Daily summaries', 'Payment records', 'Financial reports', 'Subscription tracking'],
    },
]

const features = [
    'Patient records & history',
    'Real-time appointment scheduling',
    'Drug & glasses inventory',
    'Encrypted clinical notes',
    'Staff messaging & chat',
    'Revenue & financial reports',
    'Patient outreach via SMS/Email',
    'Installable PWA — works offline',
]

export function SplashScreen() {
    const navigate = useNavigate()

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', color: 'white' }}>

            {/* Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1D7FE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={20} color="white" />
                    </div>
                    <div>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>KORENE</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 }}>Eye Clinic</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14 }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1D7FE8', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 760, margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: 'rgba(29,127,232,0.12)', border: '1px solid rgba(29,127,232,0.25)', marginBottom: 28 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D7FE8' }} />
                    <span style={{ fontSize: 12, color: '#60B3F8', fontWeight: 500 }}>Complete Clinic Management System</span>
                </div>

                <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1px' }}>
                    Modern Eye Clinic
                    <br />
                    <span style={{ color: '#1D7FE8' }}>Management Platform</span>
                </h1>

                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                    A complete Progressive Web App for KORENE Eye Clinic — managing patients, appointments, prescriptions, pharmacy, and finances all in one place.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/register')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 10, border: 'none', background: '#1D7FE8', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
                    >
                        Create Account <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 15 }}
                    >
                        Sign In
                    </button>
                </div>
            </section>

            {/* Features strip */}
            <section style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 40px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '12px 32px', justifyContent: 'center' }}>
                    {features.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={14} color="#1D7FE8" />
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section style={{ padding: '72px 24px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                        Built for every role in your clinic
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>
                        Each staff member gets a tailored dashboard with exactly what they need.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                    {roles.map((role) => (
                        <div
                            key={role.title}
                            style={{
                                borderRadius: 16, padding: 28,
                                background: role.bg,
                                border: `1px solid ${role.border}`,
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: role.bg, border: `1px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <role.icon size={22} color={role.color} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: role.color }}>{role.title}</h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 18px' }}>
                                {role.description}
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {role.features.map((f) => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ textAlign: 'center', padding: '60px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, margin: '0 0 12px' }}>
                    Ready to get started?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: '0 0 32px' }}>
                    Create your account and access your dashboard in seconds.
                </p>
                <button
                    onClick={() => navigate('/register')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 10, border: 'none', background: '#1D7FE8', color: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
                >
                    Create Account <ArrowRight size={16} />
                </button>
                <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                    Already have an account?{' '}
                    <span onClick={() => navigate('/login')} style={{ color: '#60B3F8', cursor: 'pointer', textDecoration: 'underline' }}>
                        Sign in here
                    </span>
                </p>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} color="#1D7FE8" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>KORENE Eye Clinic Management System</span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} All rights reserved</span>
            </footer>

        </div>
    )
}
