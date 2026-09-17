-- ====================================================================
-- SCRIPT DE MIGRACIÓN: CREACIÓN DE TABLA INDIVIDUAL PARA PLANES DE VENTA (IPTV)
-- COPIAR Y PEGAR ESTO EN EL EDITOR SQL DE SUPABASE
-- GRUPO ALFABÉTICO REGLA 20: PREFIJO 'iptv_'
-- ====================================================================

-- 1. Crear tabla individual para cada plan de venta minorista
CREATE TABLE IF NOT EXISTS iptv_planes_venta (
  id VARCHAR(255) PRIMARY KEY,
  provider_plan_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  months INTEGER NOT NULL DEFAULT 1,
  screens INTEGER NOT NULL DEFAULT 1,
  tokens NUMERIC(10,2) DEFAULT 0.00,
  price NUMERIC(10,2) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar los planes de venta existentes desde iptv_finanzas_config (si hubiese alguno)
DO $$
DECLARE
  v_rec record;
  v_plan jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'iptv_finanzas_config') THEN
    FOR v_rec IN SELECT sale_plans FROM iptv_finanzas_config WHERE id = 1 LOOP
      IF v_rec.sale_plans IS NOT NULL AND jsonb_array_length(v_rec.sale_plans) > 0 THEN
        FOR v_plan IN SELECT jsonb_array_elements(v_rec.sale_plans) LOOP
          -- Intentar insertar omitiendo duplicados
          INSERT INTO iptv_planes_venta (id, provider_plan_id, name, months, screens, tokens, price)
          VALUES (
            (v_plan->>'id'),
            (v_plan->>'provider_plan_id'),
            COALESCE(v_plan->>'name', 'Plan Nuevo'),
            COALESCE((v_plan->>'months')::integer, 1),
            COALESCE((v_plan->>'screens')::integer, 1),
            COALESCE((v_plan->>'tokens')::numeric, 0.00),
            COALESCE((v_plan->>'price')::numeric, 0.00)
          )
          ON CONFLICT (id) DO UPDATE SET
            provider_plan_id = EXCLUDED.provider_plan_id,
            name = EXCLUDED.name,
            months = EXCLUDED.months,
            screens = EXCLUDED.screens,
            tokens = EXCLUDED.tokens,
            price = EXCLUDED.price;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END $$;

-- 3. Habilitar la replicación de datos en tiempo real en Supabase para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_planes_venta;

-- 4. Opcional: Otorgar permisos de lectura y escritura para el rol público
-- (útil si utilizas las API directas de Supabase sin autenticar en la terminal)
GRANT ALL ON TABLE iptv_planes_venta TO anon, authenticated, service_role;
