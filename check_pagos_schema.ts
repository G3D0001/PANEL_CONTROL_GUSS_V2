import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
    console.log("Supabase URL:", url);
    // 1. Obtener 3 registros de pedidos reales
    const { data: pedidos, error: errPedidos } = await supabase
        .from('pedidos')
        .select('id, codigo_pedido, cliente_nombre_temporal, monto_total')
        .limit(3);
        
    if (errPedidos) {
        console.error("Error al obtener pedidos:", errPedidos);
        return;
    }
    
    console.log("Pedidos reales encontrados:", pedidos);

    if (pedidos && pedidos.length > 0) {
        const realOrder = pedidos[0];
        console.log(`\nProbando inserción de pago para el pedido real: ID=${realOrder.id}, Codigo=${realOrder.codigo_pedido}`);
        
        // Probamos insertar usando el codigo_pedido (ej: "G3D-08304922")
        const testPaymentWithCode = {
            id_pago: `TEST-CODE-${Date.now()}`,
            id_pedido: realOrder.codigo_pedido, 
            monto: 1,
            tipo_pago: 'Transferencia',
            observaciones: 'Prueba de inserción con codigo_pedido',
            fecha: new Date().toISOString()
        };
        
        const { error: errorWithCode } = await supabase.from('pagos').insert([testPaymentWithCode]);
        if (errorWithCode) {
            console.error("❌ Falló insertando con codigo_pedido:", errorWithCode);
        } else {
            console.log("✅ Éxito insertando con codigo_pedido!");
            await supabase.from('pagos').delete().eq('id_pago', testPaymentWithCode.id_pago);
        }

        // Probamos insertar usando el ID (UUID)
        const testPaymentWithId = {
            id_pago: `TEST-ID-${Date.now()}`,
            id_pedido: realOrder.id, // UUID
            monto: 1,
            tipo_pago: 'Transferencia',
            observaciones: 'Prueba de inserción con id UUID',
            fecha: new Date().toISOString()
        };
        
        const { error: errorWithId } = await supabase.from('pagos').insert([testPaymentWithId]);
        if (errorWithId) {
            console.error("❌ Falló insertando con id UUID:", errorWithId);
        } else {
            console.log("✅ Éxito insertando con id UUID!");
            await supabase.from('pagos').delete().eq('id_pago', testPaymentWithId.id_pago);
        }
    }
}
run();
