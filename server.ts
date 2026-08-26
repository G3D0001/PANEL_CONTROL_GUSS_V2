import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Servidor de base de datos Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

const serverSupabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = 3000;

// Habilitar JSON parser para posibles posts futuros
app.use(express.json());

// Habilitar cabeceras CORS de lectura pública (Access-Control-Allow-Origin: *)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

async function startServer() {

  // Endpoints API REST de clubTivi (IPTV)
  
  // A) GET /api/settings
  app.get("/api/settings", async (req, res) => {
    try {
      const { data, error } = await serverSupabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', '1')
        .maybeSingle();

      const config = data?.datos || {};
      res.json({
        iptv_url: config.iptv_url || "",
        banner_url: config.banner_url || ""
      });
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.json({
        iptv_url: "",
        banner_url: ""
      });
    }
  });

  // NUEVO: GET /api/my-ip para obtener la IP pública del usuario que está utilizando la app
  app.get("/api/my-ip", (req, res) => {
    try {
      const forwarded = req.headers["x-forwarded-for"];
      let ip = "";
      if (typeof forwarded === "string") {
        ip = forwarded.split(",")[0].trim();
      } else if (Array.isArray(forwarded)) {
        ip = forwarded[0].trim();
      } else {
        ip = req.socket.remoteAddress || "";
      }
      
      // Limpiar formato IPv6 mapeado a IPv4 si corresponde (ej: ::ffff:192.168.1.1)
      if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
      }
      
      res.json({ ip });
    } catch (err) {
      res.json({ ip: "No especificada" });
    }
  });

  // B) GET /api/version
  app.get("/api/version", async (req, res) => {
    try {
      const { data, error } = await serverSupabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', '1')
        .maybeSingle();

      const config = data?.datos || {};
      res.json({
        latest_version: config.latest_version || "1.0.0",
        apk_url: config.apk_url || "",
        update_notes: config.update_notes || ""
      });
    } catch (err) {
      console.error("Error fetching version:", err);
      res.json({
        latest_version: "1.0.0",
        apk_url: "",
        update_notes: ""
      });
    }
  });

  // PROXY SEGURO DE EVOLUTION API PARA EVITAR CORS Y MIXED CONTENT (HTTP/HTTPS)
  app.all("/api/evolution-proxy", async (req, res) => {
    try {
      const { targetUrl, method, headers, body } = req.body;

      if (!targetUrl) {
        return res.status(400).json({ success: false, error: "Falta el parámetro 'targetUrl'." });
      }

      const lowerUrl = targetUrl.toLowerCase();
      if (!lowerUrl.includes("/instance/") && !lowerUrl.includes("/message/")) {
        return res.status(400).json({ success: false, error: "La URL de destino no parece ser de Evolution API." });
      }

      const fetchOptions: any = {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };

      if (body && (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH")) {
        fetchOptions.body = JSON.stringify(body);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const targetRes = await fetch(targetUrl, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const status = targetRes.status;
        const resText = await targetRes.text();

        res.status(status);
        try {
          const parsedJson = JSON.parse(resText);
          res.json(parsedJson);
        } catch {
          res.send(resText);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("Error al conectar con Evolution API via proxy:", err);
        res.status(502).json({
          success: false,
          error: `No se pudo conectar a Evolution API (${err.message}). Si estás usando localhost o una IP local, asegúrate de que tu túnel de red (ej. tunnel-evo, Cloudflare Tunnel, ngrok) esté activo y configurado con la URL pública correspondiente.`,
          details: err.message
        });
      }
    } catch (err: any) {
      console.error("Error en proxy de Evolution API:", err);
      res.status(500).json({ success: false, error: "Error interno del servidor en el proxy de Evolution API.", details: err.message });
    }
  });

  // C) GET /api/planes (Público para conectar otras apps como Flutter, Bots de WhatsApp, Web, etc.)
  app.get("/api/planes", async (req, res) => {
    try {
      // Intentamos consultar la tabla de base de datos iptv_planes_venta
      const { data: individualPlans, error: plansError } = await serverSupabase
        .from('iptv_planes_venta')
        .select('*');

      if (individualPlans && !plansError) {
        // Ordenar por precio ascendentemente de forma manual o usar el resultado
        const sortedPlans = [...individualPlans].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        return res.json({
          success: true,
          source: "database_rows",
          planes: sortedPlans.map(p => ({
            id: p.id,
            name: p.name,
            months: p.months,
            hours: p.hours,
            screens: p.screens,
            tokens: p.tokens,
            price: p.price,
            screens_api: p.screens_api,
            comision: p.comision,
            categoria_nombre: p.categoria_nombre || (p.categoria_id === 'demo' ? 'Demos Gratuitas' : p.categoria_id === 'xxx' ? 'Paquetes Extras' : 'Membresías VIP'),
            categoria_id: p.categoria_id || 'vip'
          }))
        });
      }

      // Fallback: Si falla o no tiene filas, leer del JSON consolidado en iptv_finanzas_config
      const { data: configData } = await serverSupabase
        .from('iptv_finanzas_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const salePlans = configData?.sale_plans || [];
      const sortedFallback = [...salePlans].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      res.json({
        success: true,
        source: "fallback_config",
        planes: sortedFallback.map((p: any) => ({
          id: p.id,
          name: p.name,
          months: p.months,
          hours: p.hours,
          screens: p.screens,
          tokens: p.tokens,
          price: p.price,
          screens_api: p.screens_api,
          comision: p.comision,
          categoria_nombre: p.categoria_nombre || (p.categoria_id === 'demo' ? 'Demos Gratuitas' : p.categoria_id === 'xxx' ? 'Paquetes Extras' : 'Membresías VIP'),
          categoria_id: p.categoria_id || 'vip'
        }))
      });
    } catch (err) {
      console.error("Error fetching sale plans:", err);
      res.status(500).json({ success: false, error: "Error interno al recuperar el catálogo de planes de venta." });
    }
  });

  // C) POST /api/iptv/xui (Proxy seguro para XC Reseller - Multi Panel)
  app.post("/api/iptv/xui", async (req, res) => {
    const { action, xuiUrl, xuiToken, xuiAccessCode, username, password, packageId, id, package: reqPackage, ...extraParams } = req.body;
    
    if (!xuiUrl) {
      return res.status(400).json({ success: false, error: "La URL de tu panel XC Reseller es requerida." });
    }

    // Desinfectar URL base de XC Reseller
    let baseUrl = xuiUrl.trim();
    let autoExtractedAccessCode = "";

    // Si pegan el endpoint completo del nuevo panel: http://xtv.ar:2095/pooqkDEG/reseller/index.php
    if (baseUrl.includes("/reseller/index.php")) {
      try {
        const urlObj = new URL(baseUrl.startsWith("http") ? baseUrl : "http://" + baseUrl);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean); // ej: ["pooqkDEG", "reseller", "index.php"]
        const idx = pathSegments.indexOf("reseller");
        if (idx > 0) {
          autoExtractedAccessCode = pathSegments[idx - 1]; // "pooqkDEG"
        }
        baseUrl = urlObj.protocol + "//" + urlObj.host; // "http://xtv.ar:2095"
      } catch (e) {
        // Fallback simple por string splitting en caso de URL malformada
        const matches = baseUrl.match(/\/([^/]+)\/reseller\/index\.php/);
        if (matches && matches[1]) {
          autoExtractedAccessCode = matches[1];
        }
        baseUrl = baseUrl.split("/reseller/index.php")[0];
        if (autoExtractedAccessCode && baseUrl.endsWith("/" + autoExtractedAccessCode)) {
          baseUrl = baseUrl.slice(0, -(autoExtractedAccessCode.length + 1));
        }
      }
    }

    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "http://" + baseUrl;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // 🎲 INTERCEPCIÓN EN TIEMPO REAL PARA EL HOST DE PRUEBA (contingencia simulada)
    if ((baseUrl.includes("mv-pl") && !baseUrl.includes("mv-play.uk")) || baseUrl.includes("fake-panel")) {
      console.log(`[XC Interceptor] Interceptando llamada al host de pruebas/contingencia: ${baseUrl} (Acción: ${action})`);
      
      const resUser = username || "demo_" + Math.random().toString(36).substring(2, 8);
      const resPass = password || Math.random().toString(36).substring(2, 9);
      const playlistUrl = `${baseUrl}/get.php?username=${resUser}&password=${resPass}&output=ts`;

      // Paquetes reales extraídos de XC Reseller - Multi Panel
      const realPackagesList = [
        { id: "1", package_name: "❇️ Demo 1 Hora", is_addon: "0", is_trial: "1", is_official: "0", trial_credits: "0", official_credits: 0, trial_duration: "1", trial_duration_in: "hours", max_connections: "1" },
        { id: "2", package_name: "❇️ Demo 3 Horas", is_addon: "0", is_trial: "1", is_official: "0", trial_credits: "0", official_credits: 0, trial_duration: "3", trial_duration_in: "hours", max_connections: "1" },
        { id: "28", package_name: "❇️ Demo 6 Horas", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 0, trial_duration: "6", trial_duration_in: "hours", max_connections: "1" },
        { id: "47", package_name: "☀️ PROMO 2x1", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 1, official_duration: "2", official_duration_in: "months", max_connections: "3" },
        { id: "48", package_name: "#C - 1 Mes 1 Dispositivo (Consume 1 credito)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 1, official_duration: "1", official_duration_in: "months", max_connections: "1" },
        { id: "49", package_name: "#D - 1 Mes 3 Dispositivos (Consume 1 credito)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 1, official_duration: "1", official_duration_in: "months", max_connections: "3" },
        { id: "50", package_name: "#E - 1 Mes 5 Dispositivos (Consume 2 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 2, official_duration: "1", official_duration_in: "months", max_connections: "5" },
        { id: "51", package_name: "#F - 3 Meses 1 Dispositivo (Consume 2 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 2, official_duration: "3", official_duration_in: "months", max_connections: "1" },
        { id: "52", package_name: "#B - PROMO 3x2  (Activa 3 meses 3 Dispositivos y consume 2 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 2, official_duration: "3", official_duration_in: "months", max_connections: "3" },
        { id: "53", package_name: "#G - 3 Meses 5 Dispositivos (Consume 3 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 3, official_duration: "3", official_duration_in: "months", max_connections: "5" },
        { id: "54", package_name: "#H - 6 Meses 1 Dispositivo (Consume 4 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 4, official_duration: "6", official_duration_in: "months", max_connections: "1" },
        { id: "55", package_name: "#I - 6 Meses 3 Dispositivos (Consume 5 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 5, official_duration: "6", official_duration_in: "months", max_connections: "3" },
        { id: "56", package_name: "#J - 6 Meses 5 Dispositivos (Consume 6 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 6, official_duration: "6", official_duration_in: "months", max_connections: "5" },
        { id: "57", package_name: "#K - 12 Meses 1 Dispositivo (Consume 8 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 8, official_duration: "1", official_duration_in: "years", max_connections: "1" },
        { id: "58", package_name: "#L - 12 Meses 3 Dispositivos (Consume 9 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 9, official_duration: "1", official_duration_in: "years", max_connections: "3" },
        { id: "59", package_name: "#M - 12 Meses 5 Dispositivos (Consume 10 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 10, official_duration: "1", official_duration_in: "years", max_connections: "5" },
        { id: "61", package_name: "#N - 3+1 (4 Meses) 3 Dispositivos (Consume 3 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 3, official_duration: "4", official_duration_in: "months", max_connections: "3" },
        { id: "62", package_name: "#O - 3+1 (4 Meses) 5 Dispositivos (Consume 4 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 4, official_duration: "4", official_duration_in: "months", max_connections: "5" },
        { id: "63", package_name: "#P - 6+2 (8 Meses) 3 Dispositivos (Consume 6 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 6, official_duration: "8", official_duration_in: "months", max_connections: "3" },
        { id: "64", package_name: "#Q - 6+2 (8 Meses) 5 Dispositivos (Consume 7 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 7, official_duration: "8", official_duration_in: "months", max_connections: "5" },
        { id: "65", package_name: "#R - 12+3 (15 Meses) 3 Dispositivos (Consume 10 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 10, official_duration: "15", official_duration_in: "months", max_connections: "3" },
        { id: "66", package_name: "#S - 12+3 (15 Meses) 5 Dispositivos (Consume 12 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 12, official_duration: "15", official_duration_in: "months", max_connections: "5" },
        { id: "67", package_name: "#T - 24+6 (30 Meses) 3 Dispositivos (Consume 20 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 20, official_duration: "30", official_duration_in: "months", max_connections: "3" },
        { id: "68", package_name: "#U - 24+6 (30 Meses) 5 Dispositivos (Consume 22 creditos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 22, official_duration: "30", official_duration_in: "months", max_connections: "5" },
        { id: "74", package_name: "⛔ Quitar XXX Gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 0, official_duration: "0", official_duration_in: "hours", max_connections: "1" },
        { id: "75", package_name: "⛔ Agregar XXX Gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 0, official_duration: "0", official_duration_in: "hours", max_connections: "1" },
        { id: "77", package_name: "♻️ Demo 4 Horas (3 dispositivos)", is_addon: "0", is_trial: "0", is_official: "0", trial_credits: "0", official_credits: 0, trial_duration: "4", trial_duration_in: "hours", max_connections: "3" },
        { id: "129", package_name: "⚡ 1 Mes", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 1, official_duration: "1", official_duration_in: "months", max_connections: "1" },
        { id: "130", package_name: "⚡ 3 Meses", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 2, official_duration: "3", official_duration_in: "months", max_connections: "1" },
        { id: "131", package_name: "⚡ 6 Meses", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 4, official_duration: "6", official_duration_in: "months", max_connections: "1" },
        { id: "132", package_name: "⚡ 12 Meses", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 8, official_duration: "1", official_duration_in: "years", max_connections: "1" },
        { id: "133", package_name: "⚡ 24 Meses", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 18, official_duration: "2", official_duration_in: "years", max_connections: "1" },
        { id: "134", package_name: "⭐ 3 meses +1 mes gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 3, official_duration: "4", official_duration_in: "months", max_connections: "1" },
        { id: "135", package_name: "⭐ 6 meses +2 meses gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 5, official_duration: "8", official_duration_in: "months", max_connections: "1" },
        { id: "136", package_name: "⭐ 12 meses +3 meses gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 10, official_duration: "15", official_duration_in: "months", max_connections: "1" },
        { id: "137", package_name: "⭐ 24 meses +6 meses gratis", is_addon: "0", is_trial: "0", is_official: "1", trial_credits: "0", official_credits: 20, official_duration: "30", official_duration_in: "months", max_connections: "1" }
      ];

      if (action === "test") {
        return res.json({
          success: true,
          message: "¡Conectado exitosamente con tu panel XC Reseller!",
          detected_url: baseUrl,
          data: {
            success: true,
            status: "STATUS_SUCCESS",
            credits: 250,
            total_users: 15,
            bouquet: "[2,21,22,1,3,27,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,23,24,26,25,31,30,33,28,34]",
            packages: realPackagesList
          }
        });
      }

      if (action === "packages") {
        return res.json({
          success: true,
          detected_url: baseUrl,
          data: {
            status: "STATUS_SUCCESS",
            data: realPackagesList
          }
        });
      }

      if (action === "get_lines") {
        return res.json({
          success: true,
          detected_url: baseUrl,
          data: [
            {
              id: 101,
              username: "santilopez",
              password: "password123",
              max_connections: 2,
              is_trial: 0,
              creado_en: "2026-06-18T20:00:00.000Z",
              fecha_exp: 1782234000,
              status: 1,
              reseller_notes: "Línea comercial Premium IPTV."
            },
            {
              id: 102,
              username: "lucasmorales",
              password: "pass77_demo",
              max_connections: 3,
              is_trial: 1,
              creado_en: "2026-06-19T01:00:00.000Z",
              fecha_exp: Math.floor((Date.now() + 4 * 60 * 60 * 1000) / 1000),
              status: 1,
              reseller_notes: "Demo activa 4h de prueba."
            }
          ]
        });
      }

      if (action === "get_line") {
        const lineId = Number(id || req.query.id || req.body.id || 4521);
        return res.json({
          status: "STATUS_SUCCESS",
          success: true,
          detected_url: baseUrl,
          data: {
            id: lineId,
            username: username || "customer1",
            password: password || "securepass",
            package_id: Number(packageId || 1),
            exp_date: 1740000000,
            is_trial: 0,
            is_isplock: 0,
            status: 1,
            allowed_ips: [],
            reseller_notes: "Premium customer (XTV)",
            bouquets: [1, 4, 7],
            created_at: "2025-01-15 14:30:00"
          }
        });
      }

      if (action === "create_demo" || action === "create_line" || action === "create") {
        return res.json({
          success: true,
          status: "STATUS_SUCCESS",
          username: resUser,
          password: resPass,
          playlist_url: playlistUrl,
          detected_url: baseUrl,
          data: {
            id: Math.floor(4000 + Math.random() * 999),
            username: resUser,
            password: resPass,
            package_id: Number(req.body.package || req.body.packageId || 1),
            exp_date: Math.floor(Date.now() / 1000) + (req.body.trial == 0 ? 30 * 86400 : 4 * 3600),
            is_trial: Number(req.body.trial !== undefined ? req.body.trial : 1),
            status: 1,
            reseller_notes: req.body.nombre_completo ? `${String(req.body.nombre_completo).trim()} (XTV)${req.body.reseller_notes ? " - " + String(req.body.reseller_notes).trim() : ""}` : (req.body.reseller_notes ? `${String(req.body.reseller_notes).trim()} (XTV)` : "Demo desde XTV"),
            is_isplock: Number(req.body.is_isplock || 0),
            allowed_ips: req.body.allowed_ips || [],
            bouquets_selected: req.body.bouquets_selected || [],
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
          },
          raw_response: {
            status: "STATUS_SUCCESS",
            data: {
              id: Math.floor(4000 + Math.random() * 999),
              username: resUser,
              password: resPass,
              package_id: Number(req.body.package || req.body.packageId || 1),
              exp_date: Math.floor(Date.now() / 1000) + (req.body.trial == 0 ? 30 * 86400 : 4 * 3600),
              is_trial: Number(req.body.trial !== undefined ? req.body.trial : 1),
              status: 1,
              reseller_notes: req.body.nombre_completo ? `${String(req.body.nombre_completo).trim()} (XTV)${req.body.reseller_notes ? " - " + String(req.body.reseller_notes).trim() : ""}` : (req.body.reseller_notes ? `${String(req.body.reseller_notes).trim()} (XTV)` : "Demo desde XTV"),
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
              bouquet: "[2,21,22,1,3,27,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,23,24,26,25,31,30,33,28,34]",
              packages: realPackagesList
            }
          }
        });
      }

      if (action === "edit_line" || action === "edit") {
        return res.json({
          status: "STATUS_SUCCESS",
          success: true,
          detected_url: baseUrl,
          message: "¡Línea editada con éxito en el panel!",
          data: {
            id: Number(req.body.id || 4521),
            username: username || "customer1",
            password: password || "securepass",
            package_id: Number(req.body.package || 2),
            is_trial: 0,
            status: 1,
            reseller_notes: req.body.reseller_notes || "Extended for another month",
            is_isplock: Number(req.body.is_isplock || 0),
            allowed_ips: req.body.allowed_ips || [],
            bouquets_selected: req.body.bouquets_selected || [],
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
          }
        });
      }

      if (action === "enable_line" || action === "disable_line" || action === "delete_line" || action === "extend_line") {
        return res.json({
          success: true,
          message: `Operación técnica (${action}) para ${username || id || "cliente"} ejecutada de forma positiva en el panel.`
        });
      }
    }

    // Parsear dominio y puerto para generar candidatos inteligentes de enlace
    let hostname = "";
    let originalPort = "";
    try {
      const parsed = new URL(baseUrl);
      hostname = parsed.hostname;
      originalPort = parsed.port;
    } catch (e) {
      hostname = baseUrl.replace("http://", "").replace("https://", "").split(":")[0].split("/")[0];
    }

    // Generamos un set ordenado de candidatos para cubrir todos los puertos y protocolos probables.
    // Esto es CLAVE en IPTV ya que el puerto de streaming (ej. 8080) es diferente al puerto del panel dashboard/API (ej. 80, 443 o custom).
    const candUrls: string[] = [];
    if (originalPort) {
      // Prioridad 1: HTTPS con el puerto original deseado
      candUrls.push(`https://${hostname}:${originalPort}`);
      // Prioridad 2: HTTP con el puerto original deseado
      candUrls.push(`http://${hostname}:${originalPort}`);
      // Prioridad 3: HTTPS sin puerto o estándar (Cloudflare proxy o Nginx central de 443)
      candUrls.push(`https://${hostname}`);
      // Prioridad 4: HTTP sin puerto o estándar (Nginx central of 80)
      candUrls.push(`http://${hostname}`);
    } else {
      // Prioridades sin puerto explícito
      candUrls.push(`https://${hostname}`);
      candUrls.push(`http://${hostname}`);
      candUrls.push(`https://${hostname}:8080`);
      candUrls.push(`http://${hostname}:8080`);
      candUrls.push(`https://${hostname}:8000`);
      candUrls.push(`http://${hostname}:8000`);
    }

    // Mantener únicos conservando orden de prioridad
    const uniqueCandidates = Array.from(new Set(candUrls));

    // Helper de fetch genérico con límite de tiempo estricto para no demorar la respuesta visual
    const tryRequest = async (baseUrlCand: string, endpointPath: string, payload: any, isGet: boolean, isFormEncoded: boolean) => {
      const fullUrl = `${baseUrlCand}${endpointPath}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // Elevamos a 4 segundos para servidores lentos de IPTV

      try {
        let response;
        const headers: any = {};
        
        // El script de reseller/index.php no usa Bearer Tokens, mantener cabeceras lo más limpias posibles
        const isResellerUrl = fullUrl.includes("/reseller/") || endpointPath.includes("reseller");
        if (!isResellerUrl && xuiToken) {
          headers["Authorization"] = `Bearer ${xuiToken}`;
        }

        const activeAccessCode = (xuiAccessCode || autoExtractedAccessCode || "").trim();
        if (activeAccessCode) {
          headers["Access-Code"] = activeAccessCode;
          headers["accesscode"] = activeAccessCode;
          headers["X-Access-Code"] = activeAccessCode;
        }

        if (isGet) {
          const queryParams = new URLSearchParams();
          for (const k in payload) {
            queryParams.set(k, String(payload[k]));
          }
          if (!isResellerUrl) {
            if (xuiToken) {
              queryParams.set("api_key", xuiToken.trim());
              queryParams.set("key", xuiToken.trim());
              queryParams.set("api_token", xuiToken.trim());
            }
            if (activeAccessCode) {
              queryParams.set("access_code", activeAccessCode);
              queryParams.set("accesscode", activeAccessCode);
            }
          }
          const getUrl = `${fullUrl}?${queryParams.toString()}`;
          response = await fetch(getUrl, {
            method: "GET",
            headers,
            signal: controller.signal
          });
        } else {
          if (isFormEncoded) {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
            const formParams = new URLSearchParams();
            for (const k in payload) {
              if (payload[k] !== undefined && payload[k] !== null && payload[k] !== "") {
                if (Array.isArray(payload[k])) {
                  formParams.set(k, payload[k].join(","));
                } else {
                  formParams.set(k, String(payload[k]));
                }
              }
            }
            if (!isResellerUrl && activeAccessCode) {
              formParams.set("access_code", activeAccessCode);
              formParams.set("accesscode", activeAccessCode);
              if (xuiToken) {
                formParams.set("api_key", xuiToken.trim());
                formParams.set("key", xuiToken.trim());
                formParams.set("api_token", xuiToken.trim());
              }
            }
            response = await fetch(fullUrl, {
              method: "POST",
              headers,
              body: formParams.toString(),
              signal: controller.signal
            });
          } else {
            headers["Content-Type"] = "application/json";
            const jsonPayload: any = {};
            for (const k in payload) {
              if (payload[k] !== undefined && payload[k] !== null && payload[k] !== "") {
                jsonPayload[k] = payload[k];
              }
            }
            if (!isResellerUrl && activeAccessCode) {
              jsonPayload.access_code = activeAccessCode;
              jsonPayload.accesscode = activeAccessCode;
              if (xuiToken) {
                jsonPayload.api_key = xuiToken.trim();
                jsonPayload.key = xuiToken.trim();
                jsonPayload.api_token = xuiToken.trim();
              }
            }
            response = await fetch(fullUrl, {
              method: "POST",
              headers,
              body: JSON.stringify(jsonPayload),
              signal: controller.signal
            });
          }
        }

        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      const finalUser = username || "demo_" + Math.random().toString(36).substring(2, 8);
      const finalPass = password || Math.random().toString(36).substring(2, 9);
      const finalPkg = packageId || 1; 

      let finalSuccess = false;
      let rawResponse: any = null;
      let successBaseUrl = "";
      let lastError = "";

      // Parsear dominio y puerto de manera minuciosa para armar candidatos inteligentes sin puertos de streaming
      let hostWithoutPort = baseUrl;
      let isHttps = baseUrl.startsWith("https://");
      try {
        const parsedUrl = new URL(baseUrl);
        const protocol = parsedUrl.protocol;
        const hostname = parsedUrl.hostname;
        hostWithoutPort = `${protocol}//${hostname}`;
      } catch (e) {
        const cleanNoProto = baseUrl.replace("http://", "").replace("https://", "");
        const hostname = cleanNoProto.split(":")[0].split("/")[0];
        hostWithoutPort = isHttps ? `https://${hostname}` : `http://${hostname}`;
      }

      // Candidatos de base URL inteligentes para la API:
      // 1. Probar en la URL exacta ingresada por el usuario
      // 2. Probar en protocolo alternativo de la URL ingresada
      // 3. Probar sin el puerto de streaming (que suele ser el verdadero panel de administración/API) en HTTPS
      // 4. Probar sin el puerto de streaming en HTTP
      const baseCandidates: string[] = [];
      baseCandidates.push(baseUrl);

      const altProtoBase = baseUrl.startsWith("https://") 
        ? baseUrl.replace("https://", "http://") 
        : baseUrl.replace("http://", "https://");
      baseCandidates.push(altProtoBase);

      if (baseUrl !== hostWithoutPort) {
        baseCandidates.push(hostWithoutPort);
        const altCleanHost = hostWithoutPort.startsWith("https://")
          ? hostWithoutPort.replace("https://", "http://")
          : hostWithoutPort.replace("http://", "https://");
        baseCandidates.push(altCleanHost);
      }

      const uniqueBases = Array.from(new Set(baseCandidates.filter(Boolean)));
      const attempts: Array<{ baseUrl: string; endpoint: string; format: { isGet: boolean; isForm: boolean } }> = [];
      
      const finalAccessCode = (xuiAccessCode && xuiAccessCode.trim()) || autoExtractedAccessCode;

      // 1. Si hay access code o fue auto-extraído, probamos primero los endpoints directos de index.php reseller
      if (finalAccessCode) {
        const cleanCode = finalAccessCode.trim();
        for (const base of uniqueBases) {
          // Intentará conectarse primero directo al script de reseller
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/reseller/index.php`, format: { isGet: true, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/reseller/index.php`, format: { isGet: false, isForm: true } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/reseller/index.php`, format: { isGet: false, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/access/reseller/index.php`, format: { isGet: true, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/access/reseller/index.php`, format: { isGet: false, isForm: true } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/access/reseller/index.php`, format: { isGet: false, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/reseller/index.php`, format: { isGet: true, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/`, format: { isGet: true, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}`, format: { isGet: true, isForm: false } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/`, format: { isGet: false, isForm: true } });
          attempts.push({ baseUrl: base, endpoint: `/${cleanCode}/`, format: { isGet: false, isForm: false } });
        }
      }

      // 2. Canales tradicionales alternativos y rutas directas /access/reseller/index.php para todo tipo de configuración
      for (const base of uniqueBases) {
        attempts.push({ baseUrl: base, endpoint: "/access/reseller/index.php", format: { isGet: false, isForm: true } });
        attempts.push({ baseUrl: base, endpoint: "/access/reseller/index.php", format: { isGet: true, isForm: false } });
        attempts.push({ baseUrl: base, endpoint: "/access/reseller/index.php", format: { isGet: false, isForm: false } });
        attempts.push({ baseUrl: base, endpoint: "/reseller/index.php", format: { isGet: false, isForm: true } });
        attempts.push({ baseUrl: base, endpoint: "/reseller/index.php", format: { isGet: true, isForm: false } });
        attempts.push({ baseUrl: base, endpoint: "/api", format: { isGet: false, isForm: true } });
        attempts.push({ baseUrl: base, endpoint: "/api", format: { isGet: false, isForm: false } });
        attempts.push({ baseUrl: base, endpoint: "/api/reseller", format: { isGet: false, isForm: true } });
        attempts.push({ baseUrl: base, endpoint: "/api/user", format: { isGet: false, isForm: true } });
      }

      // Filtrar intentos según la acción para optimizar y asegurar el método adecuado (GET para get_line y get_lines)
      let filteredAttempts = attempts;
      if (action === "get_line" || action === "get_lines") {
        filteredAttempts = attempts
          .filter((a) => a.format.isGet)
          .filter((v, i, a) => a.findIndex(t => (t.baseUrl === v.baseUrl && t.endpoint === v.endpoint)) === i);
      }

      // Ejecución secuencial inteligente
      for (const attempt of filteredAttempts) {
        try {
          console.log(`[XUI Proxy] Probando destino inteligente: ${attempt.baseUrl}${attempt.endpoint} (${attempt.format.isGet ? "GET" : attempt.format.isForm ? "Form-POST" : "JSON-POST"})`);
          
          let payload: any = {};
          const isResellerEndpoint = attempt.endpoint.includes("reseller/index.php") || (finalAccessCode && attempt.endpoint.includes(finalAccessCode.trim()));

          if (isResellerEndpoint) {
            let finalAction = action;
            if (action === "test") {
              finalAction = "user_info";
            } else if (action === "create_demo" || action === "create" || action === "create_line") {
              finalAction = "create_line";
            }

            // Si piden get_lines pero pasaron un ID explícito, lo tratamos inteligentemente como get_line (singular)
            // ya que la API de reseller de XC requiere get_line para consultar por ID de línea individual.
            const hasIdParam = (id !== undefined && id !== null && String(id).trim() !== "") || 
                               (req.body.id !== undefined && req.body.id !== null && String(req.body.id).trim() !== "") || 
                               (extraParams.id !== undefined && extraParams.id !== null && String(extraParams.id).trim() !== "");
            if (finalAction === "get_lines" && hasIdParam) {
              finalAction = "get_line";
            }

            let resolvedId = id;
            if (!resolvedId && username && (finalAction === "get_line" || finalAction === "extend_line" || finalAction === "edit_line" || finalAction === "disable_line" || finalAction === "enable_line" || finalAction === "delete_line")) {
              try {
                console.log(`[XUI Proxy] Resolviendo ID dinámicamente para username: ${username} en ${attempt.baseUrl}...`);
                const lookupPayload = {
                  action: "get_lines",
                  api_key: xuiToken,
                  "search[value]": username
                };
                const lookupRes = await tryRequest(attempt.baseUrl, attempt.endpoint, lookupPayload, true, false);
                if (lookupRes.ok) {
                  const lookupText = await lookupRes.text();
                  const lookupParsed = JSON.parse(lookupText);
                  const lines = Array.isArray(lookupParsed) ? lookupParsed : (lookupParsed?.data || lookupParsed?.rows || []);
                  const matched = lines.find((l: any) => l.username === username);
                  if (matched && matched.id) {
                    resolvedId = matched.id;
                    console.log(`[XUI Proxy] ID de línea resuelto con éxito para ${username}: ${resolvedId}`);
                  }
                }
              } catch (resolveErr) {
                console.warn(`[XUI Proxy] No se pudo pre-resolver ID para ${username} en ${attempt.baseUrl}:`, resolveErr);
              }
            }

            // Inicializamos un objeto limpio que solo contendrá las claves permitidas por la API de Reseller de Xtream-Masters
            const cleanPayload: any = {
              action: finalAction,
              api_key: xuiToken
            };

            const resellerWarnings: Array<{ field: string; code: string; message: string }> = [];

            // Idempotencia oficial Xtream-Masters v2.0 (request_id previene doble cobro por timeout/reintento)
            const incomingRequestId = extraParams.request_id || req.body.request_id || req.query.request_id;
            if (incomingRequestId && String(incomingRequestId).trim() !== "") {
              cleanPayload.request_id = String(incomingRequestId).trim();
            }

            // Sanitización estricta por acción según la Wiki oficial de Xtream-Masters y restricciones de revendedor
            if (finalAction === "create_line") {
              // 1. Package (ID del paquete en el panel mayorista) - OBLIGATORIO (int)
              const rawPkg = extraParams.package !== undefined ? extraParams.package : (req.body.package !== undefined ? req.body.package : (reqPackage !== undefined ? reqPackage : (packageId !== undefined ? packageId : finalPkg)));
              cleanPayload.package = Number(rawPkg || 1);

              // 2. Trial (0 = regular/VIP, 1 = demo/trial) - OBLIGATORIO (int)
              cleanPayload.trial = extraParams.trial !== undefined ? Number(extraParams.trial) : (req.body.trial !== undefined ? Number(req.body.trial) : (action === "create_demo" ? 1 : 0));

              // 3. Username y Password: Para cuentas revendedor, se eliminan para que el panel autogenere credenciales nativas seguras
              if (username && String(username).trim() !== "") {
                resellerWarnings.push({
                  field: "username",
                  code: "reseller_custom_username_forbidden",
                  message: "Como revendedor no se deben forzar usuarios personalizados. Se adopta el autogenerado por el panel."
                });
                delete cleanPayload.username;
              }
              if (password && String(password).trim() !== "") {
                resellerWarnings.push({
                  field: "password",
                  code: "reseller_custom_password_forbidden",
                  message: "Como revendedor no se deben forzar contraseñas personalizadas iniciales. Se adopta la devuelta por el panel."
                });
                delete cleanPayload.password;
              }

              // 4. is_isplock (0 = disabled, 1 = enable ISP lock) - OPCIONAL (int)
              const rawIsplock = extraParams.is_isplock !== undefined ? extraParams.is_isplock : req.body.is_isplock;
              if (rawIsplock !== undefined && rawIsplock !== "" && rawIsplock !== null) {
                cleanPayload.is_isplock = Number(rawIsplock);
              }

              // 5. allowed_ips[] (Array de IPs permitidas) - OPCIONAL (array)
              const rawAllowedIps = extraParams.allowed_ips !== undefined ? extraParams.allowed_ips : req.body.allowed_ips;
              if (rawAllowedIps !== undefined && Array.isArray(rawAllowedIps) && rawAllowedIps.length > 0) {
                cleanPayload.allowed_ips = rawAllowedIps;
              }

              // 6. reseller_notes (Notas internas del revendedor) - OPCIONAL (string)
              const fullName = (req.body.nombre_completo || extraParams.nombre_completo || "").trim();
              const customNotes = (req.body.reseller_notes || extraParams.reseller_notes || "").trim().replace(/clubTivi/gi, "XTV");
              if (fullName || customNotes) {
                cleanPayload.reseller_notes = fullName ? `${fullName} (XTV)${customNotes ? " - " + customNotes : ""}` : customNotes;
              }

              // 7. bouquets_selected[] (Array de IDs de bouquets) - OPCIONAL (array)
              const rawBouquets = extraParams.bouquets_selected !== undefined ? extraParams.bouquets_selected : req.body.bouquets_selected;
              if (rawBouquets !== undefined && Array.isArray(rawBouquets) && rawBouquets.length > 0) {
                cleanPayload.bouquets_selected = rawBouquets;
              }

              // 8. max_connections (Pantallas contratadas / límite de conexiones) - OPCIONAL (int)
              const rawConn = extraParams.max_connections !== undefined ? extraParams.max_connections : (req.body.max_connections !== undefined ? req.body.max_connections : (extraParams.connections !== undefined ? extraParams.connections : req.body.connections));
              if (rawConn !== undefined && Number(rawConn) > 1) {
                cleanPayload.max_connections = Number(rawConn);
              }

              // 9. add_special_bouquets (1 = agrega bouquets adultos, 0 = remueve) - OPCIONAL (int)
              const rawAdult = extraParams.add_special_bouquets !== undefined ? extraParams.add_special_bouquets : req.body.add_special_bouquets;
              if (rawAdult !== undefined && rawAdult !== "" && rawAdult !== null) {
                cleanPayload.add_special_bouquets = Number(rawAdult);
              }

              // 10. private_cdn (1 = ruta vía CDN privado, 0 = off) - OPCIONAL (int)
              const rawPrivateCdn = extraParams.private_cdn !== undefined ? extraParams.private_cdn : req.body.private_cdn;
              if (rawPrivateCdn !== undefined && rawPrivateCdn !== "" && rawPrivateCdn !== null) {
                cleanPayload.private_cdn = Number(rawPrivateCdn);
              }

              // 11. allow_epg (1 = incluye en salida XMLTV EPG, 0 = excluye) - OPCIONAL (int)
              const rawAllowEpg = extraParams.allow_epg !== undefined ? extraParams.allow_epg : req.body.allow_epg;
              if (rawAllowEpg !== undefined && rawAllowEpg !== "" && rawAllowEpg !== null) {
                cleanPayload.allow_epg = Number(rawAllowEpg);
              }

              // 12. forced_country (Código ISO de 2 letras de país) - OPCIONAL (string)
              const rawForcedCountry = (extraParams.forced_country || req.body.forced_country || "").trim();
              if (rawForcedCountry) {
                cleanPayload.forced_country = rawForcedCountry;
              }

              // 13. reset_password (1 = genera una nueva contraseña) - OPCIONAL (int)
              const rawResetPass = extraParams.reset_password !== undefined ? extraParams.reset_password : req.body.reset_password;
              if (rawResetPass !== undefined && rawResetPass !== "" && rawResetPass !== null) {
                cleanPayload.reset_password = Number(rawResetPass);
              }

              // 14. custom_playlist_id (ID de playlist o categoría personalizada) - OPCIONAL (int)
              const rawCustomPlaylist = extraParams.custom_playlist_id !== undefined ? extraParams.custom_playlist_id : req.body.custom_playlist_id;
              if (rawCustomPlaylist !== undefined && Number(rawCustomPlaylist) > 0) {
                cleanPayload.custom_playlist_id = Number(rawCustomPlaylist);
              }

            } else if (finalAction === "edit_line") {
              // Obligatorio: id de la línea
              const finalId = resolvedId !== undefined ? resolvedId : (id !== undefined ? id : (req.body.id !== undefined ? req.body.id : extraParams.id));
              if (finalId !== undefined) cleanPayload.id = Number(finalId);

              // Opcional: package para extender la duración
              const rawPkg = reqPackage !== undefined ? reqPackage : (packageId !== undefined ? packageId : (extraParams.package !== undefined ? extraParams.package : req.body.package));
              if (rawPkg !== undefined && Number(rawPkg) > 0) {
                cleanPayload.package = Number(rawPkg);
              }

              // Opcional: max_connections (actualiza conexiones/pantallas)
              const rawConn = req.body.max_connections !== undefined ? req.body.max_connections : (extraParams.max_connections !== undefined ? extraParams.max_connections : req.body.connections);
              if (rawConn !== undefined && Number(rawConn) > 0) {
                cleanPayload.max_connections = Number(rawConn);
              }

              if (username && String(username).trim() !== "") cleanPayload.username = String(username).trim();
              if (password && String(password).trim() !== "") cleanPayload.password = String(password).trim();

              const rawIsplock = extraParams.is_isplock !== undefined ? extraParams.is_isplock : req.body.is_isplock;
              if (rawIsplock !== undefined) cleanPayload.is_isplock = Number(rawIsplock);

              const finalNotes = req.body.reseller_notes !== undefined ? req.body.reseller_notes : extraParams.reseller_notes;
              if (finalNotes !== undefined) {
                const fullName = (req.body.nombre_completo || extraParams.nombre_completo || "").trim();
                const customNotes = String(finalNotes).trim().replace(/clubTivi/gi, "XTV");
                cleanPayload.reseller_notes = fullName ? `${fullName} (XTV)${customNotes ? " - " + customNotes : ""}` : customNotes;
              }

              if (extraParams.allowed_ips !== undefined) cleanPayload.allowed_ips = extraParams.allowed_ips;
              if (extraParams.bouquets_selected !== undefined) cleanPayload.bouquets_selected = extraParams.bouquets_selected;

            } else if (finalAction === "extend_line") {
              // Si se envían max_connections o notas para modificar además de extender, según la wiki Xtream-Masters, edit_line maneja la extensión (package) y las pantallas simultáneamente
              const rawConn = req.body.max_connections !== undefined ? req.body.max_connections : (extraParams.max_connections !== undefined ? extraParams.max_connections : req.body.connections);
              const finalNotes = req.body.reseller_notes !== undefined ? req.body.reseller_notes : extraParams.reseller_notes;
              const hasPropsToChange = (rawConn !== undefined && Number(rawConn) > 1) || (finalNotes && String(finalNotes).trim() !== "");

              if (hasPropsToChange) {
                // Usar edit_line que aplica extensión y actualiza las propiedades en una sola llamada
                cleanPayload.action = "edit_line";
                const finalId = resolvedId !== undefined ? resolvedId : (id !== undefined ? id : (req.body.id !== undefined ? req.body.id : extraParams.id));
                if (finalId !== undefined) cleanPayload.id = Number(finalId);
                const rawPkg = reqPackage !== undefined ? reqPackage : (packageId !== undefined ? packageId : (extraParams.package !== undefined ? extraParams.package : req.body.package));
                cleanPayload.package = Number(rawPkg || finalPkg);
                if (rawConn !== undefined && Number(rawConn) > 0) cleanPayload.max_connections = Number(rawConn);
                if (finalNotes && String(finalNotes).trim() !== "") cleanPayload.reseller_notes = String(finalNotes).trim();
              } else {
                // extend_line canónico estándar (solo id y package)
                const finalId = resolvedId !== undefined ? resolvedId : (id !== undefined ? id : (req.body.id !== undefined ? req.body.id : extraParams.id));
                if (finalId !== undefined) cleanPayload.id = Number(finalId);

                const rawPkg = reqPackage !== undefined ? reqPackage : (packageId !== undefined ? packageId : (extraParams.package !== undefined ? extraParams.package : req.body.package));
                cleanPayload.package = Number(rawPkg || finalPkg);
              }

            } else if (finalAction === "delete_line" || finalAction === "disable_line" || finalAction === "enable_line") {
              // Obligatorio: id
              const finalId = resolvedId !== undefined ? resolvedId : (id !== undefined ? id : (req.body.id !== undefined ? req.body.id : extraParams.id));
              if (finalId !== undefined) cleanPayload.id = Number(finalId);

            } else if (finalAction === "get_line") {
              // Obligatorio: id
              const finalId = resolvedId !== undefined ? resolvedId : (id !== undefined ? id : (req.body.id !== undefined ? req.body.id : extraParams.id));
              if (finalId !== undefined) cleanPayload.id = Number(finalId);

            } else if (finalAction === "get_lines") {
              // Parámetros de listado opcionales
              if (req.body.start !== undefined) cleanPayload.start = Number(req.body.start);
              if (req.body.limit !== undefined) cleanPayload.limit = Number(req.body.limit);
              if (req.body.filter !== undefined) cleanPayload.filter = Number(req.body.filter);
              if (req.body["search[value]"] !== undefined) cleanPayload["search[value]"] = String(req.body["search[value]"]);
              if (extraParams.start !== undefined) cleanPayload.start = Number(extraParams.start);
              if (extraParams.limit !== undefined) cleanPayload.limit = Number(extraParams.limit);
              if (extraParams.filter !== undefined) cleanPayload.filter = Number(extraParams.filter);
              if (extraParams["search[value]"] !== undefined) cleanPayload["search[value]"] = String(extraParams["search[value]"]);
            }

            payload = cleanPayload;
          } else {
            if (action === "test") {
              payload = { action: "packages" };
            } else if (action === "create_demo" || action === "create_line" || action === "create") {
              const isTrial = action === "create_demo" ? 1 : 0;
              const fullName = (extraParams.nombre_completo || "").trim();
              const customNotes = (extraParams.reseller_notes || "").trim().replace(/clubTivi/gi, "XTV");
              const noteText = fullName ? `${fullName} (XTV)${customNotes ? " - " + customNotes : ""}` : (customNotes ? `${customNotes} (XTV)` : (isTrial ? "Demo desde XTV" : "Línea comercial desde XTV"));
              const chosenConnections = Number(extraParams.max_connections || 1);
              payload = {
                action: "user",
                sub: "create",
                package: Number(finalPkg),
                package_id: Number(finalPkg),
                is_demo: isTrial,
                is_trial: isTrial,
                notes: noteText,
                max_connections: chosenConnections,
                connections: chosenConnections
              };
            } else {
              payload = {
                action,
                username,
                password,
                package_id: packageId,
                ...extraParams
              };
            }
          }

          const response = await tryRequest(attempt.baseUrl, attempt.endpoint, payload, attempt.format.isGet, attempt.format.isForm);
          
          if (response.status === 429) {
            console.warn(`[XUI Proxy] ¡Advertencia! El servidor en ${attempt.baseUrl} devolvió limitación HTTP 429.`);
            lastError = "HTTP 429: Demasiadas peticiones. El servidor XUI.ONE ha limitado temporalmente las peticiones de este origen.";
            continue;
          }

          const responseText = await response.text().catch(() => "");

          if (response.ok) {
            try {
              let parsed: any;
              try {
                parsed = JSON.parse(responseText);
              } catch (e) {
                if (action === "test" && responseText.length > 0 && responseText.length < 500) {
                  finalSuccess = true;
                  rawResponse = { success: true, text: responseText };
                  successBaseUrl = attempt.baseUrl;
                  break;
                }
                throw e;
              }

              const isGenericAction = action !== "test" && action !== "create_demo" && action !== "create" && action !== "create_line";
              if (isGenericAction) {
                // Para llamadas genéricas, cualquier respuesta parseada correctamente (incluyendo null o [] si el panel está vacío) es exitosa
                finalSuccess = true;
                rawResponse = parsed;
                successBaseUrl = attempt.baseUrl;
                break;
              } else if (action === "test") {
                if (parsed && !parsed.error && parsed.success !== false) {
                  finalSuccess = true;
                  rawResponse = parsed;
                  successBaseUrl = attempt.baseUrl;
                  console.log(`[XUI Proxy] ¡ÉXITO en testeo de conexión! Enlazado a: ${attempt.baseUrl}${attempt.endpoint}`);
                  break;
                } else if (parsed === null || (parsed && parsed.status === "STATUS_SUCCESS")) {
                  finalSuccess = true;
                  rawResponse = parsed || { status: "STATUS_SUCCESS" };
                  successBaseUrl = attempt.baseUrl;
                  break;
                } else {
                  lastError = parsed.error || parsed.message || JSON.stringify(parsed);
                }
              } else {
                // Creación de cuenta o demo exitosa
                const hasExplicitError = parsed && (
                  parsed.error || 
                  parsed.status === "error" || 
                  parsed.status === "failed" || 
                  parsed.status === "450" || 
                  parsed.status === 450
                );
                
                if (parsed && !hasExplicitError) {
                  finalSuccess = true;
                  rawResponse = parsed;
                  successBaseUrl = attempt.baseUrl;
                  console.log(`[XUI Proxy] ¡ÉXITO en creación de cuenta! Creado en: ${attempt.baseUrl}${attempt.endpoint}`);
                  break;
                } else {
                  lastError = parsed ? (parsed.error || parsed.message || JSON.stringify(parsed)) : "Respuesta vacía o error";
                }
              }
            } catch (e) {
              lastError = `Respuesta no parseable como JSON: ${responseText.substring(0, 100)}`;
            }
          } else {
            lastError = `HTTP ${response.status}: ${responseText.substring(0, 100) || response.statusText}`;
          }

          // Fallback rápido si la creación falló (por si la API es antigua o tiene otra especificación)
          if (action === "create_demo" && !finalSuccess) {
            const fallbackFullName = (extraParams.nombre_completo || "").trim();
            const fallbackCustomNotes = (extraParams.reseller_notes || "").trim().replace(/clubTivi/gi, "XTV");
            const fallbackNoteText = fallbackFullName ? `${fallbackFullName} (XTV)${fallbackCustomNotes ? " - " + fallbackCustomNotes : ""}` : (fallbackCustomNotes ? `${fallbackCustomNotes} (XTV)` : "Demo desde XTV");

            const fallbackPayload: any = isResellerEndpoint ? {
              action: "create",
              api_key: xuiToken,
              username: finalUser,
              password: finalPass,
              package: Number(finalPkg),
              package_id: Number(finalPkg),
              is_demo: 1,
              is_trial: 1,
              notes: fallbackNoteText
            } : {
              action: "create",
              username: finalUser,
              password: finalPass,
              package: Number(finalPkg),
              package_id: Number(finalPkg),
              is_demo: 1,
              is_trial: 1,
              notes: fallbackNoteText
            };

            const fbResponse = await tryRequest(attempt.baseUrl, attempt.endpoint, fallbackPayload, attempt.format.isGet, attempt.format.isForm);
            
            if (fbResponse.status === 429) {
              lastError = "HTTP 429: Demasiadas peticiones. El servidor XUI.ONE ha limitado temporalmente las peticiones de este origen.";
              continue;
            }

            const fbText = await fbResponse.text().catch(() => "");
            if (fbResponse.ok) {
              try {
                const parsed = JSON.parse(fbText);
                if (parsed && (parsed.success === true || parsed.success === "true" || parsed.id || parsed.username)) {
                  finalSuccess = true;
                  rawResponse = parsed;
                  successBaseUrl = attempt.baseUrl;
                  console.log(`[XUI Proxy] ¡ÉXITO en creación alternativa! Creado en: ${attempt.baseUrl}${attempt.endpoint}`);
                  break;
                } else {
                  lastError = parsed.error || parsed.message || JSON.stringify(parsed);
                }
              } catch (e) {
                lastError = `Fallback no-JSON: ${fbText.substring(0, 100)}`;
              }
            } else {
              lastError = `Fallback HTTP ${fbResponse.status}: ${fbText.substring(0, 100)}`;
            }
          }

        } catch (innerErr: any) {
          lastError = innerErr.message || String(innerErr);
          if (innerErr.cause) {
            const causeStr = innerErr.cause.message || innerErr.cause.code || String(innerErr.cause);
            lastError += ` (${causeStr})`;
          }
        }
      }

      if (!finalSuccess) {
        throw new Error(lastError || "Todos los candidatos de enlace y rutas de API XUI retornaron fallo.");
      }

      const activeUsedBase = successBaseUrl || baseUrl;
      
      let playlistBase = activeUsedBase;
      try {
        const origUrlObj = new URL(baseUrl);
        const succUrlObj = new URL(activeUsedBase);
        if (origUrlObj.port && !succUrlObj.port) {
          playlistBase = `${succUrlObj.protocol}//${succUrlObj.hostname}:${origUrlObj.port}`;
        }
      } catch (e) {}

      // Extraer credenciales reales asignadas del panel (por si reescribió el usuario/contraseña solicitados)
      let resolvedUser = finalUser;
      let resolvedPass = finalPass;
      if (rawResponse) {
        // En Xtream Codes / XUI.ONE el usuario creado suele estar en .data o a nivel de raíz
        const possibleData = rawResponse.data || {};
        if (possibleData.username) {
          resolvedUser = possibleData.username;
        } else if (rawResponse.username) {
          resolvedUser = rawResponse.username;
        }

        if (possibleData.password) {
          resolvedPass = possibleData.password;
        } else if (rawResponse.password) {
          resolvedPass = rawResponse.password;
        }
      }

      const playlistUrl = `${playlistBase}/get.php?username=${resolvedUser}&password=${resolvedPass}&output=ts`;

      if (action === "test") {
        return res.json({
          success: true,
          message: "¡Conectado exitosamente con tu panel XC Reseller!",
          detected_url: activeUsedBase,
          data: rawResponse
        });
      }

      const combinedWarnings = [
        ...(resellerWarnings || []),
        ...(Array.isArray(rawResponse?.warnings) ? rawResponse.warnings : [])
      ];

      if (action !== "create_demo" && action !== "create" && action !== "create_line") {
        return res.json({
          success: true,
          data: rawResponse,
          raw_response: rawResponse,
          warnings: combinedWarnings.length > 0 ? combinedWarnings : undefined,
          detected_url: activeUsedBase
        });
      }

      return res.json({
        success: true,
        username: resolvedUser,
        password: resolvedPass,
        playlist_url: playlistUrl,
        raw_response: rawResponse,
        warnings: combinedWarnings.length > 0 ? combinedWarnings : undefined,
        detected_url: activeUsedBase
      });

    } catch (error: any) {
      console.error("XUI.ONE Proxy Error:", error);

      // Función para traducir detalladamente los códigos y mensajes de error técnico de Node.js / Fetch
      const translateErrorToSpanish = (err: any): string => {
        const msg = String(err?.message || err || "").toLowerCase();
        
        if (msg.includes("eai_again")) {
          return "Fallo de Resolución DNS Temporal (getaddrinfo EAI_AGAIN).\n" +
                 "Explicación simple: El dominio ingresado en tu configuración del panel (ej: 'mv-pl') no pudo ser contactado ni resuelto en internet.\n" +
                 "Esto significa que la dirección está mal escrita o tiene una extensión interna.";
        }
        if (msg.includes("econnrefused")) {
          return "Conexión Rechazada por el Panel (ECONNREFUSED).\n" +
                 "Explicación simple: El host o IP ingresados existen y se alcanzaron correctamente, pero el puerto configurado (ej: 2095) se encuentra cerrado o está rechazando las peticiones externas.";
        }
        if (msg.includes("etimedout") || msg.includes("timeout")) {
          return "Tiempo de Espera del Servidor Agotado (ETIMEDOUT).\n" +
                 "Explicación simple: Tu panel IPTV tardó demasiado tiempo en responder (límite superado de 4 segundos).";
        }
        if (msg.includes("enotfound")) {
          return "Dominio No Encontrado en Internet (ENOTFOUND).\n" +
                 "Explicación simple: El dominio del panel que configuraste no existe. No está registrado o se dio de baja.";
        }
        if (msg.includes("fetch failed")) {
          return "Fallo de Enlace General (fetch failed).\n" +
                 "Explicación simple: Hubo una falla física de red al intentar despachar la petición de enlace desde tu clubTivi hacia el panel remoto.";
        }
        return `Detalle del Código Devuelto:\n${err?.message || err}`;
      };

      const translatedMessage = translateErrorToSpanish(error);

      // Si no es un host simulado de contingencia explícito, devolver el error real con success: false. No simular éxitos falsos.
      const isSimulatedHost = (baseUrl.includes("mv-pl") && !baseUrl.includes("mv-play.uk")) || baseUrl.includes("fake-panel");
      if (!isSimulatedHost) {
        return res.json({
          success: false,
          isSimulated: false,
          error: error.message || "Proxy Connection Error",
          error_explanation_es: translatedMessage,
          message: "Error de Conexión Real con tu Panel: " + translatedMessage,
          detected_url: baseUrl,
          raw_response: {
            success: false,
            error: error.message || "Proxy Connection Error",
            explanation: translatedMessage,
            candidate_attempts_failed: true
          }
        });
      }

      // Ofrecemos datos de contingencia simulados para pruebas visuales fluidas en caso de panel inalcanzable (solo para hosts de prueba)
      const mockUser = username || "demo_" + Math.random().toString(36).substring(2, 8);
      const mockPass = password || Math.random().toString(36).substring(2, 9);
      const playlistUrl = `${baseUrl}/get.php?username=${mockUser}&password=${mockPass}&output=ts`;

      // Retornos inteligentes y completos
      if (action === "test") {
        return res.json({
          success: true,
          isSimulated: true,
          error: error.message || "Proxy Error",
          error_explanation_es: translatedMessage,
          message: "Modo Simulación de Contingencia Activa: " + translatedMessage,
          detected_url: baseUrl,
          data: {
            success: true,
            credits: 250,
            total_users: 15,
            bouquet: "[2,21,22,1,3,27,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,23,24,26,25,31,30,33,28,34]"
          }
        });
      }

      if (action === "get_lines") {
        return res.json({
          success: true,
          isSimulated: true,
          detected_url: baseUrl,
          data: [
            {
              id: 101,
              username: "santilopez",
              password: "password123",
              max_connections: 2,
              is_trial: 0,
              creado_en: "2026-06-18T20:00:00.000Z",
              fecha_exp: 1782234000,
              status: 1,
              reseller_notes: "Línea comercial Premium IPTV."
            },
            {
              id: 102,
              username: "lucasmorales",
              password: "pass77_demo",
              max_connections: 3,
              is_trial: 1,
              creado_en: "2026-06-19T01:00:00.000Z",
              fecha_exp: Math.floor((Date.now() + 4 * 60 * 60 * 1000) / 1000),
              status: 1,
              reseller_notes: "Demo activa 4h de prueba."
            }
          ]
        });
      }

      if (action === "create_demo" || action === "create_line" || action === "create") {
        return res.json({
          success: true,
          isSimulated: true,
          username: mockUser,
          password: mockPass,
          playlist_url: playlistUrl,
          detected_url: baseUrl,
          raw_response: {
            success: true,
            data: {
              username: mockUser,
              password: mockPass,
              id: 501,
              expire_date: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
              max_connections: 3,
              is_trial: 1,
              active: 1,
              credits: 249,
              bouquet: "[2,21,22,1,3,27,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,23,24,26,25,31,30,33,28,34]"
            }
          }
        });
      }

      return res.json({
        success: true,
        isSimulated: true,
        error: error.message || "Proxy Error",
        error_explanation_es: translatedMessage,
        message: "Operación ejecutada en modo contingencia: " + translatedMessage
      });
    }
  });

  // Endpoints de Autenticación Centralizado para Aplicaciones Externas de clubTivi
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "El usuario (login) y la contraseña son obligatorios." 
      });
    }

    try {
      const userLower = username.trim().toLowerCase();
      const pass = password.trim();

      // Buscamos tanto el login plano como con el sufijo que hayamos estandarizado
      let possibleEmails = [userLower];
      if (!userLower.includes('@')) {
        possibleEmails.push(`${userLower}@g3d-panel.com`);
        possibleEmails.push(`${userLower}@xtv.com`);
      }

      // 1. Consultar el perfil
      const { data: userProfile, error } = await serverSupabase
        .from('perfiles_locales')
        .select('*')
        .in('email', possibleEmails)
        .eq('password_hash', pass)
        .maybeSingle();

      if (error) throw error;

      if (!userProfile) {
        return res.status(401).json({
          success: false,
          error: "Usuario o contraseña inválidos."
        });
      }

      // Validar si la cuenta está deshabilitada (ej: estado === 'deshabilitado' o 'suspendido')
      if (userProfile.estado === 'deshabilitado' || userProfile.estado === 'suspendido') {
        return res.status(403).json({
          success: false,
          error: "Esta cuenta está suspendida por la administración de clubTivi. Contacta al soporte técnico."
        });
      }

      // 2. Traer el rol del usuario asignado dinámicamente si existe g3d_usuarios_roles_asignacion
      let userRole = userProfile.rol || 'IPTV CLIENTES';
      try {
        const { data: rAsignacion } = await serverSupabase
          .from('g3d_usuarios_roles_asignacion')
          .select('rol_id')
          .eq('usuario_id', userProfile.id)
          .maybeSingle();
        
        if (rAsignacion?.rol_id) {
          userRole = rAsignacion.rol_id;
        }
      } catch (e) {
        // Fallback al rol nativo del perfil
      }

      // 3. Traer los ajustes globales de clubTivi (para proveer la url e imagen automáticamente)
      let systemConfig: any = {};
      try {
        const { data: configData } = await serverSupabase
          .from('configuracion_sistema')
          .select('datos')
          .eq('id', '1')
          .maybeSingle();
        systemConfig = configData?.datos || {};
      } catch (e) {}

      // Si todo está bien, retornamos el perfil, su rol y credenciales de acceso automatizadas
      res.json({
        success: true,
        message: "¡Sesión iniciada correctamente!",
        usuario: {
          id: userProfile.id,
          login: userProfile.email, // Su nombre de usuario original
          nombre: userProfile.nombre || userProfile.email.split('@')[0],
          rol: userRole,
          celular: userProfile.telefono_contacto || "",
          logo_url: userProfile.logo_url || "",
          negocio_nombre: userProfile.nombre_negocio || ""
        },
        config_clubtivi: {
          iptv_url: systemConfig.iptv_url || "",
          banner_url: systemConfig.banner_url || "",
          latest_version: systemConfig.latest_version || "1.0.0",
          apk_url: systemConfig.apk_url || ""
        }
      });

    } catch (e: any) {
      console.error("Error en API de autenticación:", e);
      res.status(500).json({
        success: false,
        error: "Ocurrió un error inesperado al procesar la autenticación de la cuenta.",
        details: e.message || String(e)
      });
    }
  });

  // Lazy Initializer de Gemini
  let aiClient: any = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("La clave GEMINI_API_KEY no está configurada en las variables de entorno de este servidor.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Endpoint para analizar y estructurar prompts usando la IA de Gemini
  app.post("/api/gemini/analyze-prompt", async (req, res) => {
    const { promptText } = req.body;

    if (!promptText || !promptText.trim()) {
      return res.status(400).json({
        success: false,
        error: "El texto del prompt es obligatorio."
      });
    }

    try {
      const ai = getGeminiClient();

      const systemInstruction = `Eres un asistente experto en ingeniería de prompts para modelos de generación de imágenes (como Midjourney v6, DALL-E 3, Leonardo.ai).
Tu tarea consiste en:
1. Analizar el prompt provisto por el usuario (el cual puede estar en inglés o español).
2. Detectar todas las variables clave personalizables (por ejemplo: nombres de marca, títulos, colores de acento, eslóganes, objetos centrales, elementos de diseño).
3. Reemplazar esos elementos variables por marcadores en mayúsculas entre corchetes, ej: [MARCA], [TITULO_PRINCIPAL], [COLOR_ACENTO], [ESLOGAN], [PRODUCTO].
4. Generar un objeto JSON estructurado con la información procesada.

Debes devolver EXACTAMENTE un objeto JSON que coincida con la estructura especificada en el esquema, rellenando con valores reales y comprensibles en español. Las claves en 'defaultValues' y 'variableLabels' deben coincidir de forma exacta con los marcadores colocados dentro de 'templatePrompt' (sin corchetes).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analiza este prompt de imagen y genera una plantilla estructurada con variables entre corchetes:

"${promptText}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Nombre corto de la plantilla (ej: 'Banner de Promoción de Hardware')"
              },
              category: {
                type: Type.STRING,
                description: "Categoría de la plantilla. Debe ser uno de estos exactamente: 'IPTV', 'Tecnología', 'Promocional' o 'Personalizado'."
              },
              description: {
                type: Type.STRING,
                description: "Una breve descripción de lo que genera este banner."
              },
              templatePrompt: {
                type: Type.STRING,
                description: "El prompt original con los elementos variables reemplazados por variables en corchetes [COMO_ESTE]. Retén toda la riqueza visual del prompt original."
              },
              defaultValues: {
                type: Type.OBJECT,
                description: "Objeto que asocia cada nombre de variable (sin corchetes) con su valor original o sugerido."
              },
              variableLabels: {
                type: Type.OBJECT,
                description: "Objeto que asocia cada nombre de variable (sin corchetes) con una etiqueta clara en español explicando qué representa para el usuario."
              }
            },
            required: ["name", "category", "description", "templatePrompt", "defaultValues", "variableLabels"]
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      res.json({
        success: true,
        data: parsedData
      });

    } catch (e: any) {
      console.error("Error al procesar prompt con Gemini:", e);
      let errorMsg = e.message || String(e);
      const isApiKeyError = errorMsg.includes("GEMINI_API_KEY") || 
                           errorMsg.includes("apiKey") || 
                           errorMsg.includes("API key not valid") || 
                           errorMsg.includes("API_KEY_INVALID") ||
                           errorMsg.includes("INVALID_ARGUMENT") ||
                           errorMsg.includes("400");

      if (isApiKeyError) {
        console.log("Activando extractor heurístico local debido a API Key de Gemini ausente o inválida.");
        
        let templatePrompt = promptText;
        const defaultValues: Record<string, string> = {};
        const variableLabels: Record<string, string> = {};
        
        // 1. Detectar variables con corchetes en el prompt original
        const bracketRegex = /\[([A-Z0-9_ÁÉÍÓÚÑa-z]+)\]/g;
        let bracketMatches = promptText.match(bracketRegex);
        
        if (bracketMatches && bracketMatches.length > 0) {
          const uniqueVars = Array.from(new Set(bracketMatches)).map((m: any) => String(m).slice(1, -1));
          uniqueVars.forEach(v => {
            const upperV = v.toUpperCase().replace(/\s+/g, '_');
            templatePrompt = templatePrompt.split(`[${v}]`).join(`[${upperV}]`);
            defaultValues[upperV] = `Valor sugerido de ${v}`;
            variableLabels[upperV] = `Campo ${v.toLowerCase().replace(/_/g, ' ')}`;
          });
        } else {
          // 2. Extracción heurística si no tiene corchetes:
          // A. Textos entre comillas dobles o simples
          const quoteRegex = /"([^"]+)"|'([^']+)'/g;
          let quoteMatches;
          let idx = 1;
          while ((quoteMatches = quoteRegex.exec(promptText)) !== null) {
            const val = quoteMatches[1] || quoteMatches[2];
            if (val && val.trim().length > 2) {
              const varName = `TEXTO_${idx}`;
              templatePrompt = templatePrompt.split(quoteMatches[0]).join(`[${varName}]`);
              defaultValues[varName] = val;
              variableLabels[varName] = `Texto promocional destacado ${idx}`;
              idx++;
            }
          }

          // B. Colores más comunes
          const colors = ['azul', 'rojo', 'verde', 'amarillo', 'dorado', 'negro', 'blanco', 'naranja', 'violeta', 'celeste', 'plateado', 'gris'];
          let colorIdx = 1;
          colors.forEach(color => {
            const regex = new RegExp(`\\b${color}\\b`, 'gi');
            if (regex.test(templatePrompt)) {
              const varName = `COLOR_${colorIdx}`;
              templatePrompt = templatePrompt.replace(regex, `[${varName}]`);
              defaultValues[varName] = color;
              variableLabels[varName] = `Color destacado ${colorIdx}`;
              colorIdx++;
            }
          });

          // C. Fallback total si no se extrajo nada para que la plantilla sea dinámica
          if (Object.keys(defaultValues).length === 0) {
            templatePrompt = `[DISENO_FONDO] para promocionar mi marca "[MARCA]". Frase destacada: "[FRASE]". Detalle: ${promptText}`;
            defaultValues['DISENO_FONDO'] = 'Fondo oscuro cinematográfico de alta definición';
            defaultValues['MARCA'] = 'clubTivi';
            defaultValues['FRASE'] = 'TODO EL ENTRETENIMIENTO EN UN SOLO LUGAR';
            variableLabels['DISENO_FONDO'] = 'Estilo y colores del fondo';
            variableLabels['MARCA'] = 'Nombre de tu negocio o marca';
            variableLabels['FRASE'] = 'Frase de venta de gran impacto';
          }
        }

        // Determinar un nombre de plantilla basado en el prompt
        let genName = "Plantilla de Banner con IA";
        if (promptText.toLowerCase().includes("iptv")) {
          genName = "Banner IPTV Personalizado";
        } else if (promptText.toLowerCase().includes("tecnologia") || promptText.toLowerCase().includes("3d") || promptText.toLowerCase().includes("printer")) {
          genName = "Banner Tecnológico de Precisión";
        } else if (promptText.toLowerCase().includes("promo") || promptText.toLowerCase().includes("descuento") || promptText.toLowerCase().includes("sale")) {
          genName = "Banner de Descuentos Especiales";
        }

        const fallbackData = {
          name: genName,
          category: "Personalizado",
          description: "Estructurado con el analizador inteligente local sin clave Gemini.",
          templatePrompt,
          defaultValues,
          variableLabels
        };

        return res.json({
          success: true,
          data: fallbackData,
          isFallback: true
        });
      }

      let errorMsgFinal = "Ocurrió un error al procesar la plantilla con Inteligencia Artificial.";
      res.status(500).json({
        success: false,
        error: errorMsgFinal,
        details: errorMsg
      });
    }
  });

  // Endpoint para mejorar descripciones de productos con IA usando Gemini
  app.post("/api/gemini/improve-description", async (req, res) => {
    const { productName, description } = req.body;

    const baseText = (description || "").trim();
    const nameText = (productName || "").trim();

    if (!baseText && !nameText) {
      return res.status(400).json({
        success: false,
        error: "Debes proporcionar al menos el nombre del producto o una descripción base."
      });
    }

    try {
      const ai = getGeminiClient();

      const systemInstruction = `Eres un redactor creativo y copywriter experto para e-commerce y catálogos de productos premium.
Tu tarea es reescribir, pulir y mejorar de forma estratégica y profesional la descripción de un producto o ítem para que sea sumamente atractiva, prolija, vendedora y clara.
La descripción mejorada se mostrará de forma general para el ítem, incluyendo sus variaciones. Debe tener un tono profesional, cercano, de alta calidad y estar redactada en excelente español neutro.

Reglas importantes:
1. Mantén la descripción directa, limpia y concisa (máximo 2 a 3 líneas o un párrafo corto elegante, y opcionalmente viñetas si hay especificaciones importantes).
2. Si la descripción original es muy breve (ej. "jarra chop personalizable"), amplíala creativamente destacando sus posibles usos o calidad (ej. "Jarra Chop personalizable de alta resistencia, ideal para regalos especiales, eventos o uso diario. Diseñada con un acabado impecable que resalta cada detalle.").
3. No uses lenguaje robótico ni exageraciones comerciales inverosímiles (no utilices palabras vacías como "espectacular", "revolucionario", "sin precedentes"). Usa una redacción elegante y persuasiva.
4. Devuelve ÚNICAMENTE el texto de la descripción mejorada, sin explicaciones, sin introducciones ni marcas de formato adicionales.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Nombre del producto: "${nameText}"
Descripción actual o base: "${baseText}"

Mejora estratégicamente esta descripción de forma prolija para la tienda/catálogo general y sus variaciones:`,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const improvedText = (response.text || "").trim();
      res.json({
        success: true,
        improvedText
      });

    } catch (e: any) {
      console.error("Error al mejorar descripción con Gemini:", e);
      let errorMsg = e.message || String(e);
      // Fallback local en caso de error de API Key u otro
      let fallbackText = baseText || `Excelente ${nameText} de alta calidad, diseñado con los mejores materiales para garantizar durabilidad y un acabado profesional. Ideal para uso diario o personalización exclusiva.`;
      if (baseText && baseText.length > 5) {
        fallbackText = `${baseText} — Producto premium de excelente durabilidad y acabado artesanal, optimizado para garantizar la máxima satisfacción del cliente en todas sus variantes.`;
      }
      res.json({
        success: true,
        improvedText: fallbackText,
        isFallback: true
      });
    }
  });

  // NUEVO: GET /api/v1/app-config?id=[CLIENT_APP_ID] (Público de Solo Lectura para Clones de Android TV)
  app.get("/api/v1/app-config", async (req, res) => {
    try {
      const clientId = req.query.id;
      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: "Falta el parámetro id en la consulta (ej. ?id=cliente_a)"
        });
      }

      const idStr = String(clientId).trim().toLowerCase();

      // Consultar la tabla app_clones en Supabase
      const { data, error } = await serverSupabase
        .from('app_clones')
        .select('*')
        .eq('id_app', idStr)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Fallback ilustrativo si solicitan 'cliente_a' y no hay base de datos configurada para evitar errores iniciales de testeo
        if (idStr === "cliente_a") {
          return res.json({
            success: true,
            client_id: "cliente_a",
            app_name: "Mi TV Premium",
            logo_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200",
            banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
            notice_message: "¡Bienvenidos! Disfruta de la mejor programación.",
            latest_version: "1.0.1",
            apk_download_url: "https://github.com/usuario/repositorio/releases/download/v1.0.1/app.apk"
          });
        }

        return res.status(404).json({
          success: false,
          error: `No se encontró configuración para el ID de app: ${idStr}`
        });
      }

      res.json({
        success: true,
        client_id: data.id_app,
        app_name: data.nombre_comercial,
        logo_url: data.logo_remoto || "",
        banner_url: data.banner_publicitario || "",
        notice_message: data.mensaje_aviso || "",
        latest_version: data.version_actual || "1.0.0",
        apk_download_url: data.url_apk_github || ""
      });

    } catch (err: any) {
      console.error("Error recuperando app_clones:", err);
      
      // Fallback amigable para pruebas rápidas en localhost
      const idStr = String(req.query.id || "").trim().toLowerCase();
      if (idStr === "cliente_a") {
        return res.json({
          success: true,
          client_id: "cliente_a",
          app_name: "Mi TV Premium",
          logo_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200",
          banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
          notice_message: "¡Bienvenidos! Disfruta de la mejor programación.",
          latest_version: "1.0.1",
          apk_download_url: "https://github.com/usuario/repositorio/releases/download/v1.0.1/app.apk"
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno al recuperar la configuración de la app.",
        details: err.message || String(err)
      });
    }
  });

  // NUEVO: GET /api/drive/download (Proxy seguro de descarga de Google Drive para evitar CORS)
  app.get("/api/drive/download", async (req, res) => {
    try {
      const { fileId } = req.query;
      const authHeader = req.headers.authorization;

      if (!fileId) {
        return res.status(400).json({ success: false, error: "Falta el parámetro 'fileId'." });
      }

      // 1. Intentar descargar usando el Token del cliente si se provee
      let fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const headers: Record<string, string> = {};
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      const response = await fetch(fetchUrl, { headers });

      if (!response.ok) {
        // 2. Si falló (p.ej. token vencido o es un archivo público de drive), intentar el método de descarga directa pública
        const fallbackUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (!fallbackRes.ok) {
          return res.status(response.status).json({
            success: false,
            error: `Error al descargar de Google Drive (Código: ${response.status}). Asegúrate de que el archivo existe y tiene los permisos adecuados.`
          });
        }
        
        // Retornar la respuesta del fallback
        const buffer = await fallbackRes.arrayBuffer();
        res.setHeader("Content-Type", fallbackRes.headers.get("Content-Type") || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="model_${fileId}.3mf"`);
        return res.send(Buffer.from(buffer));
      }

      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="model_${fileId}.3mf"`);
      res.send(Buffer.from(buffer));

    } catch (err: any) {
      console.error("Error en proxy de Google Drive:", err);
      res.status(500).json({ success: false, error: "Error interno al conectar con Google Drive.", details: err.message });
    }
  });

  // Integración de Vite / Servidor de producción
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // En Express v4 se utiliza '*' para el catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[clubTivi Server] Corriendo exitosamente en http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
