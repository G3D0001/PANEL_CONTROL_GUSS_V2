import { supabase } from './src/lib/supabase';

async function main() {
  const { data, error } = await supabase.from('categorias').select('id').limit(1);
  console.log('categorias:', { data, error });
}
main();
