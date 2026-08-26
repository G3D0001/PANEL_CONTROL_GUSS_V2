---
name: permissions-security
description: Secure role-based and permission-based routing, component rendering, and action execution in fullstack React applications.
---
# Permissions Security & Access Control Skill

This skill documents and enforces the standard practices of node-based permission access control (PBAC) and role-based access control (RBAC) in modern React fullstack applications. It covers route-level protection, navigation trimming, view-level action validation, and preventative security measures to eliminate URL bypasses and manual state manipulation.

## Core Security Architectural Patterns

### 1. Robust Route-Level Guards (No Bypass Routing)
Never expose sensitive component routes without wrapping them in a route-level verification component.
In `App.tsx`, all routes representing private/guarded modules must be wrapped using the `<ProtectedRoute>` element:

```tsx
<Route path="/pedidos" element={<ProtectedRoute permission="Pedidos.VistaGeneral.Ver" element={<OrdersList />} />} />
```

### 2. Custom ProtectedRoute Wrapper Implementation
The `ProtectedRoute` wrapper must handle loading states, verify the permission node dynamically using the auth provider's state, and render a high-contrast, professional **"Acceso Restringido" (Restricted Access)** screen instead of silently redirecting. This maintains the application shell (e.g. sidebar navigation) while clearly showing the user what permission node they are lacking.

```tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  element: React.ReactElement;
  permission: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, permission }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-sm">
          <div className="size-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">shield_lock</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 dark:text-white uppercase text-base tracking-tight">Acceso Restringido</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tu rol de usuario actual no tiene asignado el permiso necesario para acceder a esta sección.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-1">Permiso Requerido:</span>
            <code className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg block overflow-x-auto select-all">
              {permission}
            </code>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    );
  }

  return element;
};
```

### 3. Navigation and Sidebar Trimming
Navigation menus must dynamically filter paths based on matching permission nodes. Do not hardcode specific URLs to skip permission checks unless they are intended to be completely open (e.g. the home dashboard or general landing page).

```tsx
const visibleNavItems = navItems.filter(item => {
  if (item.to === "/") return true; // Open home route
  return hasPermission(item.permission);
});
```

### 4. Component-Level Action Guarding
Within a page, button execution and UI forms must be wrapped in matching `hasPermission(node, 'interactuar')` checks to prevent unauthorized state manipulation:

```tsx
{hasPermission('Iptv.Clientes.Ver', 'interactuar') ? (
  <button onClick={handleSave}>Guardar Cambios</button>
) : (
  <p className="text-xs text-slate-400">Modo lectura activo. No posees permisos para editar.</p>
)}
```

### 5. Preventing Bypass Bugs (URL Hacking)
A secure client-side app assumes that a malicious user can manually change local storage, simulate roles, or alter UI rendering states. Therefore, the app must:
1. Verify role allocations against database configurations on startup.
2. Filter lists at the context level or service layer.
3. Validate user tokens and roles on the backend or Supabase security rules (RLS) to enforce data boundaries.
