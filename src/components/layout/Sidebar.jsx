import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FileText, Receipt, Wallet,
  BarChart3, Users, Settings, LogOut, ChevronRight,
  Menu, X, Bell, Home
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'

const navConfig = {
  admin: [
    { path: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { path: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/proprietes', icon: Building2, label: 'Propriétés' },
    { path: '/admin/baux', icon: FileText, label: 'Baux' },
    { path: '/admin/paiements', icon: Wallet, label: 'Paiements' },
    { path: '/admin/rapports', icon: BarChart3, label: 'Rapports' },
    { path: '/admin/parametres', icon: Settings, label: 'Paramètres' },
  ],
  proprietaire: [
    { path: '/proprietaire', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { path: '/proprietaire/proprietes', icon: Building2, label: 'Mes propriétés' },
    { path: '/proprietaire/baux', icon: FileText, label: 'Baux' },
    { path: '/proprietaire/factures', icon: Receipt, label: 'Factures' },
    { path: '/proprietaire/paiements', icon: Wallet, label: 'Paiements' },
    { path: '/proprietaire/rapports', icon: BarChart3, label: 'Rapports' },
  ],
  locataire: [
    { path: '/locataire', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { path: '/locataire/baux', icon: FileText, label: 'Mon bail' },
    { path: '/locataire/factures', icon: Receipt, label: 'Mes factures' },
    { path: '/locataire/paiements', icon: Wallet, label: 'Mes paiements' },
  ],
}

const roleLabels = {
  admin: 'Administrateur',
  proprietaire: 'Propriétaire',
  locataire: 'Locataire',
}

export default function Sidebar() {
  const { profile, role, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const navItems = navConfig[role] || []

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path) && item.path !== item.path.split('/')[0]
  }

  const isActivePath = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center">
          <Home size={16} className="text-slate-900" />
        </div>
        <div>
          <span className="font-sora font-bold text-slate-900 text-sm">ImmoGest</span>
          <p className="text-slate-500 text-xs">{roleLabels[role]}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`sidebar-link ${isActivePath(item) ? 'active' : ''}`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
            {isActivePath(item) && <ChevronRight size={12} className="ml-auto text-emerald-600" />}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-800 flex items-center justify-center text-emerald-300 text-xs font-sora font-bold">
            {getInitials(profile?.first_name, profile?.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-sm font-inter font-medium truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-slate-500 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-ghost w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-950">
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-slate-200 text-slate-900"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-100/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-50 border-r border-slate-200 z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900">
          <X size={18} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 bg-slate-50 border-r border-slate-200 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent />
      </div>
    </>
  )
}
