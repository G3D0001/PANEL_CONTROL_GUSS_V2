-- =========================================================================
-- SEMILLA DE DATOS: CATEGORÍAS Y FLUJOS DE TRABAJO (MOCKS VISUALES)
-- =========================================================================

-- 1. Insertar Categorías Principales
INSERT INTO public.categorias (id, nombre, icon_name, color) VALUES 
('11111111-1111-1111-1111-111111111111', 'Impresión 3D', 'Box', '#3B82F6'),
('22222222-2222-2222-2222-222222222222', 'Indumentaria', 'Shirt', '#EF4444'),
('33333333-3333-3333-3333-333333333333', 'Cartelería', 'Monitor', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Subcategorías
INSERT INTO public.categorias (id, nombre, icon_name, color, parent_id) VALUES 
('11111111-1111-1111-1111-111111111112', 'Figuras de Acción', 'Image', '#3B82F6', '11111111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111113', 'Repuestos', 'Wrench', '#3B82F6', '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222223', 'Remeras Oversize', 'Shirt', '#EF4444', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Flujos de Trabajo
INSERT INTO public.flujos (id, name) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Producción 3D Completa'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sublimación Rápida')
ON CONFLICT (id) DO NOTHING;

-- 4. Asociar Categorías a los Flujos
INSERT INTO public.flujo_categorias (flujo_id, categoria_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'), -- 3D -> Prod 3D
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222')  -- Indumentaria -> Sublimación
ON CONFLICT DO NOTHING;

-- 5. Crear los Estados del Flujo (Producción 3D)
INSERT INTO public.flujo_estados (flujo_id, name, color, step_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cola de Impresión', '#F59E0B', 0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Imprimiendo...', '#3B82F6', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Post-Procesado y Pintura', '#8B5CF6', 2),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Calidad Aprobada', '#10B981', 3);

-- 6. Crear los Estados del Flujo (Sublimación Rápida)
INSERT INTO public.flujo_estados (flujo_id, name, color, step_order) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Selección de Prenda', '#EF4444', 0),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Planchado', '#3B82F6', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Listo para Entregar', '#10B981', 2);
