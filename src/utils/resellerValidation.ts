/**
 * Capa de Validación y Sanitización Preventiva para Revendedores (Xtream-Masters v2.0)
 * 
 * Reglas de negocio para revendedores:
 * 1. Prohibido enviar credenciales personalizadas (username / password) en creación directa.
 *    El panel Xtream-Masters autogenera credenciales aleatorias seguras y rechaza o ignora valores manuales.
 * 2. extend_line solo admite id y package en el panel físico. Si se requiere modificar pantallas (max_connections),
 *    se debe promover a edit_line.
 * 3. En altas masivas o reintentos, siempre garantizar request_id único para evitar cobros duplicados.
 * 4. Control de campos permitidos por acción para evitar errores 400/500 del backend proveedor.
 */

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  actionTaken: 'stripped' | 'promoted' | 'normalized' | 'warn_only';
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedPayload: Record<string, any>;
  warnings: ValidationWarning[];
  errorMessage?: string;
}

export function validateResellerApiPayload(
  action: string,
  rawPayload: Record<string, any>
): ValidationResult {
  const payload: Record<string, any> = { ...rawPayload };
  const warnings: ValidationWarning[] = [];

  const targetAction = String(payload.action || action || '').trim();

  // 1. Generar request_id si no existe para proteger contra doble cobro (Idempotencia)
  if (!payload.request_id && ['create_line', 'create_demo', 'extend_line', 'edit_line', 'create_mag', 'create_enigma', 'create_activecode'].includes(targetAction)) {
    payload.request_id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g3d-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // 2. Validaciones por tipo de acción
  if (targetAction === 'create_line' || targetAction === 'create_demo') {
    // REGLA REVENDEDOR: No se pueden enviar username ni password en creación
    if (payload.username && String(payload.username).trim() !== '') {
      warnings.push({
        field: 'username',
        code: 'reseller_custom_username_forbidden',
        message: 'Como revendedor no tienes permiso para forzar nombres de usuario. El panel Xtream-Masters generará uno nativo.',
        actionTaken: 'stripped'
      });
      delete payload.username;
    }

    if (payload.password && String(payload.password).trim() !== '') {
      warnings.push({
        field: 'password',
        code: 'reseller_custom_password_forbidden',
        message: 'Como revendedor no tienes permiso para asignar contraseñas iniciales personalizadas. Se usará la devuelta por el panel.',
        actionTaken: 'stripped'
      });
      delete payload.password;
    }

    // Obligatorio: package
    if (!payload.package && !payload.packageId && !payload.provider_plan_id) {
      return {
        isValid: false,
        sanitizedPayload: payload,
        warnings,
        errorMessage: 'El ID de paquete (package) es obligatorio para crear una línea en el panel.'
      };
    }

    // Normalizar package
    const pkg = Number(payload.package || payload.packageId || payload.provider_plan_id);
    if (!isNaN(pkg) && pkg > 0) {
      payload.package = pkg;
    }

    // Trial
    payload.trial = targetAction === 'create_demo' || payload.trial === 1 || payload.trial === '1' ? 1 : 0;

    // Normalizar max_connections
    if (payload.max_connections !== undefined) {
      const conns = Number(payload.max_connections);
      if (isNaN(conns) || conns <= 1) {
        delete payload.max_connections;
      } else {
        payload.max_connections = conns;
      }
    }

  } else if (targetAction === 'extend_line') {
    // REGLA REVENDEDOR: extend_line en el panel físico solo acepta id y package
    if (!payload.id && !payload.id_linea && !payload.panel_client_id) {
      return {
        isValid: false,
        sanitizedPayload: payload,
        warnings,
        errorMessage: 'El ID de la línea a extender es obligatorio.'
      };
    }

    payload.id = Number(payload.id || payload.id_linea || payload.panel_client_id);

    if (!payload.package && !payload.packageId && !payload.provider_plan_id) {
      return {
        isValid: false,
        sanitizedPayload: payload,
        warnings,
        errorMessage: 'El ID del paquete para extender es obligatorio.'
      };
    }
    payload.package = Number(payload.package || payload.packageId || payload.provider_plan_id);

    // Si se envían pantallas o notas para cambiar junto con la extensión, se debe promover a edit_line
    const hasCustomScreens = payload.max_connections !== undefined && Number(payload.max_connections) > 1;
    const hasCustomNotes = payload.reseller_notes && String(payload.reseller_notes).trim() !== '';

    if (hasCustomScreens || hasCustomNotes) {
      warnings.push({
        field: 'action',
        code: 'extend_line_promoted_to_edit_line',
        message: 'extend_line no soporta asignación de pantallas o notas. Se promueve automáticamente a edit_line para aplicar las conexiones correctamente.',
        actionTaken: 'promoted'
      });
      payload.action = 'edit_line';
      if (hasCustomScreens) {
        payload.max_connections = Number(payload.max_connections);
      }
      if (hasCustomNotes) {
        payload.reseller_notes = String(payload.reseller_notes).trim();
      }
    } else {
      // Limpiar campos no reconocidos por extend_line puro
      delete payload.max_connections;
      delete payload.username;
      delete payload.password;
    }

  } else if (targetAction === 'edit_line') {
    if (!payload.id && !payload.id_linea && !payload.panel_client_id) {
      return {
        isValid: false,
        sanitizedPayload: payload,
        warnings,
        errorMessage: 'El ID de la línea a editar es obligatorio.'
      };
    }
    payload.id = Number(payload.id || payload.id_linea || payload.panel_client_id);

    if (payload.max_connections !== undefined) {
      const conns = Number(payload.max_connections);
      if (!isNaN(conns) && conns >= 1) {
        payload.max_connections = conns;
      }
    }

    if (payload.package !== undefined) {
      const pkg = Number(payload.package);
      if (!isNaN(pkg) && pkg > 0) {
        payload.package = pkg;
      }
    }

    // username suele ser inmutable en revendedores
    if (payload.username) {
      warnings.push({
        field: 'username',
        code: 'edit_username_immutable',
        message: 'El nombre de usuario suele ser inmutable para cuentas de revendedor.',
        actionTaken: 'warn_only'
      });
    }

  } else if (['get_line', 'disable_line', 'enable_line', 'delete_line'].includes(targetAction)) {
    if (!payload.id && !payload.id_linea && !payload.panel_client_id) {
      return {
        isValid: false,
        sanitizedPayload: payload,
        warnings,
        errorMessage: `El ID de la línea es obligatorio para la acción ${targetAction}.`
      };
    }
    payload.id = Number(payload.id || payload.id_linea || payload.panel_client_id);
  }

  return {
    isValid: true,
    sanitizedPayload: payload,
    warnings
  };
}
