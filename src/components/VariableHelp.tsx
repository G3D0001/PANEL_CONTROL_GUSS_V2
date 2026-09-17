import React, { useState } from 'react';
import { HelpCircle, Copy, Check, Globe, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Variable {
  id: string;
  label: string;
  template: string;
  desc: string;
  icon: any;
}

const VARIABLES: Variable[] = [
  { 
    id: 'link', 
    label: 'Botón con Link', 
    template: 'LINK:https://tu-link.com NOMBRE:Texto del Botón',
    desc: 'Crea un botón llamativo que abre un link en una pestaña nueva.',
    icon: Globe
  },
  { 
    id: 'action', 
    label: 'Botón de WhatsApp', 
    template: 'ACTION:whatsapp:5491122334455 NOMBRE:Contactar',
    desc: 'Crea un botón que abre un chat de WhatsApp con el número indicado.',
    icon: MousePointer2
  }
];

interface VariableHelpProps {
  onSelect: (template: string) => void;
}

export function VariableHelp({ onSelect }: VariableHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (template: string, id: string) => {
    onSelect(template);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-cyan-500"
        title="Ayuda con variables"
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[61] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <HelpCircle size={16} className="text-cyan-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Variables Inteligentes</h4>
            </div>

            <div className="space-y-3">
              {VARIABLES.map((v) => (
                <div key={v.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <v.icon size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{v.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(v.template, v.id)}
                      className="p-1 hover:bg-cyan-50 rounded-lg text-cyan-500 transition-colors"
                    >
                      {copiedId === v.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">{v.desc}</p>
                  <code className="block p-2 bg-slate-50 rounded-lg text-[9px] font-mono text-slate-500 break-all border border-slate-100">
                    {v.template}
                  </code>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-50">
              <p className="text-[8px] text-slate-400 italic">
                * Haz clic en el icono de copiar para insertar el código en el campo de texto.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
