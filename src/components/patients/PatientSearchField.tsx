import { useState, useRef, useEffect } from 'react'
import { Search, User, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'

interface PatientSearchFieldProps {
    value: string // display value
    onSelect: (patient: Patient) => void
    onClear?: () => void
    error?: string
    label?: string
    placeholder?: string
    required?: boolean
}

export function PatientSearchField({
    value,
    onSelect,
    onClear,
    error,
    label = 'Patient',
    placeholder = 'Search by name, ID, or phone...',
    required,
}: PatientSearchFieldProps) {
    const [query, setQuery] = useState(value)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync display value when parent resets
    useEffect(() => { setQuery(value) }, [value])

    const { data: results = [] } = useQuery({
        queryKey: ['patient-search-field', query],
        queryFn: async () => {
            if (query.length < 2) return []
            const { data } = await supabase
                .from('patients')
                .select('id,first_name,last_name,patient_number,phone,gender,date_of_birth')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,patient_number.ilike.%${query}%,phone.ilike.%${query}%`)
                .order('first_name')
                .limit(10)
            return (data ?? []) as Patient[]
        },
        enabled: query.length >= 2 && open,
        staleTime: 30000,
    })

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelect = (patient: Patient) => {
        setQuery(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
        setOpen(false)
        onSelect(patient)
    }

    const handleClear = () => {
        setQuery('')
        setOpen(false)
        onClear?.()
    }

    const isSelected = value.length > 0

    return (
        <div className="space-y-1.5" ref={containerRef}>
            {label && (
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    className={`w-full pl-10 pr-9 h-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? 'border-red-300 bg-red-50' : isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
                        }`}
                    placeholder={placeholder}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    autoComplete="off"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Dropdown */}
                {open && query.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-card-xl z-50 overflow-hidden max-h-56 overflow-y-auto scrollbar-thin">
                        {results.length === 0 ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
                                <User className="w-4 h-4" />
                                No patients found for "{query}"
                            </div>
                        ) : (
                            results.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelect(p)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {p.first_name} {p.last_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {p.patient_number}{p.phone ? ` · ${p.phone}` : ''}{p.gender ? ` · ${p.gender}` : ''}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {isSelected && !error && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <User className="w-3 h-3" />Patient selected
                </p>
            )}
        </div>
    )
}
