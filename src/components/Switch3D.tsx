import React from 'react';
import { motion } from 'motion/react';

interface Switch3DProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch3D: React.FC<Switch3DProps> = ({ checked, onChange, disabled = false }) => {
  const toggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div 
      onClick={toggle}
      className={`relative w-[68px] h-[34px] rounded-full p-[3px] cursor-pointer select-none transition-colors duration-300 flex items-center ${
        checked 
          ? 'bg-[#8338ec] shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]' 
          : 'bg-[#e2e5f0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] dark:bg-[#2d3244]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      id="switch-3d-container"
    >
      {/* Icono OFF (Línea Vertical "|" de encendido/apagado tipo UI clásica de lujo) */}
      <div 
        className={`absolute left-4.5 text-[11px] font-black text-white pointer-events-none transition-opacity duration-300 ${
          checked ? 'opacity-0' : 'opacity-80'
        }`}
        style={{ fontFamily: 'monospace' }}
      >
        |
      </div>

      {/* Icono ON (Círculo "O" calado fino y refinado en el lado derecho) */}
      <div 
        className={`absolute right-4.5 size-2.5 rounded-full border-2 border-white pointer-events-none transition-opacity duration-300 ${
          checked ? 'opacity-80' : 'opacity-0'
        }`}
      />

      {/* Botón deslizador circular táctil (Thumb) */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 32
        }}
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f3f9 100%)',
          boxShadow: '0 3px 6px rgba(0,0,0,0.32), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 2px rgba(0,0,0,0.12)'
        }}
        className={`size-7 rounded-full ${checked ? 'ml-auto' : ''}`}
      />
    </div>
  );
};
