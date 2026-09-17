import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, LogOut, AlertOctagon } from 'lucide-react';

export function PantallaInvitacion() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] size-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-8 relative z-10">
        <div className="flex justify-center">
          <div className="size-24 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 shadow-md border border-rose-100 dark:border-rose-800/50 relative">
            <Lock size={48} className="" />
            <div className="absolute -top-2 -right-2 size-8 bg-rose-600 rounded-xl flex items-center justify-center text-white border-4 border-white dark:border-slate-900">
              <AlertOctagon size={16} />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
            ACCESO <br/><span className="text-primary">PENDIENTE</span>
          </h1>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identidad en Revisión</p>
            <div className="flex items-center justify-center gap-2 text-slate-900 dark:text-white">
              <Mail size={14} className="text-primary" />
              <span className="text-xs font-bold truncate max-w-[200px]">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-4">
            Tu registro se ha completado con éxito, pero tu cuenta debe ser <span className="font-bold text-slate-900 dark:text-white">APROBADA</span> por un administrador para poder entrar.
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">¿Qué sigue?</p>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1">El administrador ya recibió tu solicitud. Recibirás acceso una vez que verifiquen tu perfil.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800  transition-colors duration-150 shadow-md shadow-slate-900/20"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
