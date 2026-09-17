import { supabase } from './src/lib/supabase';

async function checkColumns() {
  const { data: prod, error: err1 } = await supabase.from('g3d_productos').select('*').limit(1);
  if (err1) {
    console.error('Error g3d_productos:', err1);
  } else {
    console.log('Columns of g3d_productos:', Object.keys(prod?.[0] || {}));
  }

  const { data: v, error: err2 } = await supabase.from('g3d_producto_variantes').select('*').limit(1);
  if (err2) {
    console.error('Error g3d_producto_variantes:', err2);
  } else {
    console.log('Columns of g3d_producto_variantes:', Object.keys(v?.[0] || {}));
  }
}

checkColumns();
