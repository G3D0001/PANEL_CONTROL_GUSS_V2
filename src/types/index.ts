export type OrderStatus = 'Presupuesto' | 'Falta Diseñar' | 'Diseñado' | 'En Proceso' | 'En Fabricación' | 'Pendiente Entrega' | 'Entregado';

export interface OrderItem {
  id: string;
  pedido_id: string;
  insumo_id?: string;
  descripcion_custom: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  insumo?: any; // Para los selects o joins de supabase
}

export interface Order {
  id: string; // uuid
  codigo_pedido: string; // "G3D-" o lo que fuera
  fecha_creacion: string;
  
  // Joins o Temporales
  cliente_id?: string;
  vendedor_id?: string;
  cliente_nombre_temporal?: string;
  cliente_telefono_temporal?: string;
  vendedor_temporal?: string;
  
  cliente?: {
    id: string;
    nombre: string;
    email: string;
    telefono_contacto: string;
    direccion_hogar: string;
  };
  vendedor?: {
    id: string;
    nombre: string;
  };
  estado?: {
    id: string;
    nombre_estado: string;
    color_pastel_hex: string;
  };

  tipo_trabajo: string;
  notas_tecnicas?: string[];
  
  monto_total: number;
  monto_pagado: number;
  saldo: number;
  
  estado_id?: string;
  fecha_entrega?: string;
  
  delivery_min?: number;
  delivery_max?: number;
  lat?: number;
  lng?: number;

  items?: OrderItem[];
}

export interface Movement {
  id: string;
  fecha_hora: string;
  usuario: string;
  accion: string;
  id_pedido: string;
  detalle: string;
  anterior?: string;
  nuevo?: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  minimo_alerta: number;
  stock_origin: 'Propio' | 'Proveedor' | 'A Pedido';
  delivery_min?: number;
  delivery_max?: number;
  especificaciones: Record<string, any>;
  detalle_cliente?: string;
  detalle_vendedor?: string;
  detalle_empleado?: string;
  imagenes?: string[];
  publicado: boolean;
  costo_publico: number;
  costo_vendedor: number;
  costo_proveedor?: number;
  proveedor_id?: string;
  category_id?: string;
  category_ids?: string[];
  link_stl?: string;
  link_drive?: string;
  estado?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface SellerProfile {
  id: string;
  nombre_negocio: string;
  logo_url?: string;
  color_primario: string;
  lat?: number;
  lng?: number;
  limite_deuda: number;
  saldo_comisiones: number;
  codigo_promocional?: string;
  created_at?: string;
  iva_incluido?: boolean;
  descuento_efectivo?: number;
  descuento_transferencia?: number;
}

export interface ResellerItem {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  precio_con_iva: number;
  precio_efectivo: number;
  precio_transferencia: number;
  stock: number;
  stock_tipo: 'fijo' | 'produccion';
  dias_produccion_min?: number;
  dias_produccion_max?: number;
  imagenes?: string[];
  link_drive?: string;
  link_stl?: string;
  instrucciones_internas?: string;
  estado: 'activo' | 'pausado' | 'sin_stock';
  revendedor_id: string;
  creado_el?: string;
  last_updated?: string;
}

export interface LogisticsConfig {
  id: number;
  precio_minimo_viaje: number;
  precio_100_metros: number;
  comision_admin_percent: number;
  updated_at?: string;
}

export interface FleteroProfile {
  id: string;
  nombre_completo: string;
  foto_perfil?: string;
  tipo_vehiculo: 'Moto' | 'Auto' | 'Camion';
  peso_max_kg?: number;
  volumen_max_m3?: number;
  saldo_deuda: number;
  activo: boolean;
  viaje_actual_id?: string;
  created_at?: string;
}

export interface LogisticsTravel {
  id: string;
  pedido_id: string;
  fletero_id?: string;
  vendedor_id?: string;
  estado: 'Pendiente' | 'Asignado' | 'En Origen' | 'En Camino' | 'Entregado' | 'Reportado';
  distancia_km?: number;
  monto_total?: number;
  comision_admin?: number;
  qr_vendedor?: string;
  qr_cliente?: string;
  created_at?: string;
}

export interface PerfilLocal {
  id: string;
  email: string;
  password_hash?: string;
  nombre?: string;
  rol?: string;
  avatar_url?: string;
  foto_perfil?: string;
  created_at?: string;
  creditos?: number;
  creditos_demo?: number;
  
  // Nuevos campos IPTV solicitados para métricas y red
  iptv_invitado_por?: string | null;            // Email o ID del reclutador que lo invitó
  iptv_ventas_directas_cant?: number;             // Cantidad de ventas realizadas por el mismo usuario
  iptv_ventas_red_cant?: number;                  // Cantidad total de ventas de sus revendedores/invitados
  iptv_comisiones_cobradas_total?: number;        // Suma total de dinero cobrado en comisiones
}


