const MONEROO_API = 'https://api.moneroo.io/v1'
const MODE = import.meta.env.VITE_MONEROO_MODE || 'live'
const SECRET_KEY = MODE === 'test' 
  ? import.meta.env.VITE_MONEROO_TEST_KEY 
  : import.meta.env.VITE_MONEROO_SECRET_KEY

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${SECRET_KEY}`,
}

/**
 * Initialise un paiement Moneroo et retourne le checkout_url
 * @param {Object} params - Paramètres du paiement
 * @returns {Promise<{id: string, checkout_url: string}>}
 */
export async function initializePayment({ amount, description, returnUrl, customer, metadata = {}, methods = [] }) {
  const body = {
    amount,
    currency: 'XOF',
    description,
    return_url: returnUrl,
    customer: {
      email: customer.email,
      first_name: customer.firstName,
      last_name: customer.lastName,
      phone: customer.phone || undefined,
    },
    metadata: Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, String(v)])
    ),
  }

  if (methods.length > 0) body.methods = methods

  const res = await fetch(`${MONEROO_API}/payments/initialize`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erreur initialisation paiement')
  return data.data // { id, checkout_url }
}

/**
 * Vérifie le statut final d'une transaction Moneroo
 * @param {string} paymentId
 * @returns {Promise<Object>} Transaction details
 */
export async function verifyPayment(paymentId) {
  const res = await fetch(`${MONEROO_API}/payments/${paymentId}/verify`, {
    method: 'GET',
    headers,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erreur vérification paiement')
  return data.data // { id, status, amount, ... }
}

/**
 * Récupère les détails d'un paiement
 * @param {string} paymentId
 */
export async function retrievePayment(paymentId) {
  const res = await fetch(`${MONEROO_API}/payments/${paymentId}`, {
    method: 'GET',
    headers,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erreur récupération paiement')
  return data.data
}

// Méthodes XOF disponibles pour les pays d'Afrique de l'Ouest
export const XOF_METHODS = [
  { code: 'mtn_bj', name: 'MTN MoMo Bénin', icon: '🟡', country: 'BJ' },
  { code: 'moov_bj', name: 'Moov Money Bénin', icon: '🔵', country: 'BJ' },
  { code: 'mtn_ci', name: 'MTN MoMo Côte d\'Ivoire', icon: '🟡', country: 'CI' },
  { code: 'moov_ci', name: 'Moov Money CI', icon: '🔵', country: 'CI' },
  { code: 'orange_ci', name: 'Orange Money CI', icon: '🟠', country: 'CI' },
  { code: 'wave_ci', name: 'Wave CI', icon: '🌊', country: 'CI' },
  { code: 'orange_sn', name: 'Orange Money Sénégal', icon: '🟠', country: 'SN' },
  { code: 'wave_sn', name: 'Wave Sénégal', icon: '🌊', country: 'SN' },
  { code: 'freemoney_sn', name: 'Free Money Sénégal', icon: '🟢', country: 'SN' },
  { code: 'moov_tg', name: 'Moov Money Togo', icon: '🔵', country: 'TG' },
  { code: 'togocel', name: 'Togocel Money', icon: '🟢', country: 'TG' },
  { code: 'card_xof', name: 'Carte bancaire (XOF)', icon: '💳', country: 'XOF' },
  { code: 'crypto_xof', name: 'Crypto (XOF)', icon: '₿', country: 'XOF' },
]

export const PAYMENT_STATUS = {
  initiated: { label: 'Initié', color: 'info' },
  pending: { label: 'En cours', color: 'warning' },
  success: { label: 'Réussi', color: 'success' },
  failed: { label: 'Échoué', color: 'danger' },
  cancelled: { label: 'Annulé', color: 'neutral' },
}
