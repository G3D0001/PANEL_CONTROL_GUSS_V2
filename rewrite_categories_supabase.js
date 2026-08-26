import fs from 'fs';

let content = fs.readFileSync('src/components/CategoriesView.tsx', 'utf-8');

// Replacements for CategoriesView to use Supabase instead of local state

// 1. Add Supabase import
content = content.replace("import { Category } from '@/src/types';", "import { Category } from '@/src/types';\nimport { supabase } from '../lib/supabase';");

// 2. Remove INITIAL_MOCK_CATEGORIES
content = content.replace(/const INITIAL_MOCK_CATEGORIES[\s\S]*?\];/m, '');

// 3. Change state initialization
content = content.replace(/const \[categories, setCategories\] = useState<any\[\]>\(INITIAL_MOCK_CATEGORIES\);/, 'const [categories, setCategories] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);');

// 4. Fetch logic
const fetchLogic = `
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categorias').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      // Map to keep icon_name -> icon_name mapping exact
      setCategories(data);
    }
    setLoading(false);
  };
`;
content = content.replace(/const \[showForm, setShowForm\] = useState\(false\);/, fetchLogic + '\n  const [showForm, setShowForm] = useState(false);');

// 5. Submit Logic
const submitLogic = `
    e.preventDefault();
    const payload = {
      nombre: formData.name, // DB uses 'nombre'
      icon_name: formData.icon_name,
      color: formData.color,
      parent_id: formData.parent_id === '' ? null : formData.parent_id
    };

    if (editingId) {
      const { error } = await supabase.from('categorias').update(payload).eq('id', editingId);
      if (error) { toast.error("Error al editar"); return; }
      toast.success("Categoría editada exitosamente.");
    } else {
      const { error } = await supabase.from('categorias').insert([payload]);
      if (error) { toast.error("Error al crear"); return; }
      toast.success("Categoría creada exitosamente.");
    }
    
    fetchCategories();
    resetForm();
`;
content = content.replace(/const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?resetForm\(\);\n  \};/, `const handleSubmit = async (e: React.FormEvent) => {${submitLogic}  };`);

// 6. Delete Logic
const deleteLogic = `
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Check if it's a parent category
    const hasChildren = categories.some(c => c.parent_id === id);
    if (hasChildren) {
      toast.error('No se puede eliminar una categoría que tiene subcategorías. Elimínelas primero.');
      return;
    }

    if (!isAdmin && !category.parent_id) {
      toast.error('Solo el Administrador puede eliminar categorías principales.');
      return;
    }

    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Categoría eliminada.");
      fetchCategories();
    }
    setShowDeleteConfirm(null);
`;
content = content.replace(/const handleDelete = \(id: string\) => \{[\s\S]*?setShowDeleteConfirm\(null\);\n  \};/, `const handleDelete = async (id: string) => {${deleteLogic}  };`);

// 7. Edit handler adaptation
// The DB column is 'nombre' instead of 'name' for name. But formData expects 'name'
const editHandler = `
    setFormData({
      name: category.nombre || category.name,
      icon_name: category.icon_name,
      color: category.color,
      parent_id: category.parent_id || ''
    });
    setEditingId(category.id);
    setShowForm(true);
`;
content = content.replace(/setFormData\(\{\n      name: category\.name,[\s\S]*?setShowForm\(true\);/m, editHandler);

// 8. Fix hierarchy name mappings
content = content.replace(/<span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">\n\s*Simulador\n\s*<\/span>/, '');

content = content.replace(/\{category\.name\}/g, '{category.nombre}'); // in CategoryNode
content = content.replace(/\{node\.name\}/g, '{node.nombre}'); // in renderOptions

fs.writeFileSync('src/components/CategoriesView.tsx', content);

