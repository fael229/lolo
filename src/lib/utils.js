import { format, formatDistance, isAfter, isBefore, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatDateFull(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

export function formatRelative(date) {
  if (!date) return '—'
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr })
}

export function isOverdue(dueDate) {
  return isBefore(new Date(dueDate), new Date())
}

export function isDueSoon(dueDate, days = 7) {
  const due = new Date(dueDate)
  return isAfter(due, new Date()) && isBefore(due, addDays(new Date(), days))
}

export function generateInvoiceNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV-${year}${month}-${rand}`
}

export function getInitials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function truncate(str, length = 40) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}

export const PROPERTY_TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'bureau', label: 'Bureau / Commercial' },
  { value: 'terrain', label: 'Terrain' },
]

export const PAYMENT_PERIODS = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'semestriel', label: 'Semestriel' },
  { value: 'annuel', label: 'Annuel' },
]

export const LEASE_STATUS = {
  actif: { label: 'Actif', color: 'success' },
  termine: { label: 'Terminé', color: 'neutral' },
  resilie: { label: 'Résilié', color: 'danger' },
  en_attente: { label: 'En attente', color: 'warning' },
}

export const INVOICE_STATUS = {
  en_attente: { label: 'En attente', color: 'warning' },
  payee: { label: 'Payée', color: 'success' },
  en_retard: { label: 'En retard', color: 'danger' },
  annulee: { label: 'Annulée', color: 'neutral' },
}
