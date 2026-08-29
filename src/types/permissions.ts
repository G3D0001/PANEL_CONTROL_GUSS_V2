/**
 * Registro Central de Permisos G3D & XTV
 * Nomenclatura Estricta: Faccion.Subfaccion.Accion
 */

export const PERMISSIONS = {
  // ==========================================
  // FACCIÓN: XTV (TV DIGITAL) - ORGANIZADA POR SUBFACCIONES
  // ==========================================
  XTV_ACCESO: {
    FULL_BRANCH: { id: 'Xtv.*', title: 'Acceso Total XTV', description: 'Control absoluto de todas las funciones del ecosistema XTV.' },
    ACCEDER: { id: 'Xtv.General.Acceder', title: 'Ingresar a XTV', description: 'Permite visualizar e ingresar a la consola de TV Digital XTV.' },
  },

  XTV_LINEAS: {
    CREAR_DIRECTO: { id: 'Xtv.Lineas.CrearDirecto', title: 'Crear Línea Directa (Créditos)', description: 'Permite generar líneas físicas directas consumiendo créditos propios del panel.' },
    SOLICITAR: { id: 'Xtv.Lineas.Solicitar', title: 'Solicitar Activación / Recarga', description: 'Permite enviar pedidos de activación o recarga de líneas a los administradores.' },
    DEMO: { id: 'Xtv.Lineas.Demo', title: 'Generar Demos Gratuitas', description: 'Permite emitir pruebas temporales gratuitas para clientes potenciales.' },
  },

  XTV_CLIENTES: {
    VER_PROPIOS: { id: 'Xtv.Clientes.VerPropios', title: 'Ver Mis Clientes (Propios)', description: 'Permite ver y gestionar únicamente los clientes generados por su propio ID de usuario.' },
    VER_TODOS: { id: 'Xtv.Clientes.VerTodos', title: 'Ver Todos los Clientes (Global)', description: 'Permite supervisar la totalidad de clientes registrados en el sistema (Moderador / Admin).' },
  },

  XTV_RENOVACIONES: {
    VER_PROPIAS: { id: 'Xtv.Renovaciones.VerPropias', title: 'Renovaciones de Mis Clientes', description: 'Permite recibir alertas y renovar los vencimientos de sus propios clientes.' },
    VER_TODAS: { id: 'Xtv.Renovaciones.VerTodas', title: 'Renovaciones Globales', description: 'Permite auditar y procesar todas las renovaciones y vencimientos de la plataforma.' },
  },

  XTV_SOLICITUDES: {
    VER: { id: 'Xtv.Solicitudes.Ver', title: 'Ver Bandeja de Solicitudes', description: 'Permite ver la cola de pedidos de activación y recargas entrantes.' },
    APROBAR: { id: 'Xtv.Solicitudes.Aprobar', title: 'Aprobar y Despachar Solicitudes', description: 'Permite aprobar, rechazar y asignar líneas a los pedidos de vendedores.' },
  },

  XTV_FINANZAS: {
    VER_PROPIAS: { id: 'Xtv.Finanzas.VerPropias', title: 'Billetera y Comisiones Propias', description: 'Permite consultar saldo disponible, solicitar cobro de comisiones y ver red de invitados.' },
    LIQUIDAR_ADMIN: { id: 'Xtv.Finanzas.LiquidarAdmin', title: 'Liquidar Pagos a la Red', description: 'Permite autorizar, bloquear y registrar transferencias de comisiones a los vendedores.' },
  },

  XTV_AJUSTES: {
    PLANES: { id: 'Xtv.Ajustes.Planes', title: 'Configurar Planes & Comisiones', description: 'Permite crear o editar planes minoristas y porcentajes de comisiones multinivel.' },
    PANEL_XC: { id: 'Xtv.Ajustes.PanelXC', title: 'Configuración Servidor XC / API', description: 'Permite modificar credenciales, DNS y balance de servidores Xtream UI / XC.' },
  },

  // ==========================================
  // FACCIÓN: TIENDA G3D (UNIFICADA CON 1 SOLO PERMISO MAESTRO)
  // ==========================================
  G3D: {
    FULL_BRANCH: { id: 'G3d.*', title: 'Control Total G3D', description: 'Acceso ilimitado a todos los módulos de la tienda G3D.' },
    ACCESO_COMPLETO: { id: 'G3d.AccesoCompleto', title: 'Acceso Completo a Tienda G3D', description: 'Desbloquea todos los módulos de Tienda G3D (Catálogo, Pedidos, Stock, Logística, Proveedores y Moderación).' },
  },

  // ==========================================
  // FACCIÓN: ADMINISTRACIÓN Y SISTEMA
  // ==========================================
  ADMIN: {
    FULL_BRANCH: { id: 'Admin.*', title: 'Control Absoluto (SuperAdmin)', description: 'Privilegios totales e irrestrictos sobre todas las secciones de la plataforma.' },
    USUARIOS_GESTIONAR: { id: 'Admin.Usuarios.Gestionar', title: 'Gestión Integral de Usuarios', description: 'Crear, editar contraseñas, datos personales y bancarios de usuarios.' },
    PERMISOS_GESTIONAR: { id: 'Admin.Permisos.Gestionar', title: 'Gestión de Roles y Permisos RBAC', description: 'Modificar roles, herencias y matriz de permisos del sistema.' },
    AJUSTES_GESTIONAR: { id: 'Admin.Ajustes.Gestionar', title: 'Ajustes Globales del Sistema', description: 'Configurar branding, logotipos, WhatsApp y parámetros generales.' },
  }
} as const;

export type PermissionNode = string;

export const getAllPermissionsList = () => {
  const list: { id: string; label: string; description: string; group: string }[] = [];
  Object.entries(PERMISSIONS).forEach(([groupName, group]) => {
    Object.entries(group).forEach(([key, value]) => {
      list.push({
        id: value.id,
        label: (value as any).title || key.replace(/_/g, ' '),
        description: value.description,
        group: groupName
      });
    });
  });
  return list;
};
