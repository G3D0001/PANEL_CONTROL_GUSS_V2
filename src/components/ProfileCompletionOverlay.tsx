import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  MapPin, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';

export function ProfileCompletionOverlay() {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setNombre(userProfile.nombre || '');
      setTelefono(userProfile.telefono_contacto || '');
      setDireccion(userProfile.direccion_hogar || '');
      setReferencia(userProfile.referencia_personal || '');
      setAvatarUrl(userProfile.avatar_url || userProfile.foto_perfil || '');
    }
  }, [userProfile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 3MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'perfil'}_${Date.now()}.${fileExt}`;
      const filePath = `perfiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Foto de perfil subida correctamente');
    } catch (err: any) {
      console.error('Error al subir foto:', err);
      toast.error(`Error al subir imagen: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    if (!telefono.trim()) {
      toast.error('El teléfono de contacto es obligatorio');
      return;
    }
    if (!direccion.trim()) {
      toast.error('La dirección particular es obligatoria');
      return;
    }
    if (!avatarUrl) {
      toast.error('La foto de perfil es obligatoria para verificar tu identidad');
      return;
    }

    const needsPasswordChange = userProfile?.password_hash === '123456';
    let finalPassword = userProfile?.password_hash;

    if (needsPasswordChange) {
      if (!newPassword) {
        toast.error('Debes definir tu nueva contraseña de seguridad');
        return;
      }
      if (newPassword === '123456') {
        toast.error('La nueva contraseña no puede ser la clave por defecto "123456"');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      finalPassword = newPassword;
    }

    setIsSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        telefono_contacto: telefono.trim(),
        direccion_hogar: direccion.trim(),
        referencia_personal: referencia.trim(),
        avatar_url: avatarUrl,
        foto_perfil: avatarUrl,
        password_hash: finalPassword
      };

      const { error } = await supabase
        .from('perfiles_locales')
        .update(payload)
        .eq('id', userProfile.id);

      if (error) throw error;

      toast.success('¡Perfil completado con éxito!');
      await refreshProfile();
    } catch (err: any) {
      console.error('Error al guardar perfil:', err);
      toast.error(`Fallo al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isDefaultPassword = userProfile?.password_hash === '123456';

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[99999] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-10 space-y-8 my-8">
        
        {/* Header decorativo */}
        <div className="text-center space-y-3">
          <div className="inline-flex size-14 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500 rounded-2xl items-center justify-center animate-pulse">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
            Completar tus Datos de Acceso
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Para garantizar la seguridad y logística de la plataforma, debes registrar tus datos reales y modificar tu contraseña temporal antes de poder continuar.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-5">
            
            {/* Foto de Perfil */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-5">
              <div className="size-20 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Vista previa de perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="text-slate-400 size-10" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">FOTO DE PERFIL (OBLIGATORIA)</span>
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 mx-auto sm:mx-0 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                </button>
                <p className="text-[10px] text-slate-400 font-medium">Usa una foto clara donde se distinga tu rostro.</p>
              </div>
            </div>

            {/* Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Pablo Nicolás"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="tel" required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +5493834123456"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Dirección de Domicilio (Hogar)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Calle San Martín 123, Catamarca"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Referencias de Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej: Portón de madera frente a la escuela"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Bloque cambio de contraseña (solo si tiene la contraseña por defecto 123456) */}
            {isDefaultPassword && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Cambio Obligatorio de Contraseña</span>
                </div>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                  Actualmente usas la contraseña temporal de fábrica. Por favor, define una nueva contraseña robusta para proteger tu cuenta de accesos no autorizados.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block ml-1">Nueva Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                      <input 
                        type={showPass ? "text" : "password"} required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Define tu nueva clave"
                        className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-400/20 dark:text-white font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block ml-1">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                      <input 
                        type={showConfirmPass ? "text" : "password"} required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu clave"
                        className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-400/20 dark:text-white font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => signOut()}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 order-2 sm:order-1"
            >
              Cerrar Sesión
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 px-6 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Guardando datos...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Guardar Perfil y Entrar al Sistema
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
