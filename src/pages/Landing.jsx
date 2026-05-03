import { Link } from 'react-router-dom'
import { Building2, Shield, Smartphone, BarChart3, CheckCircle2, ArrowRight, Home, Users, Receipt } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FEATURES = [
  {
    icon: Building2,
    title: 'Gestion des propriétés',
    desc: 'Centralisez tous vos biens immobiliers. Appartements, villas, bureaux — tout est organisé.',
  },
  {
    icon: Receipt,
    title: 'Facturation automatique',
    desc: 'Générez vos factures de loyer en un clic. Suivi en temps réel des paiements.',
  },
  {
    icon: Smartphone,
    title: 'Paiement Mobile Money',
    desc: 'MTN MoMo, Moov Money, Wave, Orange Money — vos locataires paient facilement.',
  },
  {
    icon: BarChart3,
    title: 'Rapports & Analyses',
    desc: "Visualisez vos revenus, taux d'occupation et impayés sur un tableau de bord clair.",
  },
  {
    icon: Shield,
    title: 'Sécurité avancée',
    desc: 'Données chiffrées, accès par rôles stricts. Votre patrimoine est protégé.',
  },
  {
    icon: Users,
    title: 'Gestion multi-rôles',
    desc: 'Admin, propriétaire, locataire — chacun accède à ce qui le concerne uniquement.',
  },
]

const STATS = [
  { value: '500+', label: 'Propriétaires actifs' },
  { value: '2 400+', label: 'Biens gérés' },
  { value: '98%', label: 'Paiements reçus à temps' },
  { value: '12 pays', label: "Couverts en Afrique" },
]

function useReveal() {
  const refs = useRef([])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up')
            entry.target.classList.remove('opacity-0', 'translate-y-6')
          }
        })
      },
      { threshold: 0.1 }
    )
    refs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])
  return refs
}

export default function Landing() {
  const revealRefs = useReveal()
  const addRef = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el) }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-slate-100/90 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 flex items-center justify-center">
            <Home size={14} className="text-slate-900" />
          </div>
          <span className="font-sora font-bold text-slate-900 text-base">ImmoGest</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/connexion" className="btn-ghost text-sm hidden sm:flex">
            Connexion
          </Link>
          <Link to="/inscription" className="btn-primary text-sm">
            Commencer
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO — Typographic Authority ── */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12 min-h-screen flex flex-col justify-center overflow-hidden bg-grid-pattern bg-grid">
        {/* Subtle accent line */}
        <div className="absolute left-0 top-1/3 w-1 h-48 bg-emerald-600" />

        <div className="max-w-5xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 border border-gold-600 mb-8 opacity-0 translate-y-6"
            ref={addRef}
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-slow" />
            <span className="text-gold-400 text-xs font-inter font-semibold uppercase tracking-widest">
              Plateforme #1 en Afrique de l'Ouest
            </span>
          </div>

          <h1
            className="font-sora font-black text-slate-900 leading-none mb-6 opacity-0 translate-y-6"
            ref={addRef}
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', animationDelay: '100ms' }}
          >
            Gérez votre
            <span className="block text-emerald-500">immobilier</span>
            <span className="block text-slate-500">différemment.</span>
          </h1>

          <p
            className="font-inter text-slate-600 max-w-xl mb-10 opacity-0 translate-y-6"
            style={{ fontSize: '1.125rem', lineHeight: '1.75', animationDelay: '200ms' }}
            ref={addRef}
          >
            De la gestion des baux à l'encaissement via Mobile Money —
            ImmoGest unifie toute votre activité immobilière sur une plateforme sécurisée.
          </p>

          <div
            className="flex flex-wrap gap-4 opacity-0 translate-y-6"
            ref={addRef}
            style={{ animationDelay: '300ms' }}
          >
            <Link to="/inscription" className="btn-primary text-base px-8 py-4">
              Créer mon compte
              <ArrowRight size={16} />
            </Link>
            <Link to="/connexion" className="btn-secondary text-base px-8 py-4">
              Se connecter
            </Link>
          </div>

          {/* Mobile money logos */}
          <div
            className="flex items-center gap-4 mt-10 opacity-0 translate-y-6"
            ref={addRef}
            style={{ animationDelay: '400ms' }}
          >
            <span className="text-slate-500 text-xs font-inter uppercase tracking-wider">Paiements via</span>
            <div className="flex items-center gap-3">
              {['MTN MoMo', 'Moov', 'Wave', 'Orange'].map((name) => (
                <span key={name} className="text-xs font-inter font-semibold text-slate-600 px-2 py-1 border border-slate-200 bg-white">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative vertical text */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block">
          <span className="font-sora font-black text-dark-800 opacity-60 uppercase tracking-widest"
            style={{ writingMode: 'vertical-lr', fontSize: '4rem', letterSpacing: '0.3em' }}>
            IMMO
          </span>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="text-center opacity-0 translate-y-6" ref={addRef} style={{ animationDelay: `${i * 100}ms` }}>
              <p className="font-sora font-black text-emerald-400" style={{ fontSize: '2rem' }}>{stat.value}</p>
              <p className="text-slate-500 text-sm font-inter mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16" ref={addRef} style={{ opacity: 0 }}>
            <p className="text-emerald-500 text-xs font-inter font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="font-sora font-black text-slate-900 text-4xl lg:text-5xl leading-tight">
              Tout ce dont vous avez<br />
              <span className="text-slate-500">besoin, rien de plus.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="bg-slate-50 p-8 opacity-0 translate-y-6 group hover:bg-white transition-colors duration-200"
                ref={addRef}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 flex items-center justify-center mb-5 group-hover:border-emerald-700 transition-colors">
                  <feat.icon size={18} className="text-emerald-400" />
                </div>
                <h3 className="font-sora font-bold text-slate-900 text-base mb-2">{feat.title}</h3>
                <p className="text-slate-500 text-sm font-inter leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-24 px-6 lg:px-12 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16" ref={addRef} style={{ opacity: 0 }}>
            <h2 className="font-sora font-black text-slate-900 text-4xl lg:text-5xl">
              3 rôles.<br />
              <span className="text-emerald-500">1 plateforme.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                role: 'Administrateur',
                color: 'gold',
                desc: 'Vue globale sur toute la plateforme. Gère les utilisateurs, supervise les transactions, génère les rapports.',
                items: ['Gestion des utilisateurs', 'Audit complet', 'Statistiques globales', 'Paramètres système'],
              },
              {
                role: 'Propriétaire',
                color: 'emerald',
                desc: 'Publiez vos biens, créez les baux, émettez les factures et recevez vos loyers via Mobile Money.',
                items: ['Publication de biens', 'Création des baux', 'Facturation mensuelle', 'Encaissement Mobile Money'],
              },
              {
                role: 'Locataire',
                color: 'blue',
                desc: 'Consultez votre bail, vérifiez vos factures et réglez votre loyer depuis votre téléphone.',
                items: ['Consultation du bail', 'Suivi des factures', 'Paiement Mobile Money', 'Historique complet'],
              },
            ].map((r, i) => {
              const borderColor = { gold: 'border-gold-600', emerald: 'border-emerald-600', blue: 'border-blue-600' }[r.color]
              const textColor = { gold: 'text-gold-400', emerald: 'text-emerald-400', blue: 'text-blue-400' }[r.color]
              return (
                <div
                  key={r.role}
                  className={`bg-slate-50 border border-slate-200 border-t-2 ${borderColor} p-8 opacity-0 translate-y-6`}
                  ref={addRef}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <p className={`font-sora font-black text-lg mb-3 ${textColor}`}>{r.role}</p>
                  <p className="text-slate-500 text-sm font-inter leading-relaxed mb-6">{r.desc}</p>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm font-inter text-slate-600">
                        <CheckCircle2 size={14} className={textColor} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center opacity-0 translate-y-6" ref={addRef}>
          <h2 className="font-sora font-black text-slate-900 mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
            Prêt à moderniser<br />votre gestion ?
          </h2>
          <p className="text-slate-500 font-inter mb-10 text-lg">
            Rejoignez des centaines de propriétaires qui gèrent leur patrimoine immobilier sans stress.
          </p>
          <Link to="/inscription" className="btn-gold text-base px-10 py-4">
            Créer mon compte gratuitement
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-slate-100 px-6 lg:px-12 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 flex items-center justify-center">
              <Home size={12} className="text-slate-900" />
            </div>
            <span className="font-sora font-bold text-slate-600 text-sm">ImmoGest</span>
          </div>
          <p className="text-slate-500 text-xs font-inter">
            © 2026 ImmoGest. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link to="/connexion" className="text-slate-500 hover:text-slate-900 text-xs font-inter transition-colors">Connexion</Link>
            <Link to="/inscription" className="text-slate-500 hover:text-slate-900 text-xs font-inter transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
