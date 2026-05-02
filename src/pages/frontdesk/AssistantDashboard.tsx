import { Link } from 'react-router-dom'
import { Users, Package, FileText, Calendar, Eye, MessageSquare } from 'lucide-react'

export function AssistantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistant Dashboard</h1>
        <p className="text-slate-500">Manage patient assistance and optical services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/frontdesk/dispensing" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <Package className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Dispensing</h3>
          <p className="text-sm text-slate-500 mt-1">Manage glasses dispensing</p>
        </Link>

        <Link to="/frontdesk/glasses-orders" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Glasses Orders</h3>
          <p className="text-sm text-slate-500 mt-1">Track glasses orders</p>
        </Link>

        <Link to="/frontdesk/prescriptions" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <Eye className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Prescriptions</h3>
          <p className="text-sm text-slate-500 mt-1">Manage glasses prescriptions</p>
        </Link>

        <Link to="/frontdesk/outreach" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <MessageSquare className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Outreach</h3>
          <p className="text-sm text-slate-500 mt-1">Patient outreach activities</p>
        </Link>

        <Link to="/frontdesk/appointments" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <Calendar className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Appointments</h3>
          <p className="text-sm text-slate-500 mt-1">View and manage appointments</p>
        </Link>

        <Link to="/frontdesk/patients" className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
          <Users className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground">Patients</h3>
          <p className="text-sm text-slate-500 mt-1">View patient records</p>
        </Link>
      </div>
    </div>
  )
}
