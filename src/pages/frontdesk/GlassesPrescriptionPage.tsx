import { useState } from 'react'
import { Search, Eye, Plus, FileText, Calendar, User } from 'lucide-react'

export function GlassesPrescriptionPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Glasses Prescriptions</h1>
          <p className="text-slate-500">Manage patient glasses prescriptions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Prescription
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          placeholder="Search patient or prescription..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Active</p>
              <p className="text-2xl font-bold text-blue-600">24</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Expired</p>
              <p className="text-2xl font-bold text-amber-600">8</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">This Month</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Prescriptions</h3>
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">John Doe</p>
                      <span className="text-xs text-slate-400">#PAT-00{i}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Progressive lenses - OD: -2.50 -1.25 180°, OS: -2.75 -1.50 175°</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        2024-01-{15 + i}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Dr. Smith
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">Active</span>
                  <button className="text-sm text-primary hover:text-primary/80">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
