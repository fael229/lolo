# Plan d'implémentation : Automatisation Facturation & Baux

## Phase 1 : Mise à jour de la Base de Données (Supabase)
Nous devons ajouter les nouveaux paramètres configurables directement dans la table `leases` (Baux) et ajuster `invoices` (Factures) pour supporter les pénalités.

**Nouvelles colonnes pour `leases` :**
- `renewal_type` (TEXT) : `tacite` (automatique) ou `manuel`.
- `late_fee_type` (TEXT) : `pourcentage`, `fixe`, ou `aucun`.
- `late_fee_amount` (NUMERIC) : La valeur de la pénalité (ex: 5 pour 5%, ou 10000 pour 10 000 XOF).
- `grace_period_days` (INTEGER) : Le délai de grâce avant application de la pénalité (ex: 3 jours après l'échéance).

**Nouvelles colonnes pour `invoices` :**
- `penalty_amount` (INTEGER) : Montant de la pénalité appliquée.
- `total_amount` (INTEGER) : Montant total (loyer + pénalité).

## Phase 2 : Mise à jour de l'Interface (UI)
- **Leases.jsx :** Ajouter ces 4 nouveaux champs dans le modal de création/modification de bail (Paramètres avancés).
- **Invoices.jsx & Dashboard.jsx :** Afficher les pénalités appliquées et le total mis à jour.

## Phase 3 : Logique Backend (Cron & Fonctions)
Puisque vous souhaitez envoyer des emails, nous utiliserons les **Supabase Edge Functions** couplées à un **Cron Job**.

1. **Création d'une Edge Function `daily-cron` :**
   - **Étape 1 (Impayés) :** Scanne les factures `en_attente`. Si `due_date + grace_period` est dépassé, calcule la pénalité, met à jour `total_amount`, et change le statut en `en_retard`.
   - **Étape 2 (Nouvelles factures) :** Scanne les baux `actifs` dont c'est le jour de facturation. Génère la nouvelle facture.
   - **Étape 3 (Renouvellement) :** Si `end_date` est atteint et `renewal_type = tacite`, prolonge d'une période. Sinon, passe à `termine`.
   - **Étape 4 (Emails) :** Envoie via Resend les emails de "Nouvelle facture" et "Alerte de retard" aux locataires concernés.

2. **Configuration `pg_net` / `pg_cron` :**
   - Configurer Supabase pour appeler cette Edge Function tous les soirs à 00:00 (Heure locale).
