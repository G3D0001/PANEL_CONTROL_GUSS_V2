import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, Network, ArrowRight, ShieldCheck, HelpCircle, Package, Truck, UserCheck, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Workflow {
  id: string;
  name: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: 'delivery_type' | 'channel_type' | 'modalidad_type';
  trigger_value: string;
  flujo_destino_id: string;
  activo: boolean;
  descripcion: string;
}

export function WorkflowRulesView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para simulador local
  const [simProductModalidad, setSimProductModalidad] = useState<'inmediata' | 'produccion'>('produccion');
  const [simChannel, setSimChannel] = useState<'tienda' | 'revendedor'>('tienda');
  const [simDelivery, setSimDelivery] = useState<'retiro' | 'propio' | 'uber_moto' | 'uber_auto'>('propio');
  const [simSelectedProductId, setSimSelectedProductId] = useState('');
  const [productsList, setProductsList] = useState<any[]>([]);

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Obtener flujos reales de la Base de Datos
      const { data: dbWorkflows } = await supabase.from('flujos').select('id, name');
      const activeWorkflows = dbWorkflows || [];
      setWorkflows(activeWorkflows);

      // 2. Obtener productos para simulación
      const { data: dbProducts } = await supabase.from('g3d_productos').select('id, nombre, modalidad');
      setProductsList(dbProducts || []);

      // 3. Inicializar reglas de automatización predeterminadas (almacenadas en localStorage para pruebas sin alterar Base de Datos)
      const cachedRules = localStorage.getItem('g3d_workflow_automation_rules');
      if (cachedRules) {
        setRules(JSON.parse(cachedRules));
      } else {
        // Reglas iniciales sugeridas por el usuario
        const defaultRules: AutomationRule[] = [
          {
            id: 'rule-1',
            name: 'Regla de Envío a Domicilio',
            trigger_type: 'delivery_type',
            trigger_value: 'propio', // Envío con Fletero Propio / Uber
            flujo_destino_id: activeWorkflows[0]?.id || '',
            activo: true,
            descripcion: 'Trigerea el flujo de reparto programado si la entrega es a domicilio.'
          },
          {
            id: 'rule-2',
            name: 'Coordinación con Revendedor Mayorista',
            trigger_type: 'channel_type',
            trigger_value: 'revendedor',
            flujo_destino_id: activeWorkflows[1]?.id || activeWorkflows[0]?.id || '',
            activo: true,
            descripcion: 'Advierte al revendedor, oculta notas de taller privadas y habilita el coordinado de entrega con datos del cliente.'
          },
          {
            id: 'rule-3',
            name: 'Pauta Express para Cadetería / Uber',
            trigger_type: 'delivery_type',
            trigger_value: 'uber_moto',
            flujo_destino_id: activeWorkflows[0]?.id || '',
            activo: false,
            descripcion: 'Asigna el flujo de Moto/Auto Uber para consolidación ultra rápida en el día.'
          }
        ];
        setRules(defaultRules);
        localStorage.setItem('g3d_workflow_automation_rules', JSON.stringify(defaultRules));
      }
    } catch (err) {
      console.error('Error fetching data for Workflow Automation', err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar y togglear regla
  const toggleRule = (id: string) => {
    const updated = rules.map(r => {
      if (r.id === id) {
        return { ...r, activo: !r.activo };
      }
      return r;
    });
    setRules(updated);
    localStorage.setItem('g3d_workflow_automation_rules', JSON.stringify(updated));
    toast.success('Regla de flujo actualizada');
  };

  const handleUpdateRuleDest = (id: string, workflowId: string) => {
    const updated = rules.map(r => {
      if (r.id === id) {
        return { ...r, flujo_destino_id: workflowId };
      }
      return r;
    });
    setRules(updated);
    localStorage.setItem('g3d_workflow_automation_rules', JSON.stringify(updated));
    toast.success('Flujo de destino reasignado con éxito');
  };

  // Motor de predicción de flujo en tiempo real
  const evaluateWorkflow = () => {
    // 1. Verificar si hay un producto seleccionado con flujo manual predefinido
    const localProductExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
    let assignedWorkflowId = '';
    let originStr = '';

    if (simSelectedProductId) {
      const extra = localProductExtras[simSelectedProductId];
      if (extra && extra.assigned_workflow_id) {
        assignedWorkflowId = extra.assigned_workflow_id;
        originStr = 'Asignación Manual del Ítem (La regla individual tiene prioridad)';
      }
    }

    // 2. Evaluar reglas condicionales automáticas de la tienda (si no hay asignado manual prioritario)
    if (!assignedWorkflowId) {
      // Regla de Revendedor
      const revendedorRule = rules.find(r => r.activo && r.trigger_type === 'channel_type' && r.trigger_value === simChannel);
      if (revendedorRule) {
        assignedWorkflowId = revendedorRule.flujo_destino_id;
        originStr = `Automatización de Canal: "${revendedorRule.name}"`;
      }
    }

    if (!assignedWorkflowId) {
      // Regla de Entrega a Domicilio
      const deliveryRule = rules.find(r => r.activo && r.trigger_type === 'delivery_type' && r.trigger_value === simDelivery);
      if (deliveryRule) {
        assignedWorkflowId = deliveryRule.flujo_destino_id;
        originStr = `Automatización de Envío: "${deliveryRule.name}"`;
      }
    }

    // 3. Obtener Workflow e información de estados
    const matchedWorkflow = workflows.find(w => w.id === assignedWorkflowId);

    return {
      workflow: matchedWorkflow || null,
      origen: originStr || 'Flujo de Venta general / Sin Automatización Activa'
    };
  };

  const activeSimulation = evaluateWorkflow();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={18} />
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Motor de Enrutamiento Automático de Ventas
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
          Configura reglas lógicas para que el sistema asigne flujos de producción de manera automático cuando ingresen pedidos desde la tienda web, dependiendo de si es bajo pedido, para revendedores, o si se elige flete a domicilio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REGLAS LOGICAS */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Reglas Activas de la Tienda</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-bold">
              Simulación de Motor
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 font-bold italic py-4">Cargando reglas del sistema...</p>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div 
                  key={rule.id} 
                  className={`p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    rule.activo 
                      ? 'bg-indigo-50/20 border-indigo-200/55 dark:bg-indigo-950/10 dark:border-indigo-900/40' 
                      : 'bg-slate-50 dark:bg-slate-950/35 border-slate-100 dark:border-slate-850'
                  }`}
                >
                  <div className="space-y-1 sm:max-w-[70%] text-left">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${rule.activo ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                      <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none uppercase tracking-wide">
                        {rule.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-normal">
                      {rule.descripcion}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                      {rule.trigger_type === 'delivery_type' && <Truck size={12} />}
                      {rule.trigger_type === 'channel_type' && <UserCheck size={12} />}
                      Condición: Al detectar {rule.trigger_type === 'delivery_type' ? `Logística de Envío (${rule.trigger_value})` : `Canal Mayorista (${rule.trigger_value})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Selector de Flujo Destino */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold text-left">Flujo de Destino:</span>
                      <select
                        disabled={!rule.activo}
                        value={rule.flujo_destino_id}
                        onChange={e => handleUpdateRuleDest(rule.id, e.target.value)}
                        className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black uppercase text-slate-700 dark:text-slate-350 focus:outline-none"
                      >
                        <option value="">-- Sin asignar --</option>
                        {workflows.map(wf => (
                          <option key={wf.id} value={wf.id}>{wf.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Botón Activo */}
                    <button 
                      onClick={() => toggleRule(rule.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors pt-3"
                    >
                      {rule.activo ? (
                        <ToggleRight size={28} className="text-indigo-600" />
                      ) : (
                        <ToggleLeft size={28} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROBADOR / SIMULADOR EN TIEMPO REAL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Playground / Simulador de Venta</span>
            <Play className="text-emerald-500 animate-pulse" size={14} />
          </div>

          <div className="space-y-4 text-left leading-none">
            {/* Producto */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 block">1. Elegir Producto del Stock</span>
              <select
                value={simSelectedProductId}
                onChange={e => {
                  setSimSelectedProductId(e.target.value);
                  const pMatched = productsList.find(p => p.id === e.target.value);
                  if (pMatched) {
                    setSimProductModalidad(pMatched.modalidad);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="">-- Simular Producto Genérico --</option>
                {productsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.modalidad === 'produccion' ? 'Bajo Pedido' : 'Immediato'})
                  </option>
                ))}
              </select>
            </div>

            {/* Canal */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 block">2. Canal Originador</span>
              <select
                value={simChannel}
                onChange={e => setSimChannel(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="tienda">Tienda Pública (Cliente Directo)</option>
                <option value="revendedor">Revendedor (Mayorista)</option>
              </select>
            </div>

            {/* Envió */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 block">3. Preferencia de Logística</span>
              <select
                value={simDelivery}
                onChange={e => setSimDelivery(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="retiro">Retiro en Taller / Local</option>
                <option value="propio">Flejero Propio ya programado</option>
                <option value="uber_moto">Cadetería de Moto Express</option>
                <option value="uber_auto">Flete Grande (Auto)</option>
              </select>
            </div>

            {/* RESULTADO PREDICTIVO */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider block">⚡ Resultado del Motor en Tiempo Real</span>
              
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">Flujo de Trabajo Estimado:</span>
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Network size={14} className="text-indigo-500" />
                  {activeSimulation.workflow ? activeSimulation.workflow.name : 'Venta General / Sin Flujo Específico'}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold block">Origen del Desencadenador:</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold italic">
                  {activeSimulation.origen}
                </span>
              </div>

              {activeSimulation.workflow && (
                <div className="pt-2 border-t dark:border-slate-800 space-y-1">
                  <span className="text-[9.5px] text-slate-400 font-black block uppercase">Pasos del Pedido:</span>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      ORDEN
                    </span>
                    <ArrowRight size={10} className="text-slate-400 shrink-0" />
                    <span className="text-[9px] font-extrabold text-indigo-500">Fabricante</span>
                    <ArrowRight size={10} className="text-slate-400 shrink-0" />
                    <span className="text-[9px] font-extrabold text-teal-500">Logística</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
