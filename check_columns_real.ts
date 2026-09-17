import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('No keys found in process.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // Primero creamos un producto de prueba para poder insertar una variante
  const { data: prod, error: errProd } = await supabase.from('g3d_productos').insert({
    nombre: 'PRODUCTO PRUEBA BORRAR',
    precio_base: 100,
    categoria_texto: 'Prueba'
  }).select().single();

  if (errProd) {
    console.error('Error creando producto:', errProd);
    return;
  }

  console.log('Creado producto con ID:', prod.id);

  // Intentamos insertar una variante en g3d_producto_variantes
  const { data: varResult, error: errVar } = await supabase.from('g3d_producto_variantes').insert({
    producto_id: prod.id,
    combinacion: { color: 'Prueba' },
    precio: 100,
    stock: 0,
    minimo_alerta: 0
  }).select().single();

  if (errVar) {
    console.error('Error insertando variante:', errVar);
  } else {
    console.log('Columns of g3d_producto_variantes:', Object.keys(varResult));
  }

  // Ahora borramos el producto de prueba (que borrará la variante en cascada)
  const { error: errDel } = await supabase.from('g3d_productos').delete().eq('id', prod.id);
  if (errDel) {
    console.error('Error borrando producto de prueba:', errDel);
  } else {
    console.log('Borrado producto de prueba con éxito.');
  }
}

check();
