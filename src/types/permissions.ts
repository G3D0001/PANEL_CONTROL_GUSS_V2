/**
 * Registro Central de Permisos G3D - VERSIÓN LIMPIA DE RAÍZ
 * Nomenclatura: Seccion.Subseccion.Accion
 */

export const PERMISSIONS = {
  ADMIN: {
    FULL_BRANCH: { id: 'Admin.*', title: 'Control Absoluto', description: 'Control absoluto.' },
    ACCEDER_ADMINISTRACION: { id: 'Admin.VistaGeneral.Ver', title: 'Acceder a Administración Central', description: 'Acceso a la vista de administración general de la plataforma.' },
    CONSOLA_API_VER: { id: 'Admin.ConsolaAPI.Ver', title: 'Ver Consola y Logs XC', description: 'Ver Consola de Comandos y Logs de la API XC de IPTV' },
    INTEGRACION_XC_CONSOLA_ACCEDER: { id: 'Admin.IntegracionXC.Acceder', title: 'Acceder a Integración XC', description: 'Acceder a la Vista Previa del Cliente y Consola de Integración XC para Aprobar Líneas' },
    MODO_EDICION_INTERFAZ: { id: 'Admin.ModoEdicionInterface.Habilitar', title: 'Habilitar modo edición de interfaz', description: 'Permite habilitar el modo edición para personalizar en tiempo real los títulos, leyendas e íconos en el inicio.' },
  },
  STOCK: {
    FULL_BRANCH: { id: 'Stock.*', title: 'Control de Inventario', description: 'Control de Inventario.' },
    ACCEDER_CATALOGO: { id: 'Stock.VistaGeneral.Ver', title: 'Acceder a Catálogo y Stock', description: 'Acceso completo a la gestión de productos, inventario y catálogo.' },
  },
  PEDIDOS: {
    FULL_BRANCH: { id: 'Pedidos.*', title: 'Gestión de Ventas', description: 'Gestión de Ventas.' },
    ACCEDER_PEDIDOS: { id: 'Pedidos.VistaGeneral.Ver', title: 'Acceder a Pedidos', description: 'Acceso completo a la vista y gestión de pedidos de ventas.' },
    VENDEDOR_MAYORISTA_G3D: { id: 'Pedidos.VendedorG3D.Mayorista', title: 'Vendedor Habilitado Mayorista G3D', description: 'Permite al usuario figurar en la lista desplegable de vendedores mayoristas de la categoría G3D.' },
  },
  PRODUCCION: {
    FULL_BRANCH: { id: 'Produccion.*', title: 'Área de Taller', description: 'Área de Taller.' },
    ACCEDER_PRODUCCION: { id: 'Produccion.VistaGeneral.Ver', title: 'Acceder a Producción', description: 'Acceso completo al módulo de producción y taller.' },
  },
  LOGISTICA: {
    FULL_BRANCH: { id: 'Logistica.*', title: 'Logística y Envíos', description: 'Logística y Envíos.' },
    ACCEDER_LOGISTICA: { id: 'Logistica.VistaGeneral.Ver', title: 'Acceder a Logística Central', description: 'Acceso completo a la gestión logística, fleteros y envíos.' },
  },
  IPTV: {
    FULL_BRANCH: { id: 'Iptv.*', title: 'Control de IPTV Absoluto', description: 'Control de IPTV Absoluto.' },
    INGRESAR_MENU_INICIO_XTV: { id: 'Iptv.InicioResendores.Ingresar', title: 'Ingresar al menú de Inicio de XTV', description: 'Permite el ingreso al menú principal de XTV (Panel de Resendedores).' },
    VER_Y_INTERACTUAR_INICIO_XTV: { id: 'Iptv.InicioResendores.VerYInteractuar', title: 'Ver e Interactuar en pantalla Inicio XTV', description: 'Permite visualizar e interactuar completamente con el menú de inicio de XTV (Panel de Revendedores).' },
    
    // Crear Cuenta Directa (Carga Inmediata)
    CREAR_DIRECTO_VER: { id: 'Iptv.CrearDirecto.Ver', title: 'Ver Botón Crear Cuenta Directa', description: 'Permite visualizar el botón Crear Cuenta Directa en el menú de inicio.' },
    CREAR_DIRECTO_ACCEDER: { id: 'Iptv.CrearDirecto.Acceder', title: 'Acceder a Crear Cuenta Directa', description: 'Permite hacer clic y abrir la funcionalidad de Crear Cuenta Directa.' },
    
    // Solicitar Activación (Ticket de Soporte)
    SOLICITAR_ACTIVACION_VER: { id: 'Iptv.SolicitarActivacion.Ver', title: 'Ver Botón Solicitar Activación', description: 'Permite visualizar el botón Solicitar Activación en el menú de inicio.' },
    SOLICITAR_ACTIVACION_ACCEDER: { id: 'Iptv.SolicitarActivacion.Acceder', title: 'Acceder a Solicitar Activación', description: 'Permite hacer clic y abrir la funcionalidad de Solicitar Activación.' },
    
    // Renovaciones
    RENOVACIONES_VER: { id: 'Iptv.Renovaciones.Ver', title: 'Ver Botón Renovación (Beta)', description: 'Permite visualizar el botón de Renovaciones en el menú de inicio.' },
    RENOVACIONES_ACCEDER: { id: 'Iptv.Renovaciones.Acceder', title: 'Acceder a Renovación (Beta)', description: 'Permite hacer clic y abrir la funcionalidad de Renovación.' },
    RENOVACIONES_VER_TODOS: { id: 'Iptv.Renovaciones.VerTodos', title: 'Ver todos los clientes en Renovaciones', description: 'Permite visualizar todos los clientes de la plataforma en la lista de Renovaciones.' },
    RENOVACIONES_VER_PROPIOS: { id: 'Iptv.Renovaciones.VerPropios', title: 'Ver solo clientes propios en Renovaciones', description: 'Permite visualizar únicamente los clientes que fueron creados por el usuario activo en la lista de Renovaciones (los clientes aprobados de otros no cuentan).' },
    RENOVACIONES_RENOVAR_GENERAL: { id: 'Iptv.Renovaciones.RenovarGeneral', title: 'Renovar / extender líneas en general', description: 'Permite renovar o extender la membresía de cualquier cliente en la plataforma.' },
    RENOVACIONES_RENOVAR_PROPIOS: { id: 'Iptv.Renovaciones.RenovarPropios', title: 'Renovar / aprobar solo líneas propias agregadas', description: 'Permite renovar/aprobar líneas únicamente para los usuarios o clientes que el propio usuario ha agregado.' },
    
    // Solicitudes
    SOLICITUDES_VER: { id: 'Iptv.Solicitudes.Ver', title: 'Ver Botón Solicitudes APK / Créditos', description: 'Permite visualizar el botón de solicitudes pendientes en el inicio.' },
    SOLICITUDES_ACCEDER: { id: 'Iptv.Solicitudes.Acceder', title: 'Acceder a Solicitudes APK / Créditos', description: 'Permite hacer clic y abrir la sección de solicitudes recibidas.' },
    SOLICITUDES_VER_TODAS: { id: 'Iptv.Solicitudes.VerTodas', title: 'Ver Solicitudes Globales', description: 'Ver todas las solicitudes de todos los usuarios.' },
    SOLICITUDES_APROBAR: { id: 'Iptv.Solicitudes.Aprobar', title: 'Aprobar o rechazar creación o renovación de líneas', description: 'Aprobar o rechazar creación o renovación de líneas.' },
    SOLICITUDES_HISTORIAL: { id: 'Iptv.Solicitudes.Historial', title: 'Acceder al historial de solicitudes globales', description: 'Acceder al historial de solicitudes globales.' },
    SOLICITUDES_NOTIFICAR: { id: 'Iptv.Solicitudes.Notificar', title: 'Recibir notificaciones de nueva solicitud activa', description: 'Recibir notificaciones en pantalla de nueva solicitud activa.' },
    SOLICITUDES_NOTIFICACION_ACTIVADA: { id: 'Iptv.Solicitudes.NotificarActivacionExitosa', title: 'Recibir notificación de cuenta activada con plantilla para WhatsApp', description: 'Recibir notificación de cuenta activada con plantilla para WhatsApp.' },
    SOLICITUDES_RECIBIR_SOLO_HIJOS: { id: 'Iptv.Solicitudes.RecibirSoloHijos', title: 'Recibir solicitudes de activación de línea únicamente de sus roles hijo', description: 'Recibir solicitudes de activación de línea únicamente de sus roles hijo.' },
    
    // Clientes
    CLIENTES_VER: { id: 'Iptv.Clientes.Ver', title: 'Ver Botón Mis Clientes', description: 'Permite visualizar el botón Mis Clientes en el menú de inicio.' },
    CLIENTES_ACCEDER: { id: 'Iptv.Clientes.Acceder', title: 'Acceder a Mis Clientes', description: 'Permite hacer clic y abrir la sección del listado de clientes.' },
    CLIENTES_VER_PROPIOS: { id: 'Iptv.Clientes.VerPropios', title: 'Permitir visualizar únicamente sus propios clientes creados', description: 'Permitir visualizar únicamente sus propios clientes creados.' },
    CLIENTES_VER_HIJOS: { id: 'Iptv.Clientes.VerHijos', title: 'Permitir visualizar los clientes de todos sus roles subordinados (roles hijo)', description: 'Permitir visualizar los clientes de todos sus roles subordinados (roles hijo).' },
    
    // Finanzas
    FINANZAS_VER: { id: 'Iptv.Finanzas.Ver', title: 'Ver Botón Finanzas de Vendedores', description: 'Permite visualizar el botón de Finanzas en el inicio.' },
    FINANZAS_ACCEDER: { id: 'Iptv.Finanzas.Acceder', title: 'Acceder a Finanzas de Vendedores', description: 'Permite hacer clic y abrir la sección de finanzas y comisiones.' },
    FINANZAS_REVENDEDORES_VER: { id: 'Iptv.FinanzasRevendedores.Ver', title: 'Ver botón de Finanzas de Vendedores (Legacy)', description: 'Permite acceder a la administración y visualización de comisiones y redes de vendedores de IPTV.' },
    FINANZAS_REVENDEDORES_ACCEDER: { id: 'Iptv.FinanzasRevendedores.Acceder', title: 'Acceder a Finanzas de Vendedores (Legacy)', description: 'Permite acceder a la administración de comisiones de red.' },
    COMISIONES_SOLICITUDES_INTERACTUAR: { id: 'Iptv.ComisionesSolicitudes.Interactuar', title: 'Interactuar con Bandeja de Pago de Comisiones', description: 'Permite ver e interactuar con la bandeja de solicitudes de pago de comisiones.' },
    
    // Tutoriales
    TUTORIALES_VER: { id: 'Iptv.Tutoriales.Ver', title: 'Ver Botón Respuesta Rápida WSP', description: 'Permite visualizar el botón de Respuesta Rápida WSP en el menú de inicio.' },
    TUTORIALES_ACCEDER: { id: 'Iptv.Tutoriales.Acceder', title: 'Acceder a Respuesta Rápida WSP', description: 'Permite hacer clic y abrir la sección de Respuestas Rápidas WSP y plantillas.' },
    AYUDA_CREDITOS_ACCEDER: { id: 'Iptv.AyudaCreditos.Acceder', title: 'Acceder a Ayuda / Créditos (Legacy)', description: 'Acceder a Ayuda / Créditos (Legacy)' },
    
    // WhatsApp Automations
    WHATSAPP_XTV_VER: { id: 'Iptv.WhatsappXtv.Ver', title: 'Ver Botón WhatsApp XTV', description: 'Permite visualizar el botón de WhatsApp XTV en el inicio.' },
    WHATSAPP_XTV_ACCEDER: { id: 'Iptv.WhatsappXtv.Acceder', title: 'Acceder a WhatsApp XTV', description: 'Permite hacer clic y abrir la sección de automatizaciones de WhatsApp.' },
    
    // Ajustes XTV
    AJUSTES_VER: { id: 'Iptv.Ajustes.Ver', title: 'Ver Botón Ajustes XTV', description: 'Permite visualizar el botón de Ajustes XTV en el inicio.' },
    AJUSTES_ACCEDER: { id: 'Iptv.Ajustes.Acceder', title: 'Acceder a Ajustes de XTV (IPTV)', description: 'Permite hacer clic y acceder a la administración central de XTV.' },
    
    CREDITOS_XC_PANEL_VER: { id: 'Iptv.CreditosXC.Ver', title: 'Ver créditos de XC Panel', description: 'Permite visualizar la caja de créditos disponibles del panel XC en la pantalla de inicio.' },
    BRANDING_VER: { id: 'Iptv.Branding.Ver', title: 'Ver Pestaña de Branding', description: 'Ver Pestaña de Marca y Publicidad (Branding).' },
    MENSAJES_VER: { id: 'Iptv.Mensajes.Ver', title: 'Ver Pestaña de Mensajería', description: 'Ver Pestaña de Mensajería y Soporte.' },
  },
  SEGURIDAD: {
    FULL_BRANCH: { id: 'Seguridad.*', title: 'Gestión de Acceso Absoluto', description: 'Gestión de Acceso Absoluto (Crear, Editar, Eliminar y Configurar Roles y Permisos).' },
    ACCEDER_SEGURIDAD: { id: 'Seguridad.VistaGeneral.Ver', title: 'Acceso a Seguridad', description: 'Acceso a la sección de control de Seguridad.' },
    GESTION_MIEMBROS: { id: 'Seguridad.Miembros.Gestion', title: 'Gestión de Usuarios', description: 'Crear, editar, eliminar usuarios y asignarles roles.' },
    GESTION_PERMISOS: { id: 'Seguridad.Permisos.Gestion', title: 'Gestión de Permisos', description: 'Administrar los permisos de usuarios y roles (restringido a los permisos que el administrador activo posee).' },
    MIEMBROS_CREAR: { id: 'Seguridad.Miembros.Crear', title: 'Crear Usuarios Colaboradores', description: 'Permiso específico para dar de alta nuevos usuarios colaboradores.' },
    ROLES_CREAR: { id: 'Seguridad.Roles.Crear', title: 'Crear Roles Maestros', description: 'Permiso específico para crear nuevos roles maestros (los cuales heredarán de un rol padre disponible).' },
    ADMINISTRADOR_GENERAL: { id: 'Seguridad.AdministradorGeneral', title: 'Administrador General (SuperAdmin)', description: 'Acceso total como Administrador General (SuperAdmin absoluto, sin depender de jerarquías).' },
    EDITAR_DATOS_PERSONALES: { id: 'Seguridad.Perfil.EditarDatosPersonales', title: 'Editar Datos Personales Propios', description: 'Editar sus propios datos personales en cualquier momento. Si se desactiva, no podrá modificarlos tras la carga inicial y requerirá reset del rol padre.' },
    MIEMBROS_GESTION_HIJOS: { id: 'Seguridad.Miembros.GestionHijos', title: 'Gestionar Usuarios Subordinados (Hijos)', description: 'Permite crear, editar, reestablecer clave o eliminar únicamente a usuarios de tus roles hijo o subordinados.' },
    ROLES_ASIGNAR_HIJOS: { id: 'Seguridad.Roles.AsignarHijos', title: 'Asignar únicamente roles subordinados', description: 'Garantiza que al crear/editar un usuario solo puedas asignarle roles que sean hijos jerárquicos de tu propio rol.' },
    ROLES_CREAR_SUBORDINADOS: { id: 'Seguridad.Roles.CrearSubordinados', title: 'Crear sub-roles jerárquicos', description: 'Permite dar de alta nuevos sub-roles que dependan de tu propio rol o de tus roles hijos subordinados.' },
    PERMISOS_LIMITAR_PROPIOS: { id: 'Seguridad.Permisos.LimitarAPermitidos', title: 'Limitar concesión a tus propios permisos', description: 'Evita la escalada de privilegios impidiendo que otorgues a tus roles hijos permisos que tú mismo tienes denegados.' }
  },
  FINANZAS_CONSOLIDADAS: {
    FULL_BRANCH: { id: 'Finanzas.*', title: 'Control Financiero Absoluto', description: 'Acceso total a las métricas financieras, caja y comprobantes.' },
    ACCEDER_DASHBOARD_ADMIN: { id: 'Finanzas.DashboardAdmin.Acceder', title: 'Acceder a Finanzas Centrales de Administrador', description: 'Permite ingresar a la facción privada del Administrador con métricas globales, caja neta, gráficos de rendimiento XTV vs G3D y balances.' },
    VER_FINANZAS_XTV: { id: 'Finanzas.Xtv.Ver', title: 'Ver Finanzas de XTV (IPTV)', description: 'Permite visualizar ventas, créditos y métricas del módulo XTV.' },
    VER_FINANZAS_G3D: { id: 'Finanzas.G3d.Ver', title: 'Ver Finanzas de G3D (Diseño e Impresión)', description: 'Permite visualizar ventas, señas, cobros y costos del módulo G3D.' },
    AUDITAR_COMPROBANTES: { id: 'Finanzas.Comprobantes.Auditar', title: 'Auditar Comprobantes de Pago', description: 'Permite revisar, aprobar o verificar los comprobantes de transferencia y cobros en efectivo cargados por usuarios.' },
    REGISTRAR_PAGO_MULTI_ITEM: { id: 'Finanzas.Pagos.RegistrarMultiItem', title: 'Registrar Pagos Multi-Pedido con Comprobante', description: 'Permite seleccionar múltiples pedidos para rendir o saldar vinculando un único comprobante o retención en efectivo.' },
  },
  G3D: {
    FULL_BRANCH: { id: 'G3d.*', title: 'Control Total G3D', description: 'Otorga control y acceso total a la facción de G3D.' },
    CREAR_PEDIDO_VER: { id: 'G3d.CrearPedido.Ver', title: 'Ver botón Crear Pedido', description: 'Permite visualizar el botón de Crear Pedido en la pantalla de inicio de G3D.' },
    CREAR_PEDIDO_ACCEDER: { id: 'G3d.CrearPedido.Acceder', title: 'Acceder a Crear Pedido', description: 'Permite hacer clic y acceder a la funcionalidad de Crear Pedido.' },
    LISTA_PRECIOS_VER: { id: 'G3d.ListaPrecios.Ver', title: 'Ver botón Lista de Precios', description: 'Permite visualizar el botón de Lista de Precios en la pantalla de inicio de G3D.' },
    LISTA_PRECIOS_ACCEDER: { id: 'G3d.ListaPrecios.Acceder', title: 'Acceder a Lista de Precios', description: 'Permite hacer clic y acceder a la pantalla de Lista de Precios.' },
    PEDIDOS_VER: { id: 'G3d.Pedidos.Ver', title: 'Ver botón Pedidos G3D', description: 'Permite visualizar el botón de Pedidos G3D en la pantalla de inicio de G3D.' },
    PEDIDOS_ACCEDER: { id: 'G3d.Pedidos.Acceder', title: 'Acceder a Pedidos G3D', description: 'Permite hacer clic y acceder a la sección de Pedidos G3D.' },
    STOCK_VER: { id: 'G3d.Stock.Ver', title: 'Ver botón Stock G3D', description: 'Permite visualizar el botón de Stock G3D en la pantalla de inicio de G3D.' },
    STOCK_ACCEDER: { id: 'G3d.Stock.Acceder', title: 'Acceder a Stock G3D', description: 'Permite hacer clic y acceder a la sección de Stock G3D.' },
    PRECIO_MAYORISTA_VER: { id: 'G3d.PrecioMayorista.Ver', title: 'Acceso a precio mayorista', description: 'Permite visualizar el precio mayorista en la lista de precios y catálogo de productos.' },
    CLIENTE_OPCIONAL: { id: 'G3d.CrearPedido.ClienteOpcional', title: 'Campos de Cliente Opcionales', description: 'Permite que los campos Nombre Completo del Cliente y Teléfono del Cliente sean opcionales al registrar un pedido en G3D.' },
    VENDEDOR_MANUAL_ESCRIBIR: { id: 'G3d.CrearPedido.EscribirVendedor', title: 'Escribir Vendedor Manual', description: 'Permite escribir manualmente el nombre del vendedor en lugar de limitarse al desplegable de usuarios.' },
    CATALOGO_ELIMINAR: { id: 'G3d.Catalogo.Eliminar', title: 'Eliminar Ítem del Catálogo G3D', description: 'Permite eliminar de forma permanente un ítem y todas sus variantes de la base de datos de la lista de precios de G3D.' },
  },
  INICIO: {
    FULL_BRANCH: { id: 'Inicio.*', title: 'Control Pantalla de Inicio', description: 'Control de botones en la pantalla de inicio principal.' },
    G3D_VER: { id: 'Inicio.G3d.Ver', title: 'Ver botón G3D', description: 'Permite visualizar el botón G3D en la pantalla principal.' },
    G3D_ACCEDER: { id: 'Inicio.G3d.Acceder', title: 'Acceder a G3D', description: 'Permite hacer clic e ingresar al menú de G3D.' },
    XTV_VER: { id: 'Inicio.Xtv.Ver', title: 'Ver botón XTV Panel', description: 'Permite visualizar el botón de XTV Panel en la pantalla principal.' },
    XTV_ACCEDER: { id: 'Inicio.Xtv.Acceder', title: 'Acceder a XTV Panel', description: 'Permite hacer clic e ingresar al menú de XTV.' },
    FINANZAS_VER: { id: 'Inicio.Finanzas.Ver', title: 'Ver botón Finanzas', description: 'Permite visualizar el botón de Finanzas en la pantalla principal de Inicio.' },
    FINANZAS_ACCEDER: { id: 'Inicio.Finanzas.Acceder', title: 'Acceder a Finanzas', description: 'Permite hacer clic e ingresar al módulo de Finanzas para usuarios y vendedores.' },
    FINANZAS_ADMIN_VER: { id: 'Inicio.FinanzasAdmin.Ver', title: 'Ver botón Finanzas Admin', description: 'Permite visualizar el botón de Finanzas Admin en la pantalla principal de Inicio.' },
    FINANZAS_ADMIN_ACCEDER: { id: 'Inicio.FinanzasAdmin.Acceder', title: 'Acceder a Finanzas Admin', description: 'Permite ingresar a la consola centralizada de Finanzas Admin para el Administrador.' },
    PEDIDOS_VER: { id: 'Inicio.Pedidos.Ver', title: 'Ver botón Pedidos (v1)', description: 'Permite visualizar el botón de Pedidos (v1) en la pantalla principal.' },
    PEDIDOS_ACCEDER: { id: 'Inicio.Pedidos.Acceder', title: 'Acceder a Pedidos (v1)', description: 'Permite acceder a la sección de Pedidos tradicional.' },
    CONFIG_VER: { id: 'Inicio.Config.Ver', title: 'Ver botón Mi Perfil y Negocio', description: 'Permite visualizar el botón de Perfil y Negocio en la pantalla principal.' },
    CONFIG_ACCEDER: { id: 'Inicio.Config.Acceder', title: 'Acceder a Mi Perfil y Negocio', description: 'Permite ingresar a la pantalla de Perfil y Negocio.' },
    UTILIDADES_VER: { id: 'Inicio.Utilidades.Ver', title: 'Ver botón Utilidades', description: 'Permite visualizar el botón de Utilidades en la pantalla principal.' },
    UTILIDADES_ACCEDER: { id: 'Inicio.Utilidades.Acceder', title: 'Acceder a Utilidades', description: 'Permite acceder al menú de utilidades.' },
  },
  CONFIGURACIONES: {
    FULL_BRANCH: { id: 'Config.*', title: 'Control Pantalla de Configuraciones', description: 'Control de botones en el menú express de Configuraciones.' },
    CATALOGO_VER: { id: 'Config.Catalogo.Ver', title: 'Ver botón Catálogo & Stock', description: 'Permite visualizar el botón Catálogo & Stock en Configuraciones.' },
    CATALOGO_ACCEDER: { id: 'Config.Catalogo.Acceder', title: 'Acceder a Catálogo & Stock', description: 'Permite acceder a la pantalla de Catálogo.' },
    MODERACION_VER: { id: 'Config.Moderacion.Ver', title: 'Ver botón Moderación Store', description: 'Permite visualizar el botón de Moderación Store.' },
    MODERACION_ACCEDER: { id: 'Config.Moderacion.Acceder', title: 'Acceder a Moderación Store', description: 'Permite acceder a la pantalla de Moderación.' },
    PEDIDOS_VER: { id: 'Config.Pedidos.Ver', title: 'Ver botón Pedidos (v1)', description: 'Permite visualizar el botón de Pedidos.' },
    PEDIDOS_ACCEDER: { id: 'Config.Pedidos.Acceder', title: 'Acceder a Pedidos (v1)', description: 'Permite acceder a la pantalla de Pedidos.' },
    CLASIFICACION_VER: { id: 'Config.Clasificacion.Ver', title: 'Ver botón Categorías y Flujos', description: 'Permite visualizar el botón de Categorías y Flujos.' },
    CLASIFICACION_ACCEDER: { id: 'Config.Clasificacion.Acceder', title: 'Acceder a Categorías y Flujos', description: 'Permite acceder a la sección de Categorías y Flujos.' },
    PROVEEDORES_VER: { id: 'Config.Proveedores.Ver', title: 'Ver botón Proveedores', description: 'Permite visualizar el botón de Proveedores.' },
    PROVEEDORES_ACCEDER: { id: 'Config.Proveedores.Acceder', title: 'Acceder a Proveedores', description: 'Permite acceder a la pantalla de Proveedores.' },
    REVENDEDORES_VER: { id: 'Config.Revendedores.Ver', title: 'Ver botón Revendedores', description: 'Permite visualizar el botón de Revendedores.' },
    REVENDEDORES_ACCEDER: { id: 'Config.Revendedores.Acceder', title: 'Acceder a Revendedores', description: 'Permite acceder a la pantalla de Revendedores.' },
    LOGISTICA_VER: { id: 'Config.Logistica.Ver', title: 'Ver botón Logística Central', description: 'Permite visualizar el botón de Logística Central.' },
    LOGISTICA_ACCEDER: { id: 'Config.Logistica.Acceder', title: 'Acceder a Logística Central', description: 'Permite acceder a la pantalla de Logística.' },
    REPORTES_VER: { id: 'Config.Reportes.Ver', title: 'Ver botón Centro de Reportes', description: 'Permite visualizar el botón de Centro de Reportes.' },
    REPORTES_ACCEDER: { id: 'Config.Reportes.Acceder', title: 'Acceder a Centro de Reportes', description: 'Permite acceder a la pantalla de Reportes.' },
    HISTORIAL_VER: { id: 'Config.Historial.Ver', title: 'Ver botón Historial', description: 'Permite visualizar el botón de Historial.' },
    HISTORIAL_ACCEDER: { id: 'Config.Historial.Acceder', title: 'Acceder a Historial', description: 'Permite acceder a la pantalla de Historial.' },
    APPS_VER: { id: 'Config.Apps.Ver', title: 'Ver botón Aplicaciones', description: 'Permite visualizar el botón de Aplicaciones.' },
    APPS_ACCEDER: { id: 'Config.Apps.Acceder', title: 'Acceder a Aplicaciones', description: 'Permite acceder a la pantalla de Aplicaciones.' },
    AJUSTES_VER: { id: 'Config.Ajustes.Ver', title: 'Ver botón Ajustes de Sistema', description: 'Permite visualizar el botón de Ajustes de Sistema.' },
    AJUSTES_ACCEDER: { id: 'Config.Ajustes.Acceder', title: 'Acceder a Ajustes de Sistema', description: 'Permite acceder a la pantalla de Ajustes.' },
  },
  UTILIDADES: {
    FULL_BRANCH: { id: 'Utilidades.*', title: 'Control Pantalla de Utilidades', description: 'Control de botones en el menú de Utilidades.' },
    SIMULADOR_CHOP_VER: { id: 'Utilidades.SimuladorChop.Ver', title: 'Ver botón Simulador Jarra Chop', description: 'Permite visualizar el botón del simulador.' },
    SIMULADOR_CHOP_ACCEDER: { id: 'Utilidades.SimuladorChop.Acceder', title: 'Acceder a Simulador Jarra Chop', description: 'Permite ingresar al simulador interactivo.' },
    SIMULADOR_CHOP_AJUSTES_VER: { id: 'Utilidades.SimuladorChop.AjustesFabricante.Ver', title: 'Ver Botón Ajustes del Fabricante', description: 'Permite visualizar el botón para configurar las partes y filamentos del simulador.' },
    SIMULADOR_CHOP_AJUSTES_ACCEDER: { id: 'Utilidades.SimuladorChop.AjustesFabricante.Acceder', title: 'Acceder a Ajustes del Fabricante', description: 'Permite modificar los moldes, siluetas de mango, topes, bases y filamentos del simulador.' },
    TUTORIALES_VER: { id: 'Utilidades.Tutoriales.Ver', title: 'Ver botón Respuesta Rápida WSP', description: 'Permite visualizar el botón Respuesta Rápida WSP.' },
    TUTORIALES_ACCEDER: { id: 'Utilidades.Tutoriales.Acceder', title: 'Acceder a Respuesta Rápida WSP', description: 'Permite ingresar a Respuestas Rápidas WSP.' },
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
