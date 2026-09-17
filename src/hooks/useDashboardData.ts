import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";

export interface UseDashboardDataOptions {
  user?: any;
  userRole?: string | null;
  simulatedRole?: string | null;
  isAdmin?: boolean;
  isSocioOrAdmin?: boolean;
}

export function useDashboardData(options?: UseDashboardDataOptions) {
  const auth = useAuth();
  const user = options?.user !== undefined ? options.user : auth.user;
  const simulatedRole = options?.simulatedRole !== undefined ? options.simulatedRole : auth.simulatedRole;
  const userRole = options?.userRole !== undefined ? options.userRole : auth.userRole;

  const roleLower = (simulatedRole || userRole || "").trim().toLowerCase();
  const isSocio = roleLower.includes("socio");
  const isSocioOrAdmin = options?.isSocioOrAdmin !== undefined 
    ? options.isSocioOrAdmin 
    : (roleLower === "admin" || roleLower === "administrador" || isSocio);
  const isAdmin = options?.isAdmin !== undefined 
    ? options.isAdmin 
    : (roleLower === "admin" || roleLower === "administrador");

  // Estados de datos principales
  const [loading, setLoading] = useState<boolean>(true);
  const [panelUsers, setPanelUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [providerPlans, setProviderPlans] = useState<any[]>([]);
  const [salePlans, setSalePlans] = useState<any[]>([]);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  // Estados de créditos
  const [currentUserCredits, setCurrentUserCredits] = useState<number>(0);
  const [currentUserCreditsVIP, setCurrentUserCreditsVIP] = useState<number>(0);
  const [currentUserCreditsDemo, setCurrentUserCreditsDemo] = useState<number>(0);
  const [availableCredits, setAvailableCredits] = useState<number>(() => {
    const stored = localStorage.getItem("xui_api_credits") || localStorage.getItem("g3d_iptv_active_available_credits");
    return stored ? Number(stored) : 350;
  });
  const [isRefreshingCredits, setIsRefreshingCredits] = useState<boolean>(false);

  // Form selections por defecto
  const [demoPkg, setDemoPkg] = useState<string>("custom-1h");
  const [vipPlanId, setVipPlanId] = useState<string>("");

  // Notificaciones y audio
  const [selectedTone, setSelectedTone] = useState<"bip" | "campana" | "digital" | "alarma">("digital");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [knownRequestIds, setKnownRequestIds] = useState<string[]>([]);
  const knownRequestIdsRef = useRef<string[]>([]);

  // Reproductor Web Audio API
  const playNotificationSound = useCallback((
    type: "bip" | "campana" | "digital" | "alarma" = "digital",
  ) => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === "bip") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "campana") {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.8 + idx * 0.1,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.0);
        });
      } else if (type === "digital") {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.03, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + i * 0.1 + 0.15,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.2);
        });
      } else {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(500, ctx.currentTime);
        osc2.frequency.setValueAtTime(505, ctx.currentTime);
        osc1.type = "sawtooth";
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("No se pudo reproducir el sintetizador web audio: ", e);
    }
  }, []);

  // Carga inicial unificada de datos
  const fetchData = useCallback(async () => {
    try {
      const usersData = await apiService.getIptvPanelUsers();
      setPanelUsers(usersData);

      // Calcular o cargar créditos del usuario logueado (Vendedor o Admin)
      if (user?.email) {
        const found = usersData.find(
          (u: any) =>
            u.usuario.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        const raw_vip = found ? found.creditos || 0 : isAdmin ? 99999 : 0;
        const raw_demo = found ? found.creditos_demo || 0 : isAdmin ? 99999 : 0;

        setCurrentUserCredits(raw_vip);
        setCurrentUserCreditsVIP(raw_vip);
        setCurrentUserCreditsDemo(raw_demo);
      }

      const accs = await apiService.getIptvAccounts();
      setAccounts(accs);

      const finances = await apiService.getIptvFinances();
      if (finances) {
        setProviderPlans(finances.provider_plans || []);
        setSalePlans(finances.sale_plans || []);
      }

      const requests = await apiService.getIptvCreditRequests();
      setCreditRequests(requests);

      // Guardar todos los IDs para la evaluación de notificaciones audible reactiva
      const ids = requests.map((r: any) => r.id);
      setKnownRequestIds(ids);
      knownRequestIdsRef.current = ids;

      const sysConf = await apiService.getSystemConfig();
      if (sysConf) {
        // Normalizar de forma proactiva las claves priorizando 'xc_' que son las credenciales reales cargadas en Ajustes XTV
        sysConf.xui_url = sysConf.xc_url_completa || sysConf.xui_url;
        sysConf.xui_token = sysConf.xc_token || sysConf.xui_token;
        sysConf.xui_access_code =
          sysConf.xc_access_code || sysConf.xui_access_code;
      }
      setSystemConfig(sysConf);

      // Sincronizar créditos reales del panel XC en vivo
      let liveCredits: number | null = null;
      if (sysConf && sysConf.xui_url) {
        try {
          const resXui = await fetch("/api/iptv/xui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "test",
              xuiUrl: sysConf.xui_url,
              xuiToken: sysConf.xui_token,
              xuiAccessCode: sysConf.xui_access_code,
            }),
          });
          const xuiData = await resXui.json();
          if (xuiData.success) {
            const rawResp = xuiData.data || xuiData.raw_response || {};
            const rawData = rawResp.data || rawResp || {};
            
            if (rawData.credits !== undefined) liveCredits = Number(rawData.credits);
            else if (rawData.credit !== undefined) liveCredits = Number(rawData.credit);
            else if (rawData.balance !== undefined) liveCredits = Number(rawData.balance);
            else if (rawResp.credits !== undefined) liveCredits = Number(rawResp.credits);
            else if (xuiData.credits !== undefined) liveCredits = Number(xuiData.credits);
            else if (xuiData.data?.credits !== undefined) liveCredits = Number(xuiData.data.credits);
          }
        } catch (err) {
          console.warn("Error fetching live credits on dashboard load:", err);
        }
      }

      if (liveCredits !== null) {
        setAvailableCredits(liveCredits);
        localStorage.setItem("xui_api_credits", String(liveCredits));
      } else {
        const stored = localStorage.getItem("xui_api_credits");
        setAvailableCredits(
          stored ? Number(stored) : (finances?.available_credits != null ? Number(finances.available_credits) : 350)
        );
      }

      // Asignar primer plan de demo por defecto si existe
      const demoPls = (finances?.provider_plans || []).filter(
        (p: any) =>
          !p.archived &&
          (p.tokens === 0 ||
            p.name.toLowerCase().includes("demo") ||
            p.name.toLowerCase().includes("trial") ||
            p.name.toLowerCase().includes("prueba")),
      );
      if (demoPls.length > 0) {
        setDemoPkg(demoPls[0].id);
      } else {
        setDemoPkg("custom-1h");
      }

      // Primer plan de venta por defecto para VIP
      const slPls = (finances?.sale_plans || []).filter(
        (p: any) => !p.archived,
      );
      if (slPls.length > 0) {
        setVipPlanId(slPls[0].id);
      }
    } catch (err) {
      console.error("Error al cargar datos de Registros XTV:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, isAdmin]);

  // Actualización manual de créditos en vivo
  const handleRefreshDashboardCredits = useCallback(async () => {
    if (isRefreshingCredits) return;
    setIsRefreshingCredits(true);
    const toastId = toast.loading("Actualizando créditos en vivo...");
    try {
      let url = systemConfig?.xui_url;
      let token = systemConfig?.xui_token;
      let accessCode = systemConfig?.xui_access_code;

      if (!url) {
        const sysConf = await apiService.getSystemConfig();
        if (sysConf) {
          sysConf.xui_url = sysConf.xc_url_completa || sysConf.xui_url;
          sysConf.xui_token = sysConf.xc_token || sysConf.xui_token;
          sysConf.xui_access_code = sysConf.xc_access_code || sysConf.xui_access_code;
          setSystemConfig(sysConf);
          url = sysConf.xui_url;
          token = sysConf.xui_token;
          accessCode = sysConf.xui_access_code;
        }
      }

      if (!url) {
        toast.dismiss(toastId);
        toast.error("La URL de tu panel no está configurada.");
        setIsRefreshingCredits(false);
        return;
      }

      const resXui = await fetch("/api/iptv/xui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          xuiUrl: url,
          xuiToken: token,
          xuiAccessCode: accessCode
        })
      });
      const xuiData = await resXui.json();
      toast.dismiss(toastId);
      if (xuiData.success) {
        const rawResp = xuiData.data || xuiData.raw_response || {};
        const rawData = rawResp.data || rawResp || {};
        
        let creditsVal: number | null = null;
        if (rawData.credits !== undefined) creditsVal = Number(rawData.credits);
        else if (rawData.credit !== undefined) creditsVal = Number(rawData.credit);
        else if (rawData.balance !== undefined) creditsVal = Number(rawData.balance);
        else if (rawResp.credits !== undefined) creditsVal = Number(rawResp.credits);
        else if (xuiData.credits !== undefined) creditsVal = Number(xuiData.credits);
        else if (xuiData.data?.credits !== undefined) creditsVal = Number(xuiData.data.credits);

        if (creditsVal !== null) {
          setAvailableCredits(creditsVal);
          localStorage.setItem("xui_api_credits", String(creditsVal));
          toast.success(`Créditos actualizados: ${creditsVal}`);
        } else {
          toast.error("No se encontró el campo de créditos en la respuesta del panel.");
        }
      } else {
        toast.error(`Error: ${xuiData.error || "No se pudo recuperar información."}`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Error de red: ${err.message || String(err)}`);
    } finally {
      setIsRefreshingCredits(false);
    }
  }, [isRefreshingCredits, systemConfig]);

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling sin bucle infinito usando Refs para IDs conocidos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const requests = await apiService.getIptvCreditRequests();
        const currentPendingIds = requests
          .filter((r: any) => r.estado === "pendiente")
          .map((r: any) => r.id);

        // Comparar con IDs previamente conocidos (vía ref para no disparar dependencias)
        const newPendings = currentPendingIds.filter(
          (id: string) => !knownRequestIdsRef.current.includes(id),
        );
        if (newPendings.length > 0) {
          // ¡Hay tickets nuevos!
          if (soundEnabled && isSocioOrAdmin) {
            playNotificationSound(selectedTone);
            toast.info(
              `🔔 ¡Nueva solicitud de crédito o activación recibida! (${newPendings.length})`,
              {
                duration: 5000,
                style: { background: "#0F172A", color: "#F8FAFC" },
              },
            );
          }
        }

        // Actualizar estados y la referencia
        setCreditRequests(requests);
        setKnownRequestIds(requests.map((r: any) => r.id));
        knownRequestIdsRef.current = requests.map((r: any) => r.id);
      } catch (e) {
        console.warn("Error en polling continuo de tickets de IPTV:", e);
      }
    }, 8500);

    return () => clearInterval(interval);
  }, [soundEnabled, selectedTone, isSocioOrAdmin, playNotificationSound]);

  return {
    // Estados de datos
    loading,
    setLoading,
    panelUsers,
    setPanelUsers,
    accounts,
    setAccounts,
    providerPlans,
    setProviderPlans,
    salePlans,
    setSalePlans,
    creditRequests,
    setCreditRequests,
    systemConfig,
    setSystemConfig,

    // Estados de créditos
    currentUserCredits,
    setCurrentUserCredits,
    currentUserCreditsVIP,
    setCurrentUserCreditsVIP,
    currentUserCreditsDemo,
    setCurrentUserCreditsDemo,
    availableCredits,
    setAvailableCredits,
    isRefreshingCredits,
    handleRefreshDashboardCredits,

    // Planes por defecto seleccionados
    demoPkg,
    setDemoPkg,
    vipPlanId,
    setVipPlanId,

    // Alertas y polling
    selectedTone,
    setSelectedTone,
    soundEnabled,
    setSoundEnabled,
    knownRequestIds,
    setKnownRequestIds,
    playNotificationSound,

    // Función de recarga general
    fetchData,
  };
}
