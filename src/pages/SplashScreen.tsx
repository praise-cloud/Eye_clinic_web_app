import { useNavigate } from 'react-router-dom'
import { Stethoscope, ClipboardList, ShieldCheck, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'

const roles = [
    {
        icon: Stethoscope, title: 'Doctor', color: '#1D7FE8', bg: 'rgba(29,127,232,0.12)', border: 'rgba(29,127,232,0.25)',
        description: 'Manage consultations, write case notes, issue prescriptions, and track appointments.',
        features: ['Patient case notes', 'Glasses prescriptions', 'Appointment queue', 'Drug prescriptions']
    },
    {
        icon: ClipboardList, title: 'Frontdesk', color: '#0D9488', bg: 'rgba(13,148,136,0.12)', border: 'rgba(13,148,136,0.25)',
        description: 'Register patients, manage appointments, dispense drugs, and handle outreach.',
        features: ['Patient registration', 'Drug dispensing', 'Glasses orders', 'Patient outreach']
    },
    {
        icon: ShieldCheck, title: 'Admin/Accounts', color: '#4F46E5', bg: 'rgba(79,70,229,0.12)', border: 'rgba(79,70,229,0.25)',
        description: 'Full system access — manage staff, inventory, payments, and all operations.',
        features: ['User management', 'Inventory control', 'Payment records', 'Financial reports']
    },
    {
        icon: BarChart3, title: 'Manager', color: '#9333EA', bg: 'rgba(147,51,234,0.12)', border: 'rgba(147,51,234,0.25)',
        description: 'Oversee everything — audit logs, reports, staff management.',
        features: ['Audit logs', 'Financial reports', 'Staff management', 'System overview']
    },
]

const features = [
    'Patient records', 'Appointments', 'Drug inventory', 'Encrypted notes',
    'Staff chat', 'Revenue reports', 'Patient outreach', 'Works offline',
]

export function SplashScreen() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">

            {/* Nav */}
            <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src="/icons/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <span className="font-bold text-sm sm:text-base">KORENE</span>
                        <span className="text-white/40 text-xs ml-1.5 hidden sm:inline">Eye Clinic</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/login')}
                        className="px-3 sm:px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="text-center px-4 pt-12 pb-10 sm:pt-20 sm:pb-16 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-blue-300 font-medium">Complete Clinic Management System</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
                    Modern Eye Clinic<br />
                    <span className="text-blue-400">Management Platform</span>
                </h1>
                <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                    A complete PWA for KORENE Eye Clinic — patients, appointments, prescriptions, pharmacy, and finances in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold text-base hover:bg-blue-600 transition-colors">
                        Sign In <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* Features strip */}
            <section className="border-y border-white/5 bg-white/[0.02] py-5 px-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center max-w-4xl mx-auto">
                    {features.map(f => (
                        <div key={f} className="flex items-center gap-1.5">
                            <CheckCircle size={13} className="text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-white/55">{f}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section className="px-4 py-12 sm:py-16 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built for every role</h2>
                    <p className="text-white/40 text-sm sm:text-base">Each staff member gets a tailored dashboard.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map(role => (
                        <div key={role.title} className="rounded-2xl p-5 transition-transform hover:-translate-y-1"
                            style={{ background: role.bg, border: `1px solid ${role.border}` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                style={{ background: role.bg, border: `1px solid ${role.border}` }}>
                                <role.icon size={20} color={role.color} />
                            </div>
                            <h3 className="text-base font-bold mb-2" style={{ color: role.color }}>{role.title}</h3>
                            <p className="text-xs text-white/50 leading-relaxed mb-4">{role.description}</p>
                            <ul className="space-y-1.5">
                                {role.features.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: role.color }} />
                                        <span className="text-xs text-white/45">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="text-center px-4 py-12 border-t border-white/5">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
                <p className="text-white/40 text-sm mb-7">Sign in to access your dashboard.</p>
                <button onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-base hover:bg-blue-600 transition-colors">
                    Sign In <ArrowRight size={16} />
                </button>
                <p className="mt-4 text-xs text-white/30">
                    Contact your administrator if you don't have an account.
                </p>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <img src="/icons/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                    <span className="text-xs text-white/30">KORENE Eye Clinic Management System</span>
                </div>
                <span className="text-xs text-white/20">© {new Date().getFullYear()} All rights reserved</span>
            </footer>
        </div>
    )
}
