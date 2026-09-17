import React, { useState } from 'react';
import { 
  Key, Tv, DollarSign, Database, Save, Play, CheckCircle2, AlertCircle, 
  Sparkles, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { validateResellerApiPayload } from '../../utils/resellerValidation';

interface ApisIntegrationsTabProps {
  config: any;
  onConfigSaved: () => Promise<void>;
}

export function ApisIntegrationsTab({ config, onConfigSaved }: ApisIntegrationsTabProps) {
  const [loading, setLoading] = useState(false);
  const [testingXc, setTestingXc] = useState(false);
  const [xcTestLog, setXcTestLog] = useState<string | null>(null);

  const apiSettings = config?.api_settings || {};
  const configDatos = config?.datos || config || {};

  // 1. Xtream-Masters Panel v2.0
  const initialUrl = apiSettings.xui_base_url || configDatos.xc_url_completa || configDatos.xui_url || 'http://1394.cooteg.cc:2095';
  const initialToken = apiSettings.xui_api_key || configDatos.xc_token || configDatos.xui_token || '';
  const [xuiBaseUrl, setXuiBaseUrl] = useState(initialUrl);
  const [xuiApiKey, setXuiApiKey] = useState(initialToken);
  const [xuiDefaultPackage, setXuiDefaultPackage] = useState(apiSettings.xui_default_package_id || 1);
  const [xtvPlaylistFullId, setXtvPlaylistFullId] = useState(apiSettings.xtv_playlist_full_id || '');
  const [xtvPlaylistLimitId, setXtvPlaylistLimitId] = useState(apiSettings.xtv_playlist_limit_id || '');
  const [xtvPlaylistActiveType, setXtvPlaylistActiveType] = useState(apiSettings.xtv_playlist_active_type || 'limit');

  // 2. Mercado Pago
  const [mpAccessToken, setMpAccessToken] = useState(apiSettings.mp_access_token || '');
  const [mpPublicKey, setMpPublicKey] = useState(apiSettings.mp_public_key || '');

  // 3. Cotizaciones Dólar (DolarApi)
  const [dolarEnabled, setDolarEnabled] = useState(apiSettings.dolar_api_enabled !== false);
  const [dolarSource, setDolarSource] = useState(apiSettings.dolar_source || 'ambito');
  const [dolarOverride, setDolarOverride] = useState(apiSettings.dolar_override || 0);

  // Probar Conexión con Xtream-Masters v2.0
  const handleTestXcApi = async () => {
    if (!xuiBaseUrl) {
      toast.error('Ingresa la URL del panel Xtream-Masters');
      return;
    }

    setTestingXc(true);
    setXcTestLog(null);
    try {
      const res = await fetch('/api/iptv/xui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          xuiUrl: xuiBaseUrl.trim(),
          xuiToken: xuiApiKey.trim(),
        }),
      });

      const data = await res.json();
      setXcTestLog(JSON.stringify(data, null, 2));

      if (data.success || data.status === 'STATUS_SUCCESS' || data.status === 'success') {
        const creds = data.credits ?? data.data?.data?.credits ?? data.data?.credits;
        toast.success(`¡Conexión exitosa con el panel Xtream-Masters! ${creds !== undefined ? `(${creds} créditos)` : ''}`);
      } else {
        toast.warning('El panel respondió pero reportó un estado no exitoso: ' + (data.error || data.message || 'Ver log'));
      }
    } catch (err: any) {
      console.error('Error al probar Xtream-Masters API:', err);
      setXcTestLog(`ERROR: ${err.message}`);
      toast.error('Fallo de conexión: ' + err.message);
    } finally {
      setTestingXc(false);
    }
  };

  // Guardar configuración de APIs
  const handleSaveApis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedApiSettings = {
        ...apiSettings,
        xui_base_url: xuiBaseUrl.trim(),
        xui_api_key: xuiApiKey.trim(),
        xui_default_package_id: Number(xuiDefaultPackage) || 1,
        xtv_playlist_full_id: xtvPlaylistFullId.trim(),
        xtv_playlist_limit_id: xtvPlaylistLimitId.trim(),
        xtv_playlist_active_type: xtvPlaylistActiveType,
        mp_access_token: mpAccessToken.trim(),
        mp_public_key: mpPublicKey.trim(),
        dolar_api_enabled: dolarEnabled,
        dolar_source: dolarSource,
        dolar_override: Number(dolarOverride) || 0,
      };

      const existingDatos = config?.datos || {};
      const updatedDatos = {
        ...existingDatos,
        xc_url_completa: xuiBaseUrl.trim(),
        xui_url: xuiBaseUrl.trim(),
        xc_token: xuiApiKey.trim(),
        xui_token: xuiApiKey.trim(),
      };

      const { error } = await supabase
        .from('configuracion_sistema')
        .update({ 
          api_settings: updatedApiSettings,
          datos: updatedDatos
        })
        .eq('id', 1);

      if (error) throw error;

      await onConfigSaved();
      toast.success('Configuraciones de APIs guardadas con éxito en Supabase');
    } catch (err: any) {
      console.error('Error al guardar APIs:', err);
      toast.error('Error al guardar: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveApis} className="space-y-6 max-w-4xl">
      {/* 1. XTREAM-MASTERS V2.0 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Panel Mayorista Xtream-Masters v2.0 (XTV)
              </h3>
              <p className="text-xs text-slate-400">
                Conecta las altas automáticas de demos, líneas VIP y renovaciones de créditos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestXcApi}
            disabled={testingXc}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-bold text-xs rounded-xl border border-purple-500/40 transition-all hover:scale-105 disabled:opacity-50"
          >
            {testingXc ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Probar Conexión al Panel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              URL Completa del Panel / Access Code
            </label>
            <input
              type="text"
              value={xuiBaseUrl}
              onChange={(e) => setXuiBaseUrl(e.target.value)}
              placeholder="http://xtv.ar:2095/pooqkDEG/reseller/index.php"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">API Key / Token (Opcional si viene en URL)</label>
            <input
              type="password"
              value={xuiApiKey}
              onChange={(e) => setXuiApiKey(e.target.value)}
              placeholder="Token de revendedor"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Paquete Predeterminado (ID)</label>
            <input
              type="number"
              value={xuiDefaultPackage}
              onChange={(e) => setXuiDefaultPackage(Number(e.target.value))}
              placeholder="1"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Control de Plantillas Custom ocultas */}
        <div className="border-t border-slate-800/50 pt-4 mt-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Control de Plantilla de Canales (Custom Pack)</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">ID Plantilla Completa (Todos los canales)</label>
              <input
                type="text"
                value={xtvPlaylistFullId}
                onChange={(e) => setXtvPlaylistFullId(e.target.value)}
                placeholder="Ej: 8"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">ID Plantilla Limitada (Canales Limitados)</label>
              <input
                type="text"
                value={xtvPlaylistLimitId}
                onChange={(e) => setXtvPlaylistLimitId(e.target.value)}
                placeholder="Ej: 12"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-none font-mono font-bold"
              />
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-4 h-[42px] px-3">
              <span className="text-xs font-bold text-slate-300">Plantilla Activa:</span>
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setXtvPlaylistActiveType('limit')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    xtvPlaylistActiveType === 'limit'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Limitada
                </button>
                <button
                  type="button"
                  onClick={() => setXtvPlaylistActiveType('full')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    xtvPlaylistActiveType === 'full'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completa
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            * El ID seleccionado se enviará automáticamente de forma oculta en el parámetro <strong>custom_playlist_id</strong> al crear líneas nuevas.
          </p>
        </div>

        {/* Consola de diagnóstico rápida */}
        {xcTestLog && (
          <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-purple-300/90 overflow-x-auto max-h-40">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Respuesta del Servidor XC:</p>
            <pre>{xcTestLog}</pre>
          </div>
        )}
      </div>

      {/* 2. COTIZACIONES DÓLAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cotizaciones Dólar (DolarApi)
            </h3>
            <p className="text-xs text-slate-400">
              Conversión automática de precios de insumos 3D y planes de revendedores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Fuente de Cotización</label>
            <select
              value={dolarSource}
              onChange={(e) => setDolarSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none font-bold"
            >
              <option value="ambito">Ámbito Financiero (Recomendado)</option>
              <option value="dolarhoy">Dólar Hoy</option>
              <option value="bluelytics">Bluelytics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Forzar Cotización Manual (0 = Automático)</label>
            <input
              type="number"
              value={dolarOverride}
              onChange={(e) => setDolarOverride(Number(e.target.value))}
              placeholder="0 (automático)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dolarEnabled}
                onChange={(e) => setDolarEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
              />
              <span className="text-xs font-bold text-slate-300">Actualización en Tiempo Real</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. MERCADO PAGO */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pasarela de Pagos (Mercado Pago)
            </h3>
            <p className="text-xs text-slate-400">
              Generación de links de cobro automático y código QR para clientes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Access Token de Mercado Pago</label>
            <input
              type="password"
              value={mpAccessToken}
              onChange={(e) => setMpAccessToken(e.target.value)}
              placeholder="APP_USR-..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Public Key</label>
            <input
              type="text"
              value={mpPublicKey}
              onChange={(e) => setMpPublicKey(e.target.value)}
              placeholder="APP_USR-..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Botón Guardar APIs */}
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
          Guardar Parámetros de APIs
        </button>
      </div>
    </form>
  );
}
