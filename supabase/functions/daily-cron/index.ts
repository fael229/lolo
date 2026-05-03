// @ts-nocheck
// Note: VS Code peut afficher des erreurs TypeScript ici car il s'attend à du Node.js (React),
// mais Supabase Edge Functions utilise Deno. Ces erreurs disparaissent au déploiement.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── CONFIGURATION DES EMAILS (Resend) ──
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[SIMULATION EMAIL] Vers: ${to} | Sujet: ${subject}`)
    return
  }
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'ImmoGest <noreply@votre-domaine.com>',
      to: [to],
      subject: subject,
      html: html
    })
  })
  return res.json()
}

serve(async (req) => {
  try {
    // 1. Initialisation du client Supabase avec la clé Service Role (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const today = new Date()
    const currentDay = today.getDate()
    
    // =================================================================
    // ETAPE 1 : APPLICATION DES PÉNALITÉS DE RETARD
    // =================================================================
    console.log("-> Vérification des impayés...")
    const { data: overdueInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*, leases(late_fee_type, late_fee_amount, grace_period_days, profiles!leases_tenant_id_fkey(email, first_name))')
      .eq('status', 'en_attente')

    if (overdueInvoices) {
      for (const inv of overdueInvoices) {
        const lease = inv.leases
        if (!lease) continue

        const dueDate = new Date(inv.due_date)
        const graceDate = new Date(dueDate)
        graceDate.setDate(graceDate.getDate() + (lease.grace_period_days || 0))

        if (today > graceDate && inv.penalty_amount === 0 && lease.late_fee_type !== 'aucun') {
          // Calcul de la pénalité
          let penalty = 0
          if (lease.late_fee_type === 'pourcentage') {
            penalty = Math.round(inv.amount * (lease.late_fee_amount / 100))
          } else if (lease.late_fee_type === 'fixe') {
            penalty = lease.late_fee_amount
          }

          if (penalty > 0) {
            const newTotal = inv.amount + penalty
            await supabaseAdmin.from('invoices').update({
              penalty_amount: penalty,
              total_amount: newTotal,
              status: 'en_retard'
            }).eq('id', inv.id)

            // Envoyer email de retard
            const tenantEmail = lease.profiles?.email
            if (tenantEmail) {
              await sendEmail(
                tenantEmail,
                "Alerte de retard de paiement - Pénalité appliquée",
                `Bonjour ${lease.profiles?.first_name},<br><br>Votre facture <b>${inv.invoice_number}</b> est en retard. Une pénalité de ${penalty} XOF a été appliquée.<br>Nouveau total à payer : <b>${newTotal} XOF</b>.<br><br>Veuillez régler dans les plus brefs délais.`
              )
            }
          }
        }
      }
    }

    // =================================================================
    // ETAPE 2 : GÉNÉRATION DES NOUVELLES FACTURES
    // =================================================================
    console.log("-> Génération des factures mensuelles...")
    const { data: activeLeases } = await supabaseAdmin
      .from('leases')
      .select('*, properties(name), profiles!leases_tenant_id_fkey(email, first_name)')
      .eq('status', 'actif')
      .eq('payment_day', currentDay)

    if (activeLeases) {
      for (const lease of activeLeases) {
        // Formater le label du mois (ex: Mai 2026)
        const monthLabel = today.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
        const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random()*10000)}`

        // Vérifier qu'une facture n'existe pas déjà pour ce mois pour éviter les doublons
        const { data: existing } = await supabaseAdmin.from('invoices')
          .select('id').eq('lease_id', lease.id).eq('period_label', monthLabel).maybeSingle()

        if (!existing) {
          const dueDate = new Date(today)
          dueDate.setDate(dueDate.getDate() + 5) // Ex: 5 jours pour payer par défaut

          await supabaseAdmin.from('invoices').insert({
            invoice_number: invoiceNumber,
            lease_id: lease.id,
            owner_id: lease.owner_id,
            tenant_id: lease.tenant_id,
            amount: lease.monthly_rent,
            total_amount: lease.monthly_rent,
            status: 'en_attente',
            due_date: dueDate.toISOString().split('T')[0],
            period_label: monthLabel,
            description: `Loyer — ${monthLabel}`
          })

          // Envoyer email de nouvelle facture
          const tenantEmail = lease.profiles?.email
          if (tenantEmail) {
            await sendEmail(
              tenantEmail,
              `Nouvelle facture de loyer - ${monthLabel}`,
              `Bonjour ${lease.profiles?.first_name},<br><br>Votre facture de loyer pour <b>${monthLabel}</b> (Bien: ${lease.properties?.name}) est disponible.<br>Montant à payer : <b>${lease.monthly_rent} XOF</b>.<br>Échéance : ${dueDate.toLocaleDateString('fr-FR')}.<br><br>Merci !`
            )
          }
        }
      }
    }

    // =================================================================
    // ETAPE 3 : RENOUVELLEMENTS DES BAUX
    // =================================================================
    console.log("-> Vérification des fins de bail...")
    const { data: expiringLeases } = await supabaseAdmin
      .from('leases')
      .select('*')
      .eq('status', 'actif')
      .not('end_date', 'is', null)

    if (expiringLeases) {
      for (const lease of expiringLeases) {
        const endDate = new Date(lease.end_date)
        
        if (today >= endDate) {
          if (lease.renewal_type === 'tacite') {
            // Prolonger le bail d'un an (exemple)
            const newEndDate = new Date(endDate)
            newEndDate.setFullYear(newEndDate.getFullYear() + 1)
            await supabaseAdmin.from('leases').update({ end_date: newEndDate.toISOString().split('T')[0] }).eq('id', lease.id)
            console.log(`Bail ${lease.id} renouvelé tacitement.`)
          } else if (lease.renewal_type === 'aucun' || lease.renewal_type === 'manuel') {
            // Terminer le bail
            await supabaseAdmin.from('leases').update({ status: 'termine' }).eq('id', lease.id)
            console.log(`Bail ${lease.id} terminé (non renouvelé automatiquement).`)
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Tâches automatisées exécutées" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
