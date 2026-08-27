import React, { useState, useRef } from 'react';
import { Building2, Tv, Globe, Camera, Trash2, Save, Sparkles, Receipt, Phone, Mail, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { compressAndProcessImage } from '../../utils/imageCompressor';

interface BusinessIdentitiesTabProps {
  config: any;
  onConfigSaved: () => Promise<void>;
}

export function BusinessIdentitiesTab({ config, onConfigSaved }: BusinessIdentitiesTabProps) {
  const [activeSubSection, setActiveSubSection] = useState<'app' | 'g3d' | 'xtv'>('g3d');
  const [loading, setLoading] = useState(false);

  // Inputs para logos locales (Regla 21)
  const appLogoRef = useRef<HTMLInputElement>(null);
  const g3dLogoRef = useRef<HTMLInputElement>(null);
  const xtvLogoRef = useRef<HTMLInputElement>(null);

  // 1. Identidad Global de la App Web
  const [appName, setAppName] = useState(config?.nombre_tienda || 'G3D & XTV Panel Operativo');
  const [appLogo, setAppLogo] = useState(config?.logo_url || '');

  // 2. Identidad Negocio G3D (Cartelería, Impresión 3D, Láser, Comercios)
  const g3dData = config?.business_profiles?.g3d || {};
  const [g3dRazonSocial, setG3dRazonSocial] = useState(g3dData.business_name || config?.nombre_negocio || 'G3D CARTELERIA & IMPRESIONES');
  const [g3dCuit, setG3dCuit] = useState(g3dData.cuit_tax_id || config?.cuit || '');
  const [g3dCondicionIva, setG3dCondicionIva] = useState(g3dData.tax_condition || config?.condicion_iva || 'Responsable Inscripto');
  const [g3dDireccion, setG3dDireccion] = useState(g3dData.address || config?.direccion || '');
  const [g3dWhatsapp, setG3dWhatsapp] = useState(g3dData.whatsapp || config?.whatsapp || '');
  const [g3dEmail, setG3dEmail] = useState(g3dData.email || config?.email || '');
  const [g3dLogo, setG3dLogo] = useState(g3dData.logo_url || '');
  const [g3dRemitoHeader, setG3dRemitoHeader] = useState(g3dData.receipt_header || 'G3D - Impresiones 3D & Grabados Láser');
  const [g3dRemitoFooter, setG3dRemitoFooter] = useState(g3dData.receipt_footer || '¡Gracias por confiar en G3D!');
  const [g3dAlias, setG3dAlias] = useState(g3dData.payment_alias || '');
  const [g3dCbu, setG3dCbu] = useState(g3dData.payment_cbu || '');
  const [g3dBank, setG3dBank] = useState(g3dData.payment_bank || '');

  // 3. Identidad Negocio XTV (Revendedores IPTV, Créditos Xtream-Masters)
  const xtvData = config?.business_profiles?.xtv || {};
  const [xtvBrandName, setXtvBrandName] = useState(xtvData.brand_name || 'XTV DIGITAL');
  const [xtvWhatsapp, setXtvWhatsapp] = useState(xtvData.support_whatsapp || '');
  const [xtvEmail, setXtvEmail] = useState(xtvData.support_email || '');
  const [xtvTelegram, setXtvTelegram] = useState(xtvData.telegram_channel || '');
  const [xtvDomain, setXtvDomain] = useState(xtvData.official_domain || 'xtv.ar');
  const [xtvLogo, setXtvLogo] = useState(xtvData.logo_url || '');
  const [xtvNoticeHeader, setXtvNoticeHeader] = useState(xtvData.activation_notice_header || '🔥 ¡Tu suscripción a XTV ya está activa!');
  const [xtvNoticeFooter, setXtvNoticeFooter] = useState(xtvData.activation_notice_footer || 'Soporte 24/7 disponible.');
  const [xtvAlias, setXtvAlias] = useState(xtvData.payment_alias || '');
  const [xtvCbu, setXtvCbu] = useState(xtvData.payment_cbu || '');
  const [xtvBank, setXtvBank] = useState(xtvData.payment_bank || '');

  // Manejo de carga y compresión de logos locales
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Procesando logo...');
      const base64 = await compressAndProcessImage(file, 600, 600, 0.9);
      setter(base64);
      toast.dismiss();
      toast.success('Logo cargado correctamente');
    } catch (err: any) {
      toast.dismiss();
      toast.error('Error al procesar logo: ' + err.message);
    }
  };

  const handleSaveAllIdentities = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nombre_tienda: appName.trim(),
        logo_url: appLogo,
        nombre_negocio: g3dRazonSocial.trim(),
        cuit: g3dCuit.trim(),
        condicion_iva: g3dCondicionIva,
        direccion: g3dDireccion.trim(),
        whatsapp: g3dWhatsapp.trim(),
        email: g3dEmail.trim(),
        business_profiles: {
          g3d: {
            business_name: g3dRazonSocial.trim(),
            cuit_tax_id: g3dCuit.trim(),
            tax_condition: g3dCondicionIva,
            address: g3dDireccion.trim(),
            whatsapp: g3dWhatsapp.trim(),
            email: g3dEmail.trim(),
            logo_url: g3dLogo,
            receipt_header: g3dRemitoHeader.trim(),
            receipt_footer: g3dRemitoFooter.trim(),
            payment_alias: g3dAlias.trim(),
            payment_cbu: g3dCbu.trim(),
            payment_bank: g3dBank.trim(),
          },
          xtv: {
            brand_name: xtvBrandName.trim(),
            support_whatsapp: xtvWhatsapp.trim(),
            support_email: xtvEmail.trim(),
            telegram_channel: xtvTelegram.trim(),
            official_domain: xtvDomain.trim(),
            logo_url: xtvLogo,
            activation_notice_header: xtvNoticeHeader.trim(),
            activation_notice_footer: xtvNoticeFooter.trim(),
            payment_alias: xtvAlias.trim(),
            payment_cbu: xtvCbu.trim(),
            payment_bank: xtvBank.trim(),
          },
        },
      };

      const { error } = await supabase
        .from('configuracion_sistema')
        .update(payload)
        .eq('id', 1);

      if (error) throw error;

      await onConfigSaved();
      toast.success('Todas las identidades y logos se guardaron con éxito en Supabase');
    } catch (err: any) {
      console.error('Error al guardar identidades:', err);
      toast.error('Error al guardar: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveAllIdentities} className="space-y-6 max-w-4xl">
      {/* Selector de Subsecciones de Negocio */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubSection('g3d')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubSection === 'g3d'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-300" /> Negocio G3D (Comercios/Taller)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('xtv')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubSection === 'xtv'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Tv className="w-4 h-4 text-purple-300" /> Negocio XTV (Revendedores IPTV)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('app')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubSection === 'app'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400" /> Identidad App Web
        </button>
      </div>

      {/* SUB-SECCIÓN 1: NEGOCIO G3D */}
      {activeSubSection === 'g3d' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Logo G3D */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 flex items-center justify-center overflow-hidden shadow-xl p-2">
                {g3dLogo ? (
                  <img src={g3dLogo} alt="Logo G3D" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-600" />
                )}
              </div>
              <button
                type="button"
                onClick={() => g3dLogoRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg border border-indigo-400/40 transition-all hover:scale-105"
                title="Cargar logo de G3D"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={g3dLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e, setG3dLogo)}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-white tracking-tight">Logo Comercial de G3D</h3>
              <p className="text-xs text-slate-400 mt-1">
                Este logo se imprime automáticamente en los remitos, tickets de fabricación y presupuestos de cartelería e impresión 3D para comercios.
              </p>
              {g3dLogo && (
                <button
                  type="button"
                  onClick={() => setG3dLogo('')}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 mt-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar logo
                </button>
              )}
            </div>
          </div>

          {/* Datos Fiscales y Comerciales G3D */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> Datos Comerciales y Fiscales G3D
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  value={g3dRazonSocial}
                  onChange={(e) => setG3dRazonSocial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">CUIT / DNI</label>
                <input
                  type="text"
                  value={g3dCuit}
                  onChange={(e) => setG3dCuit(e.target.value)}
                  placeholder="20-12345678-9"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Condición IVA</label>
                <select
                  value={g3dCondicionIva}
                  onChange={(e) => setG3dCondicionIva(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">WhatsApp de Ventas G3D</label>
                <input
                  type="text"
                  value={g3dWhatsapp}
                  onChange={(e) => setG3dWhatsapp(e.target.value)}
                  placeholder="5492641234567"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Dirección de Taller / Local</label>
                <input
                  type="text"
                  value={g3dDireccion}
                  onChange={(e) => setG3dDireccion(e.target.value)}
                  placeholder="Calle, Número, Ciudad, Provincia"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Datos Bancarios y Remito G3D */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" /> Cobros de Pedidos Físicos G3D
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Alias Bancario G3D</label>
                <input
                  type="text"
                  value={g3dAlias}
                  onChange={(e) => setG3dAlias(e.target.value)}
                  placeholder="g3d.impresiones.mp"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">CBU / CVU G3D</label>
                <input
                  type="text"
                  value={g3dCbu}
                  onChange={(e) => setG3dCbu(e.target.value)}
                  placeholder="22 dígitos"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Banco / Billetera</label>
                <input
                  type="text"
                  value={g3dBank}
                  onChange={(e) => setG3dBank(e.target.value)}
                  placeholder="Mercado Pago / Banco"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECCIÓN 2: NEGOCIO XTV */}
      {activeSubSection === 'xtv' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Logo XTV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-purple-500/40 flex items-center justify-center overflow-hidden shadow-xl p-2">
                {xtvLogo ? (
                  <img src={xtvLogo} alt="Logo XTV" className="w-full h-full object-contain" />
                ) : (
                  <Tv className="w-12 h-12 text-slate-600" />
                )}
              </div>
              <button
                type="button"
                onClick={() => xtvLogoRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg border border-purple-400/40 transition-all hover:scale-105"
                title="Cargar logo de XTV"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={xtvLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e, setXtvLogo)}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-white tracking-tight">Logo Oficial de XTV (IPTV)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Este logo se incluye en los mensajes de WhatsApp para clientes finales y en los comprobantes de activación de líneas.
              </p>
              {xtvLogo && (
                <button
                  type="button"
                  onClick={() => setXtvLogo('')}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 mt-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar logo
                </button>
              )}
            </div>
          </div>

          {/* Parámetros Comerciales XTV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" /> Canales de Atención y Marca XTV
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre de la Marca</label>
                <input
                  type="text"
                  value={xtvBrandName}
                  onChange={(e) => setXtvBrandName(e.target.value)}
                  placeholder="XTV DIGITAL"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">WhatsApp de Soporte a Clientes</label>
                <input
                  type="text"
                  value={xtvWhatsapp}
                  onChange={(e) => setXtvWhatsapp(e.target.value)}
                  placeholder="5492641234567"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Canal de Telegram Oficial</label>
                <input
                  type="text"
                  value={xtvTelegram}
                  onChange={(e) => setXtvTelegram(e.target.value)}
                  placeholder="@xtv_oficial"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Dominio DNS Oficial</label>
                <input
                  type="text"
                  value={xtvDomain}
                  onChange={(e) => setXtvDomain(e.target.value)}
                  placeholder="xtv.ar:2095"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cobros de Créditos XTV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" /> Cobro de Créditos / Activaciones XTV
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Alias para Cobrar XTV</label>
                <input
                  type="text"
                  value={xtvAlias}
                  onChange={(e) => setXtvAlias(e.target.value)}
                  placeholder="xtv.pagos.mp"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">CBU / CVU XTV</label>
                <input
                  type="text"
                  value={xtvCbu}
                  onChange={(e) => setXtvCbu(e.target.value)}
                  placeholder="22 dígitos"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Banco / Billetera</label>
                <input
                  type="text"
                  value={xtvBank}
                  onChange={(e) => setXtvBank(e.target.value)}
                  placeholder="Mercado Pago / Ualá"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECCIÓN 3: IDENTIDAD APP WEB GLOBAL */}
      {activeSubSection === 'app' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 flex items-center justify-center overflow-hidden shadow-xl p-2">
                {appLogo ? (
                  <img src={appLogo} alt="Logo App" className="w-full h-full object-contain" />
                ) : (
                  <Globe className="w-12 h-12 text-slate-600" />
                )}
              </div>
              <button
                type="button"
                onClick={() => appLogoRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg border border-cyan-400/40 transition-all hover:scale-105"
                title="Cargar logo principal de la app"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={appLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e, setAppLogo)}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-white tracking-tight">Logo Global del Sistema</h3>
              <p className="text-xs text-slate-400 mt-1">
                Aparece en la barra lateral superior de la aplicación y en el acceso de inicio de sesión.
              </p>
              {appLogo && (
                <button
                  type="button"
                  onClick={() => setAppLogo('')}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 mt-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar logo
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Título y Encabezado del Sistema
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre de la Aplicación</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="G3D & XTV Panel Operativo"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Botón Guardar Identidades */}
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
          Guardar Identidades de Negocios
        </button>
      </div>
    </form>
  );
}
