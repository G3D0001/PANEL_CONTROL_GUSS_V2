-- ====================================================================
-- SCRIPT DE MIGRACIÓN SEGURO CON PREFIJOS DE RUTA JERÁRQUICA (IPTV v3)
-- COPIAR Y PEGAR ESTO EN EL EDITOR SQL DE SUPABASE
-- ====================================================================

-- 1. Limpieza de tablas antiguas desordenadas para mantener limpia la estructura
DROP TABLE IF EXISTS iptv_finanzas_config CASCADE;
DROP TABLE IF EXISTS config_branding CASCADE;
DROP TABLE IF EXISTS iptv_branding CASCADE;
DROP TABLE IF EXISTS iptv_proveedores_dns CASCADE;
DROP TABLE IF EXISTS iptv_clientes_historial CASCADE;
DROP TABLE IF EXISTS iptv_clientes_perfiles CASCADE;
DROP TABLE IF EXISTS iptv_clientes CASCADE;
DROP TABLE IF EXISTS iptv_finanzas_mayorista CASCADE;
DROP TABLE IF EXISTS iptv_historial_reproduccion CASCADE;
DROP TABLE IF EXISTS iptv_perfiles CASCADE;
DROP TABLE IF EXISTS iptv_cuentas_activas CASCADE;
DROP TABLE IF EXISTS cuentas_activas CASCADE;
DROP TABLE IF EXISTS perfiles_iptv CASCADE;
DROP TABLE IF EXISTS historial_reproduccion_iptv CASCADE;

-- 2. Estructura unificada bajo ruta: iptv_clientes
-- Motivo: Almacenar los accesos de cada cliente que contrató una cuenta/línea de IPTV
CREATE TABLE IF NOT EXISTS iptv_clientes (
  username VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  url_panel_asignada VARCHAR(512) NOT NULL,
  estado VARCHAR(50) DEFAULT 'Activo', -- 'Activo', 'Inactivo'
  limite_pantallas INTEGER DEFAULT 2,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  comentarios TEXT,
  nombre_completo VARCHAR(255),
  celular VARCHAR(255),
  direccion_actual VARCHAR(512),
  id_plan_proveedor VARCHAR(255),
  id_plan_venta VARCHAR(255),
  bitacora_comentarios JSONB DEFAULT '[]'::jsonb,
  panel_client_id VARCHAR(255),
  member_id VARCHAR(255),
  bouquet TEXT,
  package_id VARCHAR(255),
  raw_response_json JSONB DEFAULT '{}'::jsonb,
  creado_por VARCHAR(255)
);

-- 3. Estructura unificada bajo ruta: iptv_clientes_perfiles
-- Motivo: Subperfiles o pantallas de visualización familiares correspondientes a cada cuenta cliente
CREATE TABLE IF NOT EXISTS iptv_clientes_perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username_cuenta VARCHAR(255) REFERENCES iptv_clientes(username) ON DELETE CASCADE,
  nombre_perfil VARCHAR(255) NOT NULL,
  pin_perfil VARCHAR(4) DEFAULT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_iptv_clientes_perfil_username UNIQUE (username_cuenta, nombre_perfil)
);

-- 4. Estructura unificada bajo ruta: iptv_clientes_historial
-- Motivo: Regitrar el progreso de películas, capítulos de series o streaming reproducidos por cada subperfil
CREATE TABLE IF NOT EXISTS iptv_clientes_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID REFERENCES iptv_clientes_perfiles(id) ON DELETE CASCADE,
  contenido_id VARCHAR(255) NOT NULL,
  tipo_contenido VARCHAR(50) DEFAULT 'movie', -- 'movie', 'series', 'live'
  nombre_contenido VARCHAR(255) NOT NULL,
  minuto_actual INTEGER DEFAULT 0,
  segundo_actual INTEGER DEFAULT 0,
  temporada INTEGER DEFAULT NULL,
  capitulo INTEGER DEFAULT NULL,
  ultima_reproduccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completado BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_iptv_clientes_reproduccion_perfil UNIQUE (perfil_id, contenido_id)
);

-- 5. Estructura unificada bajo ruta: iptv_finanzas_mayorista (Contiene datos de costos, planes externos)
-- Motivo: Replicación diaria de paquetes provistos por la API de XUI.ONE para la compra con créditos/tokens
CREATE TABLE IF NOT EXISTS iptv_finanzas_mayorista (
  id SERIAL PRIMARY KEY,
  package_id INTEGER UNIQUE NOT NULL,
  nombre_paquete VARCHAR(255) NOT NULL,
  creditos_costo NUMERIC(10,2) DEFAULT 1.00,
  precio_sugerido NUMERIC(10,2) DEFAULT 5000.00,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Estructura unificada bajo ruta: iptv_finanzas_config (Guardar parámetros de comisiones, planes locales y socios)
-- Motivo: Centralizar parámetros financieros, planes para venta a clientes y control de caja de Socios (Socio Split)
CREATE TABLE IF NOT EXISTS iptv_finanzas_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dollar_rate NUMERIC(10,2) DEFAULT 1000.00,
  token_package_usd NUMERIC(10,2) DEFAULT 1.00,
  payment_discount NUMERIC(5,2) DEFAULT 0.00,
  additional_tax_percent NUMERIC(5,2) DEFAULT 0.00,
  app_maintenance_cost NUMERIC(10,2) DEFAULT 0.00,
  street_tech_cost NUMERIC(10,2) DEFAULT 0.00,
  provider_plans JSONB DEFAULT '[]'::jsonb,
  sale_plans JSONB DEFAULT '[]'::jsonb,
  partners JSONB DEFAULT '[]'::jsonb,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Estructura unificada bajo ruta: iptv_proveedores_dns (Servidores de DNS para direccionamiento del panel)
-- Motivo: Registrar servidores Xtream Codes disponibles para las conexiones de las cuentas activas
CREATE TABLE IF NOT EXISTS iptv_proveedores_dns (
  id VARCHAR(255) PRIMARY KEY,
  nombre_proveedor VARCHAR(255) NOT NULL,
  url_dns VARCHAR(512) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Estructura unificada bajo ruta: iptv_branding (Preferencias y personalización visual de marca)
-- Motivo: Configurar logotipos, anuncios rotativos mostrados en la app y esquemas visuales del simulador
CREATE TABLE IF NOT EXISTS iptv_branding (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logo_url VARCHAR(512) DEFAULT NULL,
  promo_spot_url VARCHAR(512) DEFAULT NULL,
  banners_rotativos JSONB DEFAULT '[]'::jsonb,
  img_settings JSONB DEFAULT '{}'::jsonb,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar por defecto registros iniciales de configuración para que la app lea de inmediato
INSERT INTO iptv_finanzas_config (id, dollar_rate, token_package_usd, provider_plans, sale_plans, partners)
VALUES (1, 1000.00, 3.50, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO iptv_branding (id, logo_url, promo_spot_url)
VALUES (1, 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHE4OWpvaXZ4cHJ5eDZ4ZWR2c2k4MGh0amNhdXFpOG9ubnF1Z2U4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif')
ON CONFLICT (id) DO NOTHING;

-- Habilitar replicación de datos en tiempo real en Supabase para estas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_clientes_perfiles;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_clientes_historial;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_finanzas_mayorista;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_finanzas_config;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_proveedores_dns;
ALTER PUBLICATION supabase_realtime ADD TABLE iptv_branding;
