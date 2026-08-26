-- Script para agregar campos de IPTV y métricas de red a la tabla perfiles_locales de Supabase
-- Ejecuta este script en el editor SQL de Supabase para habilitar estas columnas.

-- 1. Agregar columna para asentar quién invitó al usuario (upline/reclutador)
ALTER TABLE public.perfiles_locales 
ADD COLUMN IF NOT EXISTS iptv_invitado_por TEXT DEFAULT NULL;

-- 2. Agregar columna para asentar la cantidad de ventas directas realizadas por el usuario
ALTER TABLE public.perfiles_locales 
ADD COLUMN IF NOT EXISTS iptv_ventas_directas_cant INTEGER DEFAULT 0;

-- 3. Agregar columna para asentar la cantidad total de ventas realizadas por sus revendedores invitados
ALTER TABLE public.perfiles_locales 
ADD COLUMN IF NOT EXISTS iptv_ventas_red_cant INTEGER DEFAULT 0;

-- 4. Agregar columna para asentar la suma total de dinero de comisiones cobradas/liquidadas
ALTER TABLE public.perfiles_locales 
ADD COLUMN IF NOT EXISTS iptv_comisiones_cobradas_total NUMERIC DEFAULT 0;
