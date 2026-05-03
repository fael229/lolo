-- ================================================================
-- ImmoGest — Schéma Supabase complet
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ================================================================

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES ──
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'locataire' CHECK (role IN ('admin', 'proprietaire', 'locataire')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PROPERTIES ──
CREATE TABLE IF NOT EXISTS properties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'appartement',
  address      TEXT NOT NULL,
  city         TEXT NOT NULL,
  description  TEXT,
  monthly_rent INTEGER NOT NULL DEFAULT 0,
  rooms        INTEGER,
  surface      NUMERIC(8,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. LEASES ──
CREATE TABLE IF NOT EXISTS leases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  owner_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'termine', 'resilie', 'en_attente')),
  start_date     DATE NOT NULL,
  end_date       DATE,
  monthly_rent   INTEGER NOT NULL,
  payment_period TEXT NOT NULL DEFAULT 'mensuel' CHECK (payment_period IN ('mensuel', 'trimestriel', 'semestriel', 'annuel')),
  payment_day    INTEGER NOT NULL DEFAULT 5 CHECK (payment_day BETWEEN 1 AND 31),
  deposit           INTEGER DEFAULT 0,
  renewal_type      TEXT NOT NULL DEFAULT 'manuel' CHECK (renewal_type IN ('tacite', 'manuel', 'aucun')),
  late_fee_type     TEXT NOT NULL DEFAULT 'aucun' CHECK (late_fee_type IN ('pourcentage', 'fixe', 'aucun')),
  late_fee_amount   NUMERIC(8,2) DEFAULT 0,
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. INVOICES ──
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number      TEXT NOT NULL UNIQUE,
  lease_id            UUID NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  owner_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount              INTEGER NOT NULL,
  penalty_amount      INTEGER DEFAULT 0,
  total_amount        INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'payee', 'en_retard', 'annulee')),
  due_date            DATE NOT NULL,
  paid_at             TIMESTAMPTZ,
  period_label        TEXT,
  description         TEXT,
  moneroo_payment_id  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. PAYMENTS ──
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID REFERENCES invoices(id) ON DELETE SET NULL,
  owner_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tenant_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moneroo_payment_id  TEXT,
  amount              INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'success', 'failed', 'cancelled')),
  payment_method      TEXT,
  checkout_url        TEXT,
  moneroo_data        JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TRIGGERS — auto profile creation + updated_at
-- ================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'locataire'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-set tenant_id on invoice from lease
CREATE OR REPLACE FUNCTION set_invoice_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM leases WHERE id = NEW.lease_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_invoice_insert ON invoices;
CREATE TRIGGER before_invoice_insert
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_tenant();

-- Updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments   ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
-- We use auth.jwt() to avoid infinite recursion when querying profiles table
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'proprietaire' AND role = 'locataire')
  );

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── PROPERTIES ──
CREATE POLICY "properties_admin" ON properties FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "properties_owner" ON properties FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "properties_tenant_view" ON properties FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'locataire' AND
    id IN (SELECT property_id FROM leases WHERE tenant_id = auth.uid())
  );

-- ── LEASES ──
CREATE POLICY "leases_admin" ON leases FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "leases_owner" ON leases FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "leases_tenant" ON leases FOR SELECT
  USING (tenant_id = auth.uid());

-- ── INVOICES ──
CREATE POLICY "invoices_admin" ON invoices FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "invoices_owner" ON invoices FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "invoices_tenant" ON invoices FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "invoices_tenant_update" ON invoices FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ── PAYMENTS ──
CREATE POLICY "payments_admin" ON payments FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "payments_owner" ON payments FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "payments_tenant" ON payments FOR ALL
  USING (tenant_id = auth.uid());

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_leases_owner ON leases(owner_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lease ON invoices(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_moneroo ON payments(moneroo_payment_id);
