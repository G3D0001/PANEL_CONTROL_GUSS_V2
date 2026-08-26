/**
 * GOOGLE APPS SCRIPT - BACKEND PARA G3D SYSTEM
 * Instrucciones: 
 * 1. Crea un Google Sheet con las hojas "PEDIDOS" y "PAGOS".
 * 2. En el menú Extensiones > Apps Script, pega este código.
 * 3. Implementa como "Aplicación Web" y otorga permisos.
 * 4. Copia la URL generada en tu archivo .env como VITE_GAS_URL.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  PEDIDOS: "PEDIDOS",
  PAGOS: "PAGOS"
};

/**
 * Maneja las peticiones GET (Lectura y KPIs)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === "getDashboard") {
      return jsonResponse(getDashboardData());
    }
    if (action === "getOrders") {
      return jsonResponse(getOrders());
    }
    if (action === "getOrderDetails") {
      return jsonResponse(getOrderDetails(e.parameter.id));
    }
    
    return jsonResponse({ error: "Acción no válida" });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

/**
 * Maneja las peticiones POST (Escritura y Automatización)
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  try {
    if (action === "createOrder") {
      return jsonResponse(createOrder(data.payload, data.user));
    }
    if (action === "addPayment") {
      return jsonResponse(addPayment(data.payload));
    }
    if (action === "appendDescription") {
      return jsonResponse(appendDescription(data.payload));
    }
    if (action === "updateOrderStatus") {
      return jsonResponse(updateOrderStatus(data.payload));
    }
    
    return jsonResponse({ error: "Acción no válida" });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// --- FUNCIONES DE LECTURA ---

function getOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PEDIDOS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  // Auto-archivado antes de retornar
  checkAutoArchive(sheet, data, headers);
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  }).filter(order => order.OCULTO !== "SI");
}

function getDashboardData() {
  const orders = getOrders();
  const kpis = {
    "PRESUPUESTO": 0,
    "FALTA DISEÑAR": 0,
    "DISEÑADO": 0,
    "EN FABRICACION": 0,
    "PENDIENTE ENTREGA": 0
  };
  
  let totalSaldo = 0;
  let debtorsCount = 0;
  let seenDebtors = new Set();

  orders.forEach(order => {
    if (order.ARCHIVADO !== "SI") {
      const status = order.ESTADO_PEDIDO.toUpperCase();
      if (kpis.hasOwnProperty(status)) kpis[status]++;
      
      const saldo = parseFloat(order.SALDO) || 0;
      if (saldo > 0) {
        totalSaldo += saldo;
        if (!seenDebtors.has(order.CLIENTE_NOMBRE)) {
          debtorsCount++;
          seenDebtors.add(order.CLIENTE_NOMBRE);
        }
      }
    }
  });

  return {
    kpis,
    totalSaldo,
    debtorsCount,
    totalOrders: orders.length
  };
}

// --- FUNCIONES DE ESCRITURA ---

function createOrder(payload, user) {
  if (!payload.CLIENTE_NOMBRE) throw new Error("CLIENTE_NOMBRE es obligatorio");
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PEDIDOS);
  
  // ID_PEDIDO: G3D- + Timestamp (Ej: G3D-16032601)
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "GMT-3", "ddMMHHmm");
  const idPedido = "G3D-" + timestamp;
  
  const fechaCreacion = now;
  
  // VENDEDOR: Lógica Admin vs Usuario
  const vendedor = (user.role === "Administrador" || user.permissions.includes('CAN_EDIT_VENDOR')) 
    ? (payload.VENDEDOR || user.name) 
    : user.name;
  
  // Cálculos Automáticos
  const precioTotal = parseFloat(payload.PRECIO_TOTAL) || 0;
  const totalPagado = parseFloat(payload.TOTAL_PAGADO) || 0;
  const saldo = precioTotal - totalPagado;
  const estadoCuenta = saldo <= 0 ? "PAGADO" : "SALDO PENDIENTE";
  const entregado = payload.ESTADO_PEDIDO === "ENTREGADO" ? "SI" : "NO";
  
  const newRow = [
    idPedido,           // 1. ID_PEDIDO
    fechaCreacion,      // 2. FECHA_CREACION
    vendedor,           // 3. VENDEDOR
    payload.CLIENTE_NOMBRE, // 4. CLIENTE_NOMBRE
    payload.CLIENTE_TELEFONO || "", // 5. CLIENTE_TELEFONO
    payload.CLIENTE_DIRECCION || "", // 6. CLIENTE_DIRECCION
    payload.CLIENTE_EMAIL || "",    // 7. CLIENTE_EMAIL
    payload.DESCRIPCION || "",      // 8. DESCRIPCION
    payload.TIPO_TRABAJO || "",     // 9. TIPO_TRABAJO
    payload.CANTIDAD || 1,          // 10. CANTIDAD
    precioTotal,                    // 11. PRECIO_TOTAL
    totalPagado,                    // 12. TOTAL_PAGADO
    saldo,                          // 13. SALDO
    estadoCuenta,                   // 14. ESTADO_CUENTA
    payload.ESTADO_PEDIDO || "PRESUPUESTO", // 15. ESTADO_PEDIDO
    payload.FECHA_ENTREGA || calculateDeliveryDate(now, 3), // 16. FECHA_ENTREGA
    entregado,                      // 17. ENTREGADO
    "NO",                           // 18. ARCHIVADO
    "NO"                            // 19. OCULTO
  ];
  
  sheet.appendRow(newRow);
  return { success: true, idPedido };
}

function addPayment(payload) {
  const sheetPagos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PAGOS);
  const idPago = "PAG-" + Date.now();
  
  sheetPagos.appendRow([
    idPago,
    payload.ID_PEDIDO,
    new Date(),
    payload.MONTO,
    payload.TIPO_PAGO,
    payload.OBSERVACIONES || ""
  ]);
  
  // Recalcular en PEDIDOS
  updateOrderFinances(payload.ID_PEDIDO);
  return { success: true };
}

function updateOrderFinances(idPedido) {
  const sheetPedidos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PEDIDOS);
  const sheetPagos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PAGOS);
  
  const pedidosData = sheetPedidos.getDataRange().getValues();
  const pagosData = sheetPagos.getDataRange().getValues();
  
  let totalPagado = 0;
  pagosData.forEach(row => {
    if (row[1] === idPedido) totalPagado += parseFloat(row[3]) || 0;
  });
  
  for (let i = 1; i < pedidosData.length; i++) {
    if (pedidosData[i][0] === idPedido) {
      const precioTotal = parseFloat(pedidosData[i][10]) || 0;
      const nuevoSaldo = precioTotal - totalPagado;
      const estadoCuenta = nuevoSaldo <= 0 ? "PAGADO" : "SALDO PENDIENTE";
      
      sheetPedidos.getRange(i + 1, 12).setValue(totalPagado); // TOTAL_PAGADO
      sheetPedidos.getRange(i + 1, 13).setValue(nuevoSaldo);  // SALDO
      sheetPedidos.getRange(i + 1, 14).setValue(estadoCuenta); // ESTADO_CUENTA
      break;
    }
  }
}

function appendDescription(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PEDIDOS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.ID_PEDIDO) {
      const currentDesc = data[i][7];
      const dateStr = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
      const newDesc = currentDesc + (currentDesc ? "\n" : "") + "[" + dateStr + "]: " + payload.NEW_TEXT;
      sheet.getRange(i + 1, 8).setValue(newDesc);
      return { success: true };
    }
  }
  throw new Error("Pedido no encontrado");
}

function updateOrderStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PEDIDOS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.ID_PEDIDO) {
      sheet.getRange(i + 1, 15).setValue(payload.NUEVO_ESTADO);
      
      if (payload.NUEVO_ESTADO === "ENTREGADO") {
        sheet.getRange(i + 1, 16).setValue(new Date()); // FECHA_ENTREGA
        sheet.getRange(i + 1, 17).setValue("SI");       // ENTREGADO
      }
      return { success: true };
    }
  }
}

// --- UTILIDADES ---

function calculateDeliveryDate(startDate, days) {
  let date = new Date(startDate);
  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++; // Omitir Sab (6) y Dom (0)
  }
  return date;
}

function checkAutoArchive(sheet, data, headers) {
  const now = new Date();
  const idIdx = headers.indexOf("ID_PEDIDO");
  const fechaIdx = headers.indexOf("FECHA_CREACION");
  const estadoIdx = headers.indexOf("ESTADO_PEDIDO");
  const archivadoIdx = headers.indexOf("ARCHIVADO");

  data.forEach((row, i) => {
    if (row[estadoIdx] === "PRESUPUESTO" && row[archivadoIdx] !== "SI") {
      const diff = (now - new Date(row[fechaIdx])) / (1000 * 60 * 60 * 24);
      if (diff > 7) {
        sheet.getRange(i + 2, archivadoIdx + 1).setValue("SI");
      }
    }
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
