import React, { useState, useRef } from 'react';
import { User, Phone, Lock, Save, Camera, Trash2, CheckCircle2, Shield, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { compressAndProcessImage } from '../../utils/imageCompressor';

interface ProfileSettingsTabProps {
  user: any;
  profile: any;
  onProfileUpdated: () => Promise<void>;
}

export function ProfileSettingsTab({ user, profile, onProfileUpdated }: ProfileSettingsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Datos personales
  const [nombre, setNombre] = useState(profile?.nombre || user?.nombre || '');
  const [telefono, setTelefono] = useState(profile?.telefono || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Datos bancarios personales
  const datosBancarios = profile?.negocio_datos_bancarios || {};
  const [alias, setAlias] = useState(datosBancarios.alias || '');
  const [cbu, setCbu] = useState(datosBancarios.cbu || '');
  const [banco, setBanco] = useState(datosBancarios.banco || '');
  const [titular, setTitular] = useState(datosBancarios.titular || '');

  // Contraseña
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');

  // Manejador de subida de imagen local (Regla 21)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Procesando fotografía...');
      const base64 = await compressAndProcessImage(file, 400, 400, 0.85);
      setAvatarUrl(base64);
      toast.dismiss();
      toast.success('Foto cargada correctamente');
    } catch (err: any) {
      toast.dismiss();
      toast.error('Error al procesar la imagen: ' + err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('No se detectó un usuario autenticado');
      return;
    }

    if (passwordNueva) {
      if (passwordNueva.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (passwordNueva !== passwordConfirmar) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    try {
      const updatePayload: any = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        avatar_url: avatarUrl,
        negocio_datos_bancarios: {
          alias: alias.trim(),
          cbu: cbu.trim(),
          banco: banco.trim(),
          titular: titular.trim(),
        },
      };

      if (passwordNueva) {
        updatePayload.password_hash = passwordNueva.trim();
      }

      const { error } = await supabase
        .from('perfiles_locales')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) throw error;

      // Actualizar localStorage si corresponde
      const cached = localStorage.getItem('g3d_auth_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.nombre = nombre.trim();
        parsed.avatar_url = avatarUrl;
        localStorage.setItem('g3d_auth_user', JSON.stringify(parsed));
      }

      await onProfileUpdated();
      setPasswordNueva('');
      setPasswordConfirmar('');
      toast.success('Tu perfil personal se guardó correctamente');
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      toast.error('Error al guardar: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 max-w-4xl">
      {/* Encabezado con Avatar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar con botón de carga interactivo */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg border border-indigo-400/40 transition-all hover:scale-105"
              title="Cargar foto desde tu dispositivo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{nombre || 'Mi Perfil'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                {profile?.rol || 'Usuario'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Usuario del sistema: <span className="text-slate-300 font-mono font-medium">{user?.email || 'N/A'}</span>
            </p>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 mt-2 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Datos Personales y de Contacto */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" /> Datos de Identidad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre y Apellido</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gustavo Castillo"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Teléfono / WhatsApp Particular</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 2641234567"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Datos de Cobro Personales (Alias / CBU para Comisiones y Pagos) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-400" /> Mis Datos de Cobro / Bancarios
        </h3>
        <p className="text-xs text-slate-400">
          Estos datos se utilizan para transferirte tus liquidaciones de comisiones o para que los clientes te transfieran a tu cuenta personal si eres vendedor directo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: guss.castillo.mp"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">CBU / CVU</label>
            <input
              type="text"
              value={cbu}
              onChange={(e) => setCbu(e.target.value)}
              placeholder="22 dígitos"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Banco / Billetera Virtual</label>
            <input
              type="text"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Ej: Mercado Pago / Banco San Juan"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Titular de la Cuenta</label>
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Nombre del titular"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Cambio de Contraseña */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" /> Seguridad de Acceso
        </h3>
        <p className="text-xs text-slate-400">
          Deja estos campos en blanco si no deseas modificar tu clave actual.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nueva Contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Cambios de Mi Perfil
        </button>
      </div>
    </form>
  );
}
