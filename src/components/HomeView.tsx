import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Tv, 
  ReceiptText, 
  User, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Smartphone,
  Flame,
  Play,
  Settings,
  Coins,
  MessageSquare,
  Bell,
  Activity,
  Gamepad,
  HelpCircle,
  Lock,
  Pencil,
  Check,
  X,
  Bot,
  Package,
  Plus,
  ArrowLeft,
  Calendar,
  Globe,
  Database,
  Upload,
  Send,
  Inbox,
  Users,
  TrendingUp,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  Layers,
  Wrench,
  Beer,
  DollarSign,
  MessageSquareText,
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { parseImages, getProductImages } from '../utils/imageUtils';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Tv, 
  Smartphone, 
  ReceiptText, 
  User, 
  Sparkles, 
  Building2, 
  ShieldCheck,
  Flame,
  Play,
  Settings,
  Coins,
  MessageSquare,
  Bell,
  Activity,
  Gamepad,
  HelpCircle,
  Lock,
  Bot,
  Package,
  Plus,
  ArrowLeft,
  Database,
  Send,
  Inbox,
  Users,
  TrendingUp,
  RefreshCw,
  Wrench,
  Beer,
  MessageSquareText,
  LayoutGrid
};

export function HomeView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole, hasPermission } = useAuth();
  const { businessProfile } = useApp();

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<'main' | 'g3d' | 'xtv' | 'config' | 'utilidades'>('main');

  const menuParam = searchParams.get('menu');

  React.useEffect(() => {
    if (menuParam === 'g3d' || menuParam === 'xtv' || menuParam === 'config' || menuParam === 'main' || menuParam === 'utilidades') {
      if (menuParam === 'g3d' && !hasPermission('Inicio.G3d.Acceder')) {
        toast.warning("No tienes permiso para acceder a esta sección (Inicio.G3d.Acceder)");
        changeMenu('main');
        return;
      }
      if (menuParam === 'xtv' && !hasPermission('Inicio.Xtv.Acceder')) {
        toast.warning("No tienes permiso para acceder a esta sección (Inicio.Xtv.Acceder)");
        changeMenu('main');
        return;
      }
      if (menuParam === 'config' && !hasPermission('Inicio.Config.Acceder')) {
        toast.warning("No tienes permiso para acceder a esta sección (Inicio.Config.Acceder)");
        changeMenu('main');
        return;
      }
      if (menuParam === 'utilidades' && !hasPermission('Inicio.Utilidades.Acceder')) {
        toast.warning("No tienes permiso para acceder a esta sección (Inicio.Utilidades.Acceder)");
        changeMenu('main');
        return;
      }
      setActiveMenu(menuParam as any);
    } else {
      setActiveMenu('main');
    }
  }, [menuParam, hasPermission]);

  const changeMenu = (menu: 'main' | 'g3d' | 'xtv' | 'config' | 'utilidades') => {
    setActiveMenu(menu);
    setSearchParams({ menu });
  };

  const [customization, setCustomization] = React.useState<any>({
    launchpadBadge: "Launchpad Principal",
    customGreeting: "",
    launchpadSubtext: "Bienvenido al panel central de control de G3D Creative Studio. Selecciona una sección para comenzar.",
    cards: {}
  });

  // Modales
  const [editWelcomeModal, setEditWelcomeModal] = React.useState(false);
  const [editCardId, setEditCardId] = React.useState<string | null>(null);

  // Formulario temporal de bienvenida
  const [tempWelcome, setTempWelcome] = React.useState({
    badge: "",
    greeting: "",
    subtext: ""
  });

  // Formulario temporal de tarjeta
  const [tempCard, setTempCard] = React.useState({
    id: "",
    title: "",
    badge: "",
    description: "",
    iconName: "Tv",
    subButtons: [] as { label: string; path: string }[]
  });

  // Estados para el Modal de Crear/Editar Pedido G3D
  const [isG3dOrderModalOpen, setIsG3dOrderModalOpen] = React.useState(false);
  const [g3dProducts, setG3dProducts] = React.useState<any[]>([]);
  const [g3dOrderToEdit, setG3dOrderToEdit] = React.useState<any | null>(null);
  const [g3dOrderForm, setG3dOrderForm] = React.useState({
    vendedor: '',
    vendedor_telefono: '',
    cliente_nombre: '',
    cliente_telefono: '',
    es_mayorista: false,
    items: [
      { id: 'item-1', cantidad: 1, item: '', descripcion: '', precio: '', imagen: '', producto_id: '', variante_id: '' }
    ] as { id: string; cantidad: number; item: string; descripcion: string; precio: string | number; imagen: string; producto_id?: string; variante_id?: string }[],
    precio: '',
    seña: '',
    capturas_pago: [] as string[],
    producto_confirmado: false
  });

  const [g3dVendors, setG3dVendors] = React.useState<any[]>([]);
  const [focusedItemIdx, setFocusedItemIdx] = React.useState<number | null>(null);

  // Buscar vendedores autorizados con permiso 'Pedidos.VendedorG3D.Mayorista'
  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data: profiles } = await supabase
          .from('perfiles_locales')
          .select('id, nombre, email, rol, permisos, telefono');
        
        const { data: rolePerms } = await supabase
          .from('g3d_roles_permisos')
          .select('rol_id, permiso_id');
          
        const { data: userRoles } = await supabase
          .from('g3d_usuarios_roles_asignacion')
          .select('usuario_id, rol_id');

        if (!profiles) return;

        const rolePermsMap: Record<string, string[]> = {};
        if (rolePerms) {
          rolePerms.forEach((rp: any) => {
            if (!rolePermsMap[rp.rol_id]) {
              rolePermsMap[rp.rol_id] = [];
            }
            rolePermsMap[rp.rol_id].push(rp.permiso_id);
          });
        }

        const userRolesMap: Record<string, string[]> = {};
        if (userRoles) {
          userRoles.forEach((ur: any) => {
            if (!userRolesMap[ur.usuario_id]) {
              userRolesMap[ur.usuario_id] = [];
            }
            userRolesMap[ur.usuario_id].push(ur.rol_id);
          });
        }

        const resolvedVendors = profiles.filter((p: any) => {
          const userRoleList: string[] = [];
          if (p.rol) userRoleList.push(p.rol);
          const assigned = userRolesMap[p.id] || [];
          assigned.forEach((r: string) => {
            if (!userRoleList.includes(r)) userRoleList.push(r);
          });

          let hasPermByRole = false;
          userRoleList.forEach((role: string) => {
            const normalizedRole = role.trim().toUpperCase();
            if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR' || normalizedRole === 'SUPERUSER') {
              hasPermByRole = true;
            }
            const perms = rolePermsMap[role] || [];
            if (perms.includes('Pedidos.VendedorG3D.Mayorista') || perms.includes('*') || perms.includes('Pedidos.*') || perms.includes('Admin.*')) {
              hasPermByRole = true;
            }
          });

          const overrides = p.permisos || [];
          let hasPerm = hasPermByRole;
          
          if (overrides.includes('Pedidos.VendedorG3D.Mayorista') || overrides.includes('Pedidos.*') || overrides.includes('*') || overrides.includes('Admin.*')) {
            hasPerm = true;
          }
          if (overrides.includes('-Pedidos.VendedorG3D.Mayorista') || overrides.includes('-Pedidos.*') || overrides.includes('-*')) {
            hasPerm = false;
          }

          return hasPerm;
        });

        setG3dVendors(resolvedVendors);
      } catch (err) {
        console.error("Error fetching G3D vendors:", err);
      }
    };

    const fetchProducts = async () => {
      try {
        let productosList: any[] = [];
        const { data: productosData, error: productosError } = await supabase
          .from('g3d_productos')
          .select('*')
          .order('nombre', { ascending: true });

        if (!productosError && productosData && productosData.length > 0) {
          productosList = productosData;
        } else {
          // Intentar la tabla previa 'productos' si la nueva no tiene datos o da error
          const { data: legacyData } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });
          if (legacyData && legacyData.length > 0) {
            productosList = legacyData;
          } else {
            // Intentar cache de localStorage
            try {
              const cached = localStorage.getItem('g3d_productos_cache');
              if (cached) productosList = JSON.parse(cached);
            } catch (e) {}
          }
        }

        let variantesList: any[] = [];
        try {
          const { data: variantesData } = await supabase
            .from('g3d_producto_variantes')
            .select('*');
          if (variantesData) variantesList = variantesData;
        } catch (vErr) {
          console.warn("Advertencia al obtener variantes:", vErr);
        }

        let localExtras: any = {};
        try {
          localExtras = JSON.parse(localStorage.getItem('g3d_productos_extras') || '{}');
        } catch (e) {
          console.warn("Error al parsear g3d_productos_extras:", e);
        }

        const fullProducts = (productosList || []).map((p: any) => {
          const extra = localExtras[p.id] || {};
          const prodWholesale = (p.precio_mayorista && Number(p.precio_mayorista) > 0)
            ? Number(p.precio_mayorista)
            : (extra.precio_mayorista && Number(extra.precio_mayorista) > 0 ? Number(extra.precio_mayorista) : 0);

          const varWholesales = extra.variantes_mayoristas || {};
          const prodLink3mf = p.archivo_link || p.instrucciones_internas || p.link_3mf || extra.archivo_link || extra.link_3mf || '';
          
          let prodImages: string[] = [];
          if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
            prodImages = p.imagenes;
          } else if (typeof p.imagenes === 'string' && p.imagenes.startsWith('[')) {
            try { prodImages = JSON.parse(p.imagenes); } catch (e) {}
          } else if (p.imagen) {
            prodImages = [p.imagen];
          }

          const prodVariantes = (variantesList || [])
            .filter((v: any) => v.producto_id === p.id)
            .map((v: any) => {
              const varWholesale = (v.precio_mayorista && Number(v.precio_mayorista) > 0)
                ? Number(v.precio_mayorista)
                : (varWholesales[v.combinacion] && Number(varWholesales[v.combinacion]) > 0
                  ? Number(varWholesales[v.combinacion])
                  : prodWholesale);

              let varImages: string[] = [];
              if (v.imagenes && Array.isArray(v.imagenes) && v.imagenes.length > 0) {
                varImages = v.imagenes;
              } else if (typeof v.imagenes === 'string' && v.imagenes.startsWith('[')) {
                try { varImages = JSON.parse(v.imagenes); } catch (e) {}
              } else if (v.imagen || v.imagen_url) {
                varImages = [v.imagen || v.imagen_url];
              } else {
                varImages = prodImages;
              }

              return {
                ...v,
                imagen_url: v.imagen || v.imagen_url || '',
                imagenes: varImages,
                archivo_link: v.archivo_link || v.sku || prodLink3mf,
                descripcion: v.descripcion || p.descripcion || '',
                precio: Number(v.precio && Number(v.precio) > 0 ? v.precio : (p.precio || p.precio_base || 0)),
                precio_mayorista: Number(varWholesale)
              };
            });

          return {
            ...p,
            precio: Number(p.precio || p.precio_base || 0),
            precio_mayorista: Number(prodWholesale),
            categoria: p.categoria || p.categoria_texto || 'Impresión 3D',
            descripcion: p.descripcion || extra.descripcion || '',
            imagen: prodImages[0] || '',
            imagenes: prodImages,
            archivo_link: prodLink3mf,
            variantes: prodVariantes
          };
        });

        setG3dProducts(fullProducts);
      } catch (err) {
        console.warn("Información: Carga de productos resuelta con lista secundaria.", err);
      }
    };

    if (isG3dOrderModalOpen) {
      fetchVendors();
      fetchProducts();
    }
  }, [isG3dOrderModalOpen]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const matchedVendor = g3dVendors.find(v => (v.nombre || v.email) === val);
    setG3dOrderForm(prev => ({
      ...prev,
      vendedor: val,
      vendedor_telefono: matchedVendor ? (matchedVendor.telefono || '') : ''
    }));
  };

  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const matchedVendor = g3dVendors.find(v => (v.nombre || v.email) === val);
    setG3dOrderForm(prev => ({
      ...prev,
      vendedor: val,
      vendedor_telefono: matchedVendor ? (matchedVendor.telefono || '') : prev.vendedor_telefono
    }));
  };

  const handleAddItemRow = () => {
    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      return {
        ...prev,
        items: [
          ...currentItems,
          { id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), cantidad: 1, item: '', descripcion: '', precio: '', imagen: '' }
        ]
      };
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      const updatedItems = currentItems.filter((_, idx) => idx !== index);
      // Recalcular total
      const total = updatedItems.reduce((acc, current) => {
        const qty = current.cantidad || 0;
        const pr = parseFloat(String(current.precio)) || 0;
        return acc + (qty * pr);
      }, 0);
      return {
        ...prev,
        items: updatedItems,
        precio: updatedItems.length > 0 ? String(total) : prev.precio
      };
    });
  };

  const handleUpdateItemField = (index: number, field: string, value: any) => {
    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      const updatedItems = currentItems.map((row, idx) => {
        if (idx === index) {
          return { ...row, [field]: value };
        }
        return row;
      });
      
      // Recalculamos el precio total automáticamente según la suma de items
      const total = updatedItems.reduce((acc, current) => {
        const qty = current.cantidad || 0;
        const pr = parseFloat(String(current.precio)) || 0;
        return acc + (qty * pr);
      }, 0);

      return {
        ...prev,
        items: updatedItems,
        precio: String(total)
      };
    });
  };

  const handleSelectProductForItem = (index: number, p: any, v?: any, chosenPrice?: number) => {
    const isWholesale = Boolean(g3dOrderForm.es_mayorista);
    const pWholesale = (p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : Number(p.precio || 0);

    let finalPrice = chosenPrice;
    if (finalPrice === undefined) {
      if (v) {
        const vMin = (v.precio && Number(v.precio) > 0) ? Number(v.precio) : Number(p.precio || 0);
        const vMay = (v.precio_mayorista && Number(v.precio_mayorista) > 0) ? Number(v.precio_mayorista) : pWholesale;
        finalPrice = isWholesale ? vMay : vMin;
      } else {
        finalPrice = isWholesale ? pWholesale : Number(p.precio || 0);
      }
    }

    const name = v ? `${p.nombre} (${v.combinacion})` : p.nombre;
    const desc = v?.descripcion || p.descripcion || '';
    const link3mf = v?.archivo_link || p.archivo_link || p.instrucciones_internas || p.link_3mf || '';

    let imgs: string[] = [];
    if (v?.imagenes && Array.isArray(v.imagenes) && v.imagenes.length > 0) {
      imgs = v.imagenes;
    } else if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
      imgs = p.imagenes;
    } else if (v?.imagen_url || v?.imagen) {
      imgs = [v.imagen_url || v.imagen];
    } else if (p.imagen) {
      imgs = [p.imagen];
    }

    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      const updated = currentItems.map((row, idx) => {
        if (idx === index) {
          return {
            ...row,
            item: name,
            producto_id: p.id,
            variante_id: v ? v.id : '',
            precio: finalPrice,
            descripcion: desc,
            imagen: imgs[0] || '',
            imagenes: imgs,
            archivo_link: link3mf
          };
        }
        return row;
      });

      const total = updated.reduce((acc, current) => {
        const qty = current.cantidad || 0;
        const pr = parseFloat(String(current.precio)) || 0;
        return acc + (qty * pr);
      }, 0);

      return {
        ...prev,
        items: updated,
        precio: String(total)
      };
    });
    setFocusedItemIdx(null);
  };

  const handleUploadItemImage = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentItems = Array.isArray(g3dOrderForm?.items) ? g3dOrderForm.items : [];
    const itemRow = currentItems[index];
    const existingImgs: string[] = Array.isArray(itemRow?.imagenes) && itemRow.imagenes.length > 0
      ? [...itemRow.imagenes]
      : (itemRow?.imagen ? [itemRow.imagen] : []);

    if (existingImgs.length >= 5) {
      toast.error("Límite alcanzado: Ya hay 5 fotos adjuntas a este ítem.");
      event.target.value = '';
      return;
    }

    const availableSlots = 5 - existingImgs.length;
    const filesToProcess: File[] = Array.from(files).slice(0, availableSlots) as File[];

    if (files.length > availableSlots) {
      toast.info(`Solo se agregaron ${availableSlots} foto(s) para no superar el límite de 5 por ítem.`);
    }

    const newCompressedImgs: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera los 10MB`);
        continue;
      }

      try {
        // 1. Intentar subir a Supabase Storage (public_assets bucket)
        let finalImageUrl = '';
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `items/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('public_assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from('public_assets').getPublicUrl(fileName);
          if (data?.publicUrl) {
            finalImageUrl = data.publicUrl;
          }
        }

        // 2. Fallback a Base64 comprimido si falla el Storage
        if (!finalImageUrl) {
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const result = canvas.toDataURL('image/jpeg', 0.6);
                resolve(result);
              };
              img.onerror = () => reject(new Error('Error al renderizar canvas'));
            };
            reader.onerror = (err) => reject(err);
          });
        }

        newCompressedImgs.push(finalImageUrl);
      } catch (err) {
        console.error("Error al procesar la imagen:", err);
      }
    }

    if (newCompressedImgs.length > 0) {
      setG3dOrderForm(prev => {
        const currentItems = Array.isArray(prev?.items) ? prev.items : [];
        const updated = currentItems.map((row, idx) => {
          if (idx === index) {
            const currentImgs = Array.isArray(row.imagenes) && row.imagenes.length > 0 
              ? [...row.imagenes] 
              : (row.imagen ? [row.imagen] : []);
            const mergedImgs = [...currentImgs, ...newCompressedImgs].slice(0, 5);
            return {
              ...row,
              imagen: mergedImgs[0] || '',
              imagenes: mergedImgs
            };
          }
          return row;
        });
        return { ...prev, items: updated };
      });
      toast.success(`${newCompressedImgs.length} foto(s) adjuntada(s) al ítem.`);
    }

    event.target.value = '';
  };

  const handleUploadItemPaymentCapture = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess: File[] = Array.from(files) as File[];
    const newCompressedCaptures: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera los 10MB`);
        continue;
      }

      try {
        let finalImageUrl = '';
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `capturas_pago/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('public_assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from('public_assets').getPublicUrl(fileName);
          if (data?.publicUrl) {
            finalImageUrl = data.publicUrl;
          }
        }

        if (!finalImageUrl) {
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const result = canvas.toDataURL('image/jpeg', 0.65);
                resolve(result);
              };
              img.onerror = () => reject(new Error('Error al comprimir captura'));
            };
            reader.onerror = (err) => reject(err);
          });
        }

        if (finalImageUrl) {
          newCompressedCaptures.push(finalImageUrl);
        }
      } catch (err) {
        console.error("Error al procesar captura de pago del ítem:", err);
      }
    }

    if (newCompressedCaptures.length > 0) {
      setG3dOrderForm(prev => {
        const itemsArr = Array.isArray(prev?.items) ? prev.items : [];
        const updated = itemsArr.map((row, idx) => {
          if (idx === index) {
            const prevCaptures = Array.isArray(row.capturas_pago) ? row.capturas_pago : [];
            const merged = [...prevCaptures, ...newCompressedCaptures];
            return {
              ...row,
              capturas_pago: merged,
              comprobantes_pago: merged
            };
          }
          return row;
        });
        return { ...prev, items: updated };
      });
      toast.success(`${newCompressedCaptures.length} captura(s) de pago agregada(s) al ítem.`);
    }

    event.target.value = '';
  };

  const handleToggleItemConfirm = (index: number) => {
    setG3dOrderForm(prev => {
      const itemsArr = Array.isArray(prev?.items) ? prev.items : [];
      const updated = itemsArr.map((row, idx) => {
        if (idx === index) {
          return {
            ...row,
            confirmado: !row.confirmado
          };
        }
        return row;
      });
      return { ...prev, items: updated };
    });
  };

  const handleUploadPaymentCaptures = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess: File[] = Array.from(files) as File[];
    const newUploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera los 10MB`);
        continue;
      }

      try {
        let finalImageUrl = '';
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `capturas_pago/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('public_assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadErr) {
          const { data } = supabase.storage.from('public_assets').getPublicUrl(fileName);
          if (data?.publicUrl) {
            finalImageUrl = data.publicUrl;
          }
        }

        if (!finalImageUrl) {
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const result = canvas.toDataURL('image/jpeg', 0.65);
                resolve(result);
              };
              img.onerror = () => reject(new Error('Error al comprimir captura'));
            };
            reader.onerror = (err) => reject(err);
          });
        }

        if (finalImageUrl) {
          newUploadedUrls.push(finalImageUrl);
        }
      } catch (err) {
        console.error("Error al procesar captura de pago:", err);
      }
    }

    if (newUploadedUrls.length > 0) {
      setG3dOrderForm(prev => ({
        ...prev,
        capturas_pago: [...(Array.isArray(prev?.capturas_pago) ? prev.capturas_pago : []), ...newUploadedUrls]
      }));
      toast.success(`${newUploadedUrls.length} captura(s) de pago agregada(s).`);
    }

    event.target.value = '';
  };

  // Prefilar vendedor con el usuario actual
  React.useEffect(() => {
    if (user && g3dVendors.length > 0) {
      const emailOrNombre = user.nombre || user.email;
      const matched = g3dVendors.find(v => v.nombre === emailOrNombre || v.email === emailOrNombre || v.id === user.id);
      setG3dOrderForm(prev => ({
        ...prev,
        vendedor: matched ? (matched.nombre || matched.email) : (user.nombre || user.email || 'Vendedor G3D'),
        vendedor_telefono: matched ? (matched.telefono || '') : ''
      }));
    }
  }, [user, g3dVendors]);

  const handleSaveG3dOrder = async () => {
    try {
      if (!g3dOrderForm.vendedor) {
        toast.error("El nombre del vendedor es obligatorio.");
        return;
      }

      // Validar permiso de cliente opcional
      const canHaveOptionalClient = hasPermission('G3d.CrearPedido.ClienteOpcional') || hasPermission('Admin.*') || userRole === 'Admin';
      if (!canHaveOptionalClient) {
        if (!g3dOrderForm.cliente_nombre?.trim() || !g3dOrderForm.cliente_telefono?.trim()) {
          toast.error("El Nombre Completo del Cliente y el Teléfono son obligatorios.");
          return;
        }
      }
      
      const ordersLocal = JSON.parse(localStorage.getItem('g3d_designed_orders') || '[]');
      const globalCapturas = Array.isArray(g3dOrderForm.capturas_pago) ? g3dOrderForm.capturas_pago : [];
      
      if (g3dOrderToEdit) {
        // Modo edición
        const allItemCaptures = (g3dOrderForm.items || []).flatMap((i: any) => Array.isArray(i.capturas_pago) ? i.capturas_pago : []);
        const mergedCapturas = Array.from(new Set([...globalCapturas, ...allItemCaptures]));
        const isAnyItemConfirmed = (g3dOrderForm.items || []).some((i: any) => Boolean(i.confirmado)) || Boolean(g3dOrderForm.producto_confirmado);

        const updatedOrderObj = {
          ...g3dOrderToEdit,
          vendedor: g3dOrderForm.vendedor,
          vendedor_telefono: g3dOrderForm.vendedor_telefono,
          cliente_nombre: g3dOrderForm.cliente_nombre,
          cliente_telefono: g3dOrderForm.cliente_telefono,
          items: g3dOrderForm.items || [],
          precio: parseFloat(String(g3dOrderForm.precio)) || 0,
          seña: parseFloat(String(g3dOrderForm.seña)) || 0,
          capturas_pago: mergedCapturas,
          comprobantes_pago: mergedCapturas,
          comprobante_url: mergedCapturas[0] || g3dOrderToEdit.comprobante_url || null,
          producto_confirmado: isAnyItemConfirmed
        };

        await apiService.saveG3dOrder(updatedOrderObj);
        toast.success("Pedido de Diseño G3D actualizado correctamente.");
      } else {
        // Modo creación: Crear un pedido individual por cada ítem de la lista
        const validItems = (g3dOrderForm.items || []).filter(i => i.item && i.item.trim() !== '');
        if (validItems.length === 0) {
          toast.error("Debes agregar al menos un ítem al pedido.");
          return;
        }

        const newOrdersToPush: any[] = [];
        const baseTime = Date.now();
        const totalDeposit = parseFloat(String(g3dOrderForm.seña)) || 0;

        validItems.forEach((it, idx) => {
          const qty = it.cantidad || 1;
          const unitPrice = parseFloat(String(it.precio)) || 0;
          const totalItemPrice = qty * unitPrice;
          const itemDeposit = validItems.length === 1 ? totalDeposit : Math.round((totalDeposit / validItems.length) * 100) / 100;
          const itemCaptures = (Array.isArray(it.capturas_pago) && it.capturas_pago.length > 0) ? it.capturas_pago : globalCapturas;

          newOrdersToPush.push({
            id: `g3d-o-${baseTime}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            fecha: new Date().toISOString(),
            vendedor: g3dOrderForm.vendedor,
            vendedor_telefono: g3dOrderForm.vendedor_telefono,
            cliente_nombre: g3dOrderForm.cliente_nombre,
            cliente_telefono: g3dOrderForm.cliente_telefono,
            items: [it],
            item_nombre: it.item,
            item_cantidad: qty,
            item_precio: unitPrice,
            precio: totalItemPrice,
            seña: itemDeposit,
            capturas_pago: itemCaptures,
            comprobantes_pago: itemCaptures,
            comprobante_url: itemCaptures[0] || null,
            producto_confirmado: Boolean(it.confirmado),
            estado: 'Pendiente'
          });
        });

        for (const ord of newOrdersToPush) {
          await apiService.saveG3dOrder(ord);

          // Registrar cada pago de seña en la tabla 'pagos'
          if (ord.seña && ord.seña > 0) {
            try {
              await apiService.addPayment({
                id_pedido: ord.id,
                monto: ord.seña,
                tipo_pago: 'Seña / Pago Inicial',
                comprobante_url: (Array.isArray(ord.capturas_pago) && ord.capturas_pago[0]) || null,
                observaciones: `Seña registrada al crear pedido para: ${ord.item_nombre || 'Item G3D'}`
              });
            } catch (payErr) {
              console.warn("Error registrando seña en tabla pagos:", payErr);
            }
          }
        }

        toast.success(newOrdersToPush.length === 1 
          ? "¡Pedido de Diseño G3D registrado con éxito!" 
          : `¡Se registraron ${newOrdersToPush.length} pedidos individuales con éxito!`);
      }
      
      setIsG3dOrderModalOpen(false);
      // Limpiar formulario (manteniendo vendedor)
      setG3dOrderForm(prev => ({
        ...prev,
        cliente_nombre: '',
        cliente_telefono: '',
        es_mayorista: false,
        items: [
          { id: 'item-1', cantidad: 1, item: '', descripcion: '', precio: '', imagen: '' }
        ],
        precio: '',
        seña: '',
        capturas_pago: [],
        producto_confirmado: false
      }));
      setG3dOrderToEdit(null);
    } catch (err: any) {
      toast.error("Error al guardar el pedido: " + err.message);
    }
  };

  // Cargar personalizaciones al montar
  React.useEffect(() => {
    const loadCustomization = async () => {
      try {
        const local = localStorage.getItem('g3d_homepage_customization');
        if (local) {
          setCustomization(JSON.parse(local));
        }

        const sysConfig = await apiService.getSystemConfig();
        if (sysConfig && sysConfig.homepage_customizations) {
          setCustomization(sysConfig.homepage_customizations);
          localStorage.setItem('g3d_homepage_customization', JSON.stringify(sysConfig.homepage_customizations));
        }
      } catch (err) {
        console.error("Error al cargar personalizaciones del inicio:", err);
      }
    };
    loadCustomization();
  }, []);

  // Guardar personalizaciones
  const saveCustomization = async (newCustomization: any) => {
    try {
      setCustomization(newCustomization);
      localStorage.setItem('g3d_homepage_customization', JSON.stringify(newCustomization));
      
      const toastId = toast.loading("Guardando personalización en la nube...");
      const sysConfig = await apiService.getSystemConfig();
      const updatedConfig = {
        ...sysConfig,
        homepage_customizations: newCustomization
      };
      
      const res = await apiService.updateSystemConfig(updatedConfig);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success("¡Interfaz personalizada guardada correctamente!");
      } else {
        toast.error("Guardado localmente. Error al sincronizar con la nube.");
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || String(err)));
    }
  };

  const handleOpenEditWelcome = () => {
    setTempWelcome({
      badge: customization.launchpadBadge || "Launchpad Principal",
      greeting: customization.customGreeting || "",
      subtext: customization.launchpadSubtext || `Bienvenido al panel central de control de ${businessProfile?.nombre_negocio || 'G3D Creative Studio'}. Selecciona una sección para comenzar.`
    });
    setEditWelcomeModal(true);
  };

  const handleSaveWelcome = () => {
    const updated = {
      ...customization,
      launchpadBadge: tempWelcome.badge,
      customGreeting: tempWelcome.greeting,
      launchpadSubtext: tempWelcome.subtext
    };
    saveCustomization(updated);
    setEditWelcomeModal(false);
  };

  const handleOpenEditCard = (card: any) => {
    const savedCard = customization.cards?.[card.id] || {};
    setTempCard({
      id: card.id,
      title: savedCard.title || card.title,
      badge: savedCard.badge || card.badge,
      description: savedCard.description || card.description,
      iconName: savedCard.iconName || card.defaultIconName,
      subButtons: savedCard.subButtons || card.defaultSubButtons || []
    });
    setEditCardId(card.id);
  };

  const handleSaveCard = () => {
    if (!editCardId) return;
    const updated = {
      ...customization,
      cards: {
        ...(customization.cards || {}),
        [editCardId]: {
          title: tempCard.title,
          badge: tempCard.badge,
          description: tempCard.description,
          iconName: tempCard.iconName,
          subButtons: tempCard.subButtons
        }
      }
    };
    saveCustomization(updated);
    setEditCardId(null);
  };

  React.useEffect(() => {
    if (userRole) {
      const landingPages = (businessProfile as any)?.role_landing_pages || (() => {
        try {
          const saved = localStorage.getItem('g3d_roles_landing_pages');
          return saved ? JSON.parse(saved) : {};
        } catch (e) {
          return {};
        }
      })();

      const roleKey = String(userRole).toUpperCase();
      const userEmailKey = String(user?.email || '').toLowerCase();
      const keys = Object.keys(landingPages);
      
      // 1. Buscar coincidencia por email exacto del usuario (máxima prioridad)
      let matchedKey = keys.find(k => k.toLowerCase() === userEmailKey);
      
      // 2. Si no hay coincidencia individual, buscar por rol
      if (!matchedKey) {
        matchedKey = keys.find(k => k.toUpperCase() === roleKey);
      }
      
      if (matchedKey) {
        const dest = landingPages[matchedKey];
        if (dest && dest !== '/') {
          const hasRedirected = sessionStorage.getItem('g3d_initial_redirect_done');
          if (!hasRedirected) {
            sessionStorage.setItem('g3d_initial_redirect_done', 'true');
            navigate(dest);
          }
        }
      }
    }
  }, [userRole, user, businessProfile, navigate]);

  const isG3dVendedor = String(userRole).toLowerCase() === 'g3d vendedor' || 
                        String(userRole).toLowerCase() === 'admin' || 
                        String(userRole).toLowerCase() === 'administrador';

  // Obtener saludo según la hora local
  const getGreeting = () => {
    if (customization.customGreeting) {
      return customization.customGreeting;
    }
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 20) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  const menuItems = [
    {
      id: 'g3d',
      title: customization.cards?.g3d?.title || 'G3D',
      shortTitle: customization.cards?.g3d?.title || 'G3D',
      description: customization.cards?.g3d?.description || 'Menú de inicio G3D: crear pedido, lista de precios y control de pedidos.',
      icon: ICON_MAP[customization.cards?.g3d?.iconName] || Building2,
      defaultIconName: 'Building2',
      color1: customization.cards?.g3d?.color1 || '#ea580c',
      color2: customization.cards?.g3d?.color2 || '#9a3412',
      customIcon: customization.cards?.g3d?.customIcon || null,
      innerBg: 'from-orange-500 to-red-700',
      shadowColor: 'rgba(234, 88, 12, 0.45)',
      action: () => {
        if (!hasPermission('Inicio.G3d.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (Inicio.G3d.Acceder)");
          return;
        }
        changeMenu('g3d');
      },
      badge: customization.cards?.g3d?.badge || 'Inicio G3D'
    },
    {
      id: 'xtv',
      title: customization.cards?.xtv?.title || 'XTV Panel',
      shortTitle: customization.cards?.xtv?.title || 'XTV Panel',
      description: customization.cards?.xtv?.description || 'Gestión inteligente de subperfiles, flujos de IPTV, simulador Bento-grid, finanzas y control de marca.',
      icon: ICON_MAP[customization.cards?.xtv?.iconName] || Tv,
      defaultIconName: 'Tv',
      color1: customization.cards?.xtv?.color1 || '#0074cc',
      color2: customization.cards?.xtv?.color2 || '#004580',
      customIcon: customization.cards?.xtv?.customIcon || null,
      innerBg: 'from-blue-400 to-blue-700',
      shadowColor: 'rgba(0, 82, 153, 0.45)',
      action: () => {
        if (!hasPermission('Inicio.Xtv.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (Inicio.Xtv.Acceder)");
          return;
        }
        changeMenu('xtv');
      },
      badge: customization.cards?.xtv?.badge || 'IPTV Core'
    },
    {
      id: 'aplicaciones',
      title: customization.cards?.aplicaciones?.title || 'Aplicaciones',
      shortTitle: 'Aplicaciones',
      description: customization.cards?.aplicaciones?.description || 'Catálogo unificado de herramientas y aplicaciones: Simulador Jarra Chop 3D, Galería de Prompts de Banner y más.',
      icon: ICON_MAP[customization.cards?.aplicaciones?.iconName] || LayoutGrid,
      defaultIconName: 'LayoutGrid',
      color1: customization.cards?.aplicaciones?.color1 || '#14b8a6',
      color2: customization.cards?.aplicaciones?.color2 || '#0d9488',
      customIcon: customization.cards?.aplicaciones?.customIcon || null,
      innerBg: 'from-teal-400 to-emerald-600',
      shadowColor: 'rgba(20, 184, 166, 0.45)',
      action: () => {
        if (!hasPermission('Inicio.Aplicaciones.Acceder') && !hasPermission('Inicio.Utilidades.Acceder') && !hasPermission('Config.Apps.Acceder') && userRole !== 'Administrador') {
          // If no specific permission check fails, allow navigation or check admin
        }
        navigate('/apps');
      },
      badge: customization.cards?.aplicaciones?.badge || 'Herramientas'
    },
    {
      id: 'config',
      title: customization.cards?.config?.title || 'Mi Perfil y Negocio',
      shortTitle: customization.cards?.config?.title || 'Mi Perfil',
      description: customization.cards?.config?.description || (isG3dVendedor 
         ? 'Actualiza tus datos personales y edita la información oficial de tu negocio para despachos y marca.' 
         : 'Actualiza tus datos personales de contacto, hogar y geolocalización en tiempo real.'),
      icon: ICON_MAP[customization.cards?.config?.iconName] || User,
      defaultIconName: 'User',
      color1: customization.cards?.config?.color1 || '#e1007e',
      color2: customization.cards?.config?.color2 || '#91004e',
      customIcon: customization.cards?.config?.customIcon || null,
      innerBg: 'from-pink-400 to-rose-600',
      shadowColor: 'rgba(171, 0, 91, 0.45)',
      action: () => {
        if (!hasPermission('Inicio.Config.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (Inicio.Config.Acceder)");
          return;
        }
        changeMenu('config');
      },
      badge: customization.cards?.config?.badge || (isG3dVendedor ? 'Perfil & Negocio' : 'Mi Perfil')
    }
  ].filter(item => {
    if (item.id === 'g3d') return hasPermission('Inicio.G3d.Ver');
    if (item.id === 'xtv') return hasPermission('Inicio.Xtv.Ver');
    if (item.id === 'aplicaciones') return hasPermission('Inicio.Aplicaciones.Ver') || hasPermission('Inicio.Utilidades.Ver') || hasPermission('Config.Apps.Ver') || userRole === 'Administrador';
    if (item.id === 'config') return hasPermission('Inicio.Config.Ver');
    return true;
  });

  const xtvMenuItems = [
    {
      id: 'crear_directo',
      title: customization.cards?.crear_directo?.title || 'Crear Cuenta Directa',
      shortTitle: 'Directo',
      description: 'Carga inmediata consumiendo tu balance de créditos.',
      icon: ICON_MAP['Sparkles'] || Sparkles,
      defaultIconName: 'Sparkles',
      color1: '#10b981',
      color2: '#059669',
      customIcon: null,
      innerBg: 'from-emerald-400 to-green-600',
      shadowColor: 'rgba(16, 185, 129, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.CrearDirecto.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.CrearDirecto.Acceder)");
          return;
        }
        navigate('/xtv?menu=crear_directo');
      },
      badge: '⚡ Carga Inmediata'
    },
    {
      id: 'solicitar_activacion',
      title: customization.cards?.solicitar_activacion?.title || 'Solicitar Activación',
      shortTitle: 'Ticket',
      description: 'Creación mediante ticket de soporte para aprobación.',
      icon: ICON_MAP['Send'] || Send,
      defaultIconName: 'Send',
      color1: '#f59e0b',
      color2: '#d97706',
      customIcon: null,
      innerBg: 'from-amber-400 to-orange-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.SolicitarActivacion.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.SolicitarActivacion.Acceder)");
          return;
        }
        navigate('/xtv?menu=solicitar_activacion');
      },
      badge: '📥 Ticket'
    },
    {
      id: 'renovaciones',
      title: customization.cards?.renovaciones?.title || 'Renovaciones',
      shortTitle: 'Renovar',
      description: 'Extender la vigencia de cuentas activas en el sistema.',
      icon: ICON_MAP['RefreshCw'] || RefreshCw,
      defaultIconName: 'RefreshCw',
      color1: '#3b82f6',
      color2: '#2563eb',
      customIcon: null,
      innerBg: 'from-blue-400 to-blue-700',
      shadowColor: 'rgba(59, 130, 246, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Renovaciones.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Renovaciones.Acceder)");
          return;
        }
        navigate('/xtv?menu=renovaciones');
      },
      badge: '🔄 Renovación'
    },
    {
      id: 'finanzas',
      title: customization.cards?.finanzas?.title || 'Solicitudes',
      shortTitle: 'Bandeja',
      description: 'Bandeja de solicitudes de créditos and activación de líneas.',
      icon: ICON_MAP['Inbox'] || Inbox,
      defaultIconName: 'Inbox',
      color1: '#8b5cf6',
      color2: '#7c3aed',
      customIcon: null,
      innerBg: 'from-purple-400 to-indigo-650',
      shadowColor: 'rgba(139, 92, 246, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Solicitudes.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Solicitudes.Acceder)");
          return;
        }
        navigate('/xtv?menu=finanzas');
      },
      badge: '🪙 Créditos'
    },
    {
      id: 'mis_clientes',
      title: customization.cards?.mis_clientes?.title || 'Mis Clientes',
      shortTitle: 'Clientes',
      description: 'Listado y administración de cuentas activas y demos creadas.',
      icon: ICON_MAP['Users'] || Users,
      defaultIconName: 'Users',
      color1: '#06b6d4',
      color2: '#0891b2',
      customIcon: null,
      innerBg: 'from-cyan-400 to-teal-600',
      shadowColor: 'rgba(6, 182, 212, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Clientes.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Clientes.Acceder)");
          return;
        }
        navigate('/xtv?menu=mis_clientes');
      },
      badge: '👥 Clientes'
    },
    {
      id: 'finanzas_vendedores',
      title: customization.cards?.finanzas_vendedores?.title || 'Finanzas',
      shortTitle: 'Caja',
      description: 'Control de comisiones y balance de red de distribución.',
      icon: ICON_MAP['TrendingUp'] || TrendingUp,
      defaultIconName: 'TrendingUp',
      color1: '#ec4899',
      color2: '#db2777',
      customIcon: null,
      innerBg: 'from-pink-400 to-rose-600',
      shadowColor: 'rgba(236, 72, 153, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Finanzas.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Finanzas.Acceder)");
          return;
        }
        navigate('/xtv?menu=finanzas_vendedores');
      },
      badge: '💵 Comisiones'
    },
    {
      id: 'tutoriales',
      title: customization.cards?.tutoriales?.title || 'Tutoriales',
      shortTitle: 'Soporte',
      description: 'Guías rápidas y respuestas frecuentes para vendedores.',
      icon: ICON_MAP['HelpCircle'] || HelpCircle,
      defaultIconName: 'HelpCircle',
      color1: '#14b8a6',
      color2: '#0d9488',
      customIcon: null,
      innerBg: 'from-teal-400 to-emerald-600',
      shadowColor: 'rgba(20, 184, 16, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Tutoriales.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Tutoriales.Acceder)");
          return;
        }
        navigate('/xtv?menu=tutoriales');
      },
      badge: '📖 Guías'
    },
    {
      id: 'ajustes_configuracion',
      title: 'Ajustes XTV',
      shortTitle: 'Ajustes',
      description: 'Acceder a la administración central de XTV.',
      icon: ICON_MAP['Settings'] || Settings,
      defaultIconName: 'Settings',
      color1: '#64748b',
      color2: '#475569',
      customIcon: null,
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => {
        if (!hasPermission('Iptv.Ajustes.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Iptv.Ajustes.Acceder)");
          return;
        }
        navigate('/xtv?tab=central');
      },
      badge: '⚙️ Central'
    },
    {
      id: 'volver_main',
      title: 'Volver',
      shortTitle: 'Volver',
      description: 'Regresar al menú de inicio principal de la aplicación.',
      icon: ICON_MAP['ArrowLeft'] || ArrowLeft,
      defaultIconName: 'ArrowLeft',
      color1: '#64748b',
      color2: '#334155',
      customIcon: null,
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => changeMenu('main'),
      badge: 'Menú'
    }
  ].filter(item => {
    if (item.id === 'crear_directo') return hasPermission('Iptv.CrearDirecto.Ver');
    if (item.id === 'solicitar_activacion') return hasPermission('Iptv.SolicitarActivacion.Ver');
    if (item.id === 'renovaciones') return hasPermission('Iptv.Renovaciones.Ver');
    if (item.id === 'finanzas') return hasPermission('Iptv.Solicitudes.Ver');
    if (item.id === 'mis_clientes') return hasPermission('Iptv.Clientes.Ver');
    if (item.id === 'finanzas_vendedores') return hasPermission('Iptv.Finanzas.Ver');
    if (item.id === 'tutoriales') return hasPermission('Iptv.Tutoriales.Ver');
    if (item.id === 'ajustes_configuracion') return hasPermission('Iptv.Ajustes.Ver');
    return true;
  });

  const configMenuItems = [
    {
      id: 'at_catalogo',
      title: 'Catálogo & Stock',
      shortTitle: 'Catálogo',
      description: 'Acceso directo a la lista de productos y niveles de stock.',
      icon: ICON_MAP['Package'] || Package,
      defaultIconName: 'Package',
      color1: '#f59e0b',
      color2: '#b45309',
      innerBg: 'from-amber-400 to-orange-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      action: () => {
        if (!hasPermission('Config.Catalogo.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Catalogo.Acceder)");
          return;
        }
        navigate('/mis-productos');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_moderacion',
      title: 'Moderación Store',
      shortTitle: 'Moderación',
      description: 'Acceso directo al panel de control y bloqueo de productos.',
      icon: ICON_MAP['Lock'] || Lock,
      defaultIconName: 'Lock',
      color1: '#ef4444',
      color2: '#b91c1c',
      innerBg: 'from-red-400 to-red-700',
      shadowColor: 'rgba(239, 68, 68, 0.45)',
      action: () => {
        if (!hasPermission('Config.Moderacion.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Moderacion.Acceder)");
          return;
        }
        navigate('/moderacion');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_pedidos',
      title: 'Pedidos (v1)',
      shortTitle: 'Pedidos',
      description: 'Ver listado y estados de despachos tradicionales.',
      icon: ICON_MAP['ReceiptText'] || ReceiptText,
      defaultIconName: 'ReceiptText',
      color1: '#3b82f6',
      color2: '#1d4ed8',
      innerBg: 'from-blue-400 to-blue-700',
      shadowColor: 'rgba(59, 130, 246, 0.45)',
      action: () => {
        if (!hasPermission('Config.Pedidos.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Pedidos.Acceder)");
          return;
        }
        navigate('/pedidos');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_clasificacion',
      title: 'Categorías y Flujos',
      shortTitle: 'Clasificar',
      description: 'Administración de flujos de trabajo y taxonomía de venta.',
      icon: ICON_MAP['Database'] || Database,
      defaultIconName: 'Database',
      color1: '#8b5cf6',
      color2: '#5b21b6',
      innerBg: 'from-purple-400 to-indigo-650',
      shadowColor: 'rgba(139, 92, 246, 0.45)',
      action: () => {
        if (!hasPermission('Config.Clasificacion.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Clasificacion.Acceder)");
          return;
        }
        navigate('/clasificacion');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_proveedores',
      title: 'Proveedores',
      shortTitle: 'Proveedores',
      description: 'Control de insumos, costos y tiempos de reposición.',
      icon: ICON_MAP['Building2'] || Building2,
      defaultIconName: 'Building2',
      color1: '#ec4899',
      color2: '#db2777',
      innerBg: 'from-pink-400 to-rose-600',
      shadowColor: 'rgba(236, 72, 153, 0.45)',
      action: () => {
        if (!hasPermission('Config.Proveedores.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Proveedores.Acceder)");
          return;
        }
        navigate('/proveedores');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_revendedores',
      title: 'Revendedores',
      shortTitle: 'Red',
      description: 'Gestión y control de miembros del equipo de ventas.',
      icon: ICON_MAP['Users'] || Users,
      defaultIconName: 'Users',
      color1: '#06b6d4',
      color2: '#0891b2',
      innerBg: 'from-cyan-400 to-teal-600',
      shadowColor: 'rgba(6, 182, 212, 0.45)',
      action: () => {
        if (!hasPermission('Config.Revendedores.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Revendedores.Acceder)");
          return;
        }
        navigate('/revendedores');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_logistica',
      title: 'Logística Central',
      shortTitle: 'Logística',
      description: 'Configuración de fleteros, envíos Uber y delivery propio.',
      icon: ICON_MAP['Smartphone'] || Smartphone,
      defaultIconName: 'Smartphone',
      color1: '#10b981',
      color2: '#059669',
      innerBg: 'from-emerald-400 to-green-600',
      shadowColor: 'rgba(16, 185, 129, 0.45)',
      action: () => {
        if (!hasPermission('Config.Logistica.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Logistica.Acceder)");
          return;
        }
        navigate('/logistica');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_reportes',
      title: 'Centro de Reportes',
      shortTitle: 'Auditoría',
      description: 'Reporte de errores del sistema y estados operativos.',
      icon: ICON_MAP['HelpCircle'] || HelpCircle,
      defaultIconName: 'HelpCircle',
      color1: '#f59e0b',
      color2: '#d97706',
      innerBg: 'from-amber-400 to-orange-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      action: () => {
        if (!hasPermission('Config.Reportes.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Reportes.Acceder)");
          return;
        }
        navigate('/reportes');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_historial',
      title: 'Historial',
      shortTitle: 'Bitácora',
      description: 'Registro de auditoría general de todos los movimientos.',
      icon: ICON_MAP['HelpCircle'] || HelpCircle,
      defaultIconName: 'HelpCircle',
      color1: '#64748b',
      color2: '#475569',
      innerBg: 'from-slate-400 to-slate-650',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => {
        if (!hasPermission('Config.Historial.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Historial.Acceder)");
          return;
        }
        navigate('/historial');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_apps',
      title: 'Aplicaciones',
      shortTitle: 'Apps',
      description: 'Administración de otras aplicaciones conectadas.',
      icon: ICON_MAP['Tv'] || Tv,
      defaultIconName: 'Tv',
      color1: '#3b82f6',
      color2: '#1d4ed8',
      innerBg: 'from-blue-400 to-blue-700',
      shadowColor: 'rgba(59, 130, 246, 0.45)',
      action: () => {
        if (!hasPermission('Config.Apps.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Apps.Acceder)");
          return;
        }
        navigate('/apps');
      },
      badge: 'Atajo'
    },
    {
      id: 'at_config',
      title: 'Ajustes de Sistema',
      shortTitle: 'Ajustes',
      description: 'Preferencias globales de la marca y base de datos.',
      icon: ICON_MAP['Settings'] || Settings,
      defaultIconName: 'Settings',
      color1: '#64748b',
      color2: '#334155',
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => {
        if (!hasPermission('Config.Ajustes.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Config.Ajustes.Acceder)");
          return;
        }
        navigate('/configuracion');
      },
      badge: 'Atajo'
    },
    {
      id: 'volver_main',
      title: 'Volver',
      shortTitle: 'Volver',
      description: 'Regresar al menú de inicio principal de la aplicación.',
      icon: ICON_MAP['ArrowLeft'] || ArrowLeft,
      defaultIconName: 'ArrowLeft',
      color1: '#64748b',
      color2: '#334155',
      customIcon: null,
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => changeMenu('main'),
      badge: 'Menú'
    }
  ].filter(item => {
    if (item.id === 'at_catalogo') return hasPermission('Config.Catalogo.Ver');
    if (item.id === 'at_moderacion') return hasPermission('Config.Moderacion.Ver');
    if (item.id === 'at_pedidos') return hasPermission('Config.Pedidos.Ver');
    if (item.id === 'at_clasificacion') return hasPermission('Config.Clasificacion.Ver');
    if (item.id === 'at_proveedores') return hasPermission('Config.Proveedores.Ver');
    if (item.id === 'at_revendedores') return hasPermission('Config.Revendedores.Ver');
    if (item.id === 'at_logistica') return hasPermission('Config.Logistica.Ver');
    if (item.id === 'at_reportes') return hasPermission('Config.Reportes.Ver');
    if (item.id === 'at_historial') return hasPermission('Config.Historial.Ver');
    if (item.id === 'at_apps') return hasPermission('Config.Apps.Ver');
    if (item.id === 'at_config') return hasPermission('Config.Ajustes.Ver');
    return true;
  });

  const g3dMenuItems = [
    {
      id: 'crear_pedido',
      title: customization.cards?.crear_pedido?.title || 'Crear Pedido',
      shortTitle: customization.cards?.crear_pedido?.title || 'Crear Pedido',
      description: customization.cards?.crear_pedido?.description || 'Registrar un nuevo pedido o compra de productos en el sistema con asignación de fletero.',
      icon: ICON_MAP[customization.cards?.crear_pedido?.iconName] || Plus,
      defaultIconName: 'Plus',
      color1: customization.cards?.crear_pedido?.color1 || '#10b981',
      color2: customization.cards?.crear_pedido?.color2 || '#047857',
      customIcon: customization.cards?.crear_pedido?.customIcon || null,
      innerBg: 'from-emerald-400 to-green-600',
      shadowColor: 'rgba(16, 185, 129, 0.45)',
      action: () => {
        if (!hasPermission('G3d.CrearPedido.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (G3d.CrearPedido.Acceder)");
          return;
        }
        setG3dOrderToEdit(null);
        setG3dOrderForm(prev => ({
          vendedor: prev.vendedor || '',
          vendedor_telefono: prev.vendedor_telefono || '',
          cliente_nombre: '',
          cliente_telefono: '',
          es_mayorista: false,
          items: [
            { id: 'item-' + Date.now(), cantidad: 1, item: '', descripcion: '', precio: '', imagen: '' }
          ],
          precio: '',
          seña: '',
          producto_confirmado: false
        }));
        setIsG3dOrderModalOpen(true);
      },
      badge: customization.cards?.crear_pedido?.badge || 'Nuevo'
    },
    {
      id: 'lista_precios',
      title: customization.cards?.lista_precios?.title || 'Lista de Precios',
      shortTitle: customization.cards?.lista_precios?.title || 'Precios',
      description: customization.cards?.lista_precios?.description || 'Catálogo completo de productos, variantes y administración de stock en tiempo real.',
      icon: ICON_MAP[customization.cards?.lista_precios?.iconName] || Package,
      defaultIconName: 'Package',
      color1: customization.cards?.lista_precios?.color1 || '#f59e0b',
      color2: customization.cards?.lista_precios?.color2 || '#b45309',
      customIcon: customization.cards?.lista_precios?.customIcon || null,
      innerBg: 'from-amber-400 to-orange-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      action: () => {
        if (!hasPermission('G3d.ListaPrecios.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (G3d.ListaPrecios.Acceder)");
          return;
        }
        navigate('/lista-precios');
      },
      badge: customization.cards?.lista_precios?.badge || 'Catálogo'
    },
    {
      id: 'pedidos_g3d',
      title: customization.cards?.pedidos_g3d?.title || 'Pedidos',
      shortTitle: customization.cards?.pedidos_g3d?.title || 'Pedidos',
      description: customization.cards?.pedidos_g3d?.description || 'Monitoreo y administración del centro de pedidos, control de logística y estados de entrega.',
      icon: ICON_MAP[customization.cards?.pedidos_g3d?.iconName] || ReceiptText,
      defaultIconName: 'ReceiptText',
      color1: customization.cards?.pedidos_g3d?.color1 || '#3b82f6',
      color2: customization.cards?.pedidos_g3d?.color2 || '#1d4ed8',
      customIcon: customization.cards?.pedidos_g3d?.customIcon || null,
      innerBg: 'from-blue-400 to-blue-700',
      shadowColor: 'rgba(59, 130, 246, 0.45)',
      action: () => {
        if (!hasPermission('G3d.Pedidos.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (G3d.Pedidos.Acceder)");
          return;
        }
        navigate('/pedidos?tab=g3d_diseno');
      },
      badge: customization.cards?.pedidos_g3d?.badge || 'Logística'
    },
    {
      id: 'stock_g3d',
      title: customization.cards?.stock_g3d?.title || 'Stock',
      shortTitle: customization.cards?.stock_g3d?.title || 'Stock',
      description: 'Gestión de insumos de fabricación, lista de precios de proveedores y componentes.',
      icon: ICON_MAP['Database'] || Database,
      defaultIconName: 'Database',
      color1: '#8b5cf6',
      color2: '#5b21b6',
      customIcon: null,
      innerBg: 'from-purple-400 to-indigo-650',
      shadowColor: 'rgba(139, 92, 246, 0.45)',
      action: () => {
        if (!hasPermission('G3d.Stock.Acceder')) {
          toast.warning("No tienes permiso para acceder a esta sección (G3d.Stock.Acceder)");
          return;
        }
        navigate('/mis-productos?tab=g3d_precios');
      },
      badge: 'Insumos'
    },
    {
      id: 'volver_main',
      title: 'Volver',
      shortTitle: 'Volver',
      description: 'Regresar al menú de inicio principal de la aplicación.',
      icon: ICON_MAP['ArrowLeft'] || ArrowLeft,
      defaultIconName: 'ArrowLeft',
      color1: '#64748b',
      color2: '#334155',
      customIcon: null,
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => setActiveMenu('main'),
      badge: 'Menú'
    }
  ].filter(item => {
    if (item.id === 'crear_pedido') return hasPermission('G3d.CrearPedido.Ver');
    if (item.id === 'lista_precios') return hasPermission('G3d.ListaPrecios.Ver');
    if (item.id === 'pedidos_g3d') return hasPermission('G3d.Pedidos.Ver');
    if (item.id === 'stock_g3d') return hasPermission('G3d.Stock.Ver');
    return true;
  });

  const utilidadesMenuItems = [
    {
      id: 'simulador_chop',
      title: 'Simulador Jarra Chop',
      shortTitle: 'Simulador',
      description: 'Simulador interactivo de diseño de jarras (chops) en tiempo real con modelador dimensional.',
      icon: ICON_MAP['Beer'] || Beer,
      defaultIconName: 'Beer',
      color1: '#f59e0b',
      color2: '#d97706',
      customIcon: null,
      innerBg: 'from-amber-400 to-orange-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      action: () => {
        if (!hasPermission('Utilidades.SimuladorChop.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Utilidades.SimuladorChop.Acceder)");
          return;
        }
        navigate('/simulador');
      },
      badge: '3D Visualizer'
    },
    {
      id: 'tutoriales',
      title: 'Respuesta Rápida WSP',
      shortTitle: 'Respuestas WSP',
      description: 'Gestor y editor de plantillas de WhatsApp rápidas para enviar accesos directos de inmediato.',
      icon: ICON_MAP['MessageSquareText'] || MessageSquareText,
      defaultIconName: 'MessageSquareText',
      color1: '#14b8a6',
      color2: '#0d9488',
      customIcon: null,
      innerBg: 'from-teal-400 to-teal-600',
      shadowColor: 'rgba(20, 184, 166, 0.45)',
      action: () => {
        if (!hasPermission('Utilidades.Tutoriales.Acceder')) {
          toast.warning("No tienes permiso de Acceso para esta función (Utilidades.Tutoriales.Acceder)");
          return;
        }
        navigate('/xtv?menu=tutoriales');
      },
      badge: 'Respuestas WSP'
    },
    {
      id: 'volver_main',
      title: 'Volver',
      shortTitle: 'Volver',
      description: 'Regresar al menú de inicio principal de la aplicación.',
      icon: ICON_MAP['ArrowLeft'] || ArrowLeft,
      defaultIconName: 'ArrowLeft',
      color1: '#64748b',
      color2: '#334155',
      customIcon: null,
      innerBg: 'from-slate-400 to-slate-600',
      shadowColor: 'rgba(100, 116, 139, 0.45)',
      action: () => setActiveMenu('main'),
      badge: 'Menú'
    }
  ].filter(item => {
    if (item.id === 'simulador_chop') return hasPermission('Utilidades.SimuladorChop.Ver');
    if (item.id === 'tutoriales') return hasPermission('Utilidades.Tutoriales.Ver');
    return true;
  });

  const activeItems = 
    activeMenu === 'g3d' ? g3dMenuItems :
    activeMenu === 'xtv' ? xtvMenuItems :
    activeMenu === 'config' ? configMenuItems :
    activeMenu === 'utilidades' ? utilidadesMenuItems :
    menuItems;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scaleX: 0.2, x: -120 },
    show: { 
      opacity: 1, 
      scaleX: 1,
      x: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 90, 
        damping: 14 
      } 
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6 md:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Hide scrollbar CSS injection */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-4xl w-full mx-auto space-y-8 md:space-y-12 relative">
        
        {/* Botón de Activación de Modo Edición (Solo para Administradores con permiso) */}
        {hasPermission('Admin.ModoEdicionInterface.Habilitar') && (
          <div className="flex justify-end pr-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm border select-none ${
                isEditMode
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Pencil size={12} className={isEditMode ? "animate-bounce" : ""} />
              {isEditMode ? 'Desactivar Edición' : 'Modo Edición'}
            </button>
          </div>
        )}

        {/* Encabezado Principal */}
        <div 
          onClick={() => { if (isEditMode) handleOpenEditWelcome(); }}
          className={`text-center space-y-3 md:space-y-4 relative transition-all duration-200 ${
            isEditMode 
              ? 'ring-2 ring-dashed ring-amber-500/60 p-4 rounded-3xl cursor-pointer hover:bg-amber-500/5 bg-amber-500/2' 
              : ''
          }`}
        >
          {isEditMode && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-30">
              <Pencil size={10} /> Hacer clic para editar textos
            </span>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles size={12} className="text-cyan-500 animate-pulse" />
            {activeMenu === 'g3d' ? "Inicio G3D" : 
             activeMenu === 'xtv' ? "Inicio XTV" :
             activeMenu === 'config' ? "Configuraciones" :
             activeMenu === 'utilidades' ? "Utilidades" :
             (customization.launchpadBadge || "Launchpad Principal")}
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
            {activeMenu === 'g3d' ? "Panel G3D" : 
             activeMenu === 'xtv' ? "Menú XTV" :
             activeMenu === 'config' ? "Configuraciones" : 
             activeMenu === 'utilidades' ? "Utilidades" :
             getGreeting()}{' '}
            {activeMenu === 'main' && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-500 to-indigo-500">
                {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
              </span>
            )}
          </h1>

          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200 max-w-xl mx-auto px-4">
            {activeMenu === 'g3d' ? (
              "Administra tus pedidos, consulta listas de precios y accede al catálogo de stock en tiempo real."
            ) : activeMenu === 'xtv' ? (
              "Creación rápida de cuentas, renovación de demos, solicitudes de créditos, panel central y herramientas para revendedores."
            ) : activeMenu === 'config' ? (
              "Panel de control express con accesos directos a todas las secciones de administración y logística de la aplicación."
            ) : activeMenu === 'utilidades' ? (
              "Acceso directo a herramientas de diseño y plantillas de comunicación interactiva para tus redes."
            ) : (
              customization.launchpadSubtext || (
                <>
                  Bienvenido al panel central de control de{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {businessProfile?.nombre_negocio || 'G3D System'}
                  </span>
                  . Selecciona una sección para comenzar.
                </>
              )
            )}
          </p>
        </div>

        {activeMenu !== 'main' && (
          <div className="flex justify-start px-1 sm:px-4 md:px-0 mb-2">
            <button
              onClick={() => changeMenu('main')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300"
            >
              <ArrowLeft size={12} />
              Volver al Inicio
            </button>
          </div>
        )}

        {/* Grilla Responsiva para Móvil (3 columnas) y Escritorio (múltiples columnas fluyentes) */}
        <div 
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 py-4 px-1 sm:px-4 md:px-0 w-full items-stretch"
        >
          {activeItems.map((item: any) => {
            const Icon = item.icon;
            const hasSubs = !!item.subButtons;

            return (
              <div key={item.id} className="relative flex flex-col justify-between py-1 h-full">
                <motion.div
                  whileHover={isEditMode ? {} : { scale: 1.03, y: -2 }}
                  whileTap={isEditMode ? {} : { scale: 0.98 }}
                  onClick={() => {
                    if (isEditMode) {
                      handleOpenEditCard(item);
                    } else {
                      item.action();
                    }
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${item.color1} 0%, ${item.color2} 100%)`,
                    boxShadow: isEditMode 
                      ? 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.4), 0 0 15px rgba(245, 158, 11, 0.4)'
                      : 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.4), 0 4px 8px -1px rgba(0, 0, 0, 0.2)'
                  }}
                  className={`group relative flex-1 flex flex-col items-center justify-center text-center rounded-2xl border text-white cursor-pointer select-none transition-all duration-200 overflow-hidden aspect-square p-2 sm:p-3 md:p-4 lg:p-5 ${
                    isEditMode 
                      ? 'border-amber-500 ring-2 ring-amber-500 scale-98 brightness-95 hover:brightness-100 hover:scale-100' 
                      : 'border-white/20'
                  }`}
                >
                  {isEditMode && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 p-1.5 rounded-lg z-20 shadow-md flex items-center justify-center animate-pulse">
                      <Pencil size={11} />
                    </div>
                  )}

                  {/* Metallic Highlight Gloss Flare */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                  {/* Icono libre y centrado */}
                  <div className="flex items-center justify-center mb-1 sm:mb-2 md:mb-3">
                    {item.customIcon ? (
                      <img src={item.customIcon} className="size-8 xs:size-9 sm:size-11 md:size-12 lg:size-14 xl:size-16 object-contain drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" alt="" />
                    ) : (
                      <Icon className="size-7 xs:size-8 sm:size-10 md:size-11 lg:size-13 xl:size-15 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" />
                    )}
                  </div>

                  {/* Body: Título Completo Envolvente centrado */}
                  <div className="w-full text-center px-1">
                    <h3 className="text-[9.5px] xs:text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-black uppercase tracking-wide text-white leading-tight drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)] whitespace-normal break-words">
                      {item.title}
                    </h3>
                  </div>

                  {/* Footer: Sub-botones integrados de forma limpia */}
                  {hasSubs && item.subButtons && (
                    <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-white/15 w-full">
                      {item.subButtons.map((btn) => (
                        <button
                          key={btn.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditMode) {
                              handleOpenEditCard(item);
                            } else {
                              btn.action();
                            }
                          }}
                          className="py-1 px-0.5 bg-white/15 hover:bg-white/25 border border-white/10 hover:border-white/20 text-white rounded-lg text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer shadow-sm truncate"
                        >
                          {btn.label.replace('WSP ', '')}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
                
                {/* Sombra de apoyo sutil */}
                <div 
                  className="absolute -bottom-1 left-[8%] right-[8%] h-2 bg-black/25 blur-[4px] rounded-full pointer-events-none transition-all duration-300 group-hover:bg-black/35 group-hover:blur-[5px]"
                />
              </div>
            );
          })}
        </div>

        {/* Banner de Info / Rol actual */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Nivel de Acceso</p>
              <p className="text-[11px] font-medium text-slate-500">
                Iniciaste sesión como <span className="font-bold text-primary">{userRole || 'Usuario'}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {isG3dVendedor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-950/50">
                <Building2 size={12} />
                Perfil Comercial Activo
              </span>
            )}
          </div>
        </motion.div>

      </div>

      {/* MODALES DE EDICIÓN */}
      
      {/* 1. Modal de Edición de Bienvenida */}
      {editWelcomeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil size={16} className="text-amber-500" />
                Editar Textos de Bienvenida
              </h3>
              <button onClick={() => setEditWelcomeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Badge Superior</label>
                <input 
                  type="text" 
                  value={tempWelcome.badge}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, badge: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Título de Bienvenida (Vacío para dinámico)</label>
                <input 
                  type="text" 
                  placeholder="Ej: ¡HOLA FAMILIA!"
                  value={tempWelcome.greeting}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, greeting: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
                <p className="text-[9px] text-slate-500 dark:text-slate-100 mt-1">Si está vacío, cambiará automáticamente según la hora ("¡Buenos días!", "¡Buenas tardes!", etc.)</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Subtexto / Leyenda</label>
                <textarea 
                  rows={3}
                  value={tempWelcome.subtext}
                  onChange={(e) => setTempWelcome({ ...tempWelcome, subtext: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold resize-none"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setEditWelcomeModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveWelcome}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal de Edición de Tarjetas */}
      {editCardId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil size={16} className="text-amber-500" />
                Editar Sección: {tempCard.title}
              </h3>
              <button onClick={() => setEditCardId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Título de Sección</label>
                <input 
                  type="text" 
                  value={tempCard.title}
                  onChange={(e) => setTempCard({ ...tempCard, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Badge Informativo</label>
                <input 
                  type="text" 
                  value={tempCard.badge}
                  onChange={(e) => setTempCard({ ...tempCard, badge: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Descripción de la Sección</label>
                <textarea 
                  rows={3}
                  value={tempCard.description}
                  onChange={(e) => setTempCard({ ...tempCard, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-2">Seleccionar Ícono del Catálogo</label>
                <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-150 dark:border-slate-900">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const IconComponent = ICON_MAP[iconKey];
                    const isSelected = tempCard.iconName === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setTempCard({ ...tempCard, iconName: iconKey })}
                        className={`size-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/20 border-primary text-primary scale-105 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                        title={iconKey}
                      >
                        <IconComponent size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cargar nuevo SVG / PNG */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Cargar Ícono Personalizado (SVG / PNG)</label>
                
                {tempCard.customIcon ? (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="size-12 rounded-xl bg-slate-950/20 backdrop-blur-sm flex items-center justify-center border border-slate-200/20 shadow-sm p-1">
                      <img src={tempCard.customIcon} className="size-full object-contain" alt="Custom Icon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Ícono Personalizado Activo</p>
                      <p className="text-[10px] text-slate-400">Guardado en formato base64</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTempCard({ ...tempCard, customIcon: null })}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempCard(prev => ({ ...prev, customIcon: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/png, image/svg+xml, image/jpeg';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTempCard(prev => ({ ...prev, customIcon: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30 flex flex-col items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-2xl text-slate-500 dark:text-slate-100">upload_file</span>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Arrastra un archivo aquí o haz clic para explorar</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-100 uppercase tracking-widest mt-0.5">Soporta SVG, PNG y JPG (se adaptará al diseño)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Gradient Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1.5">Color de Fondo 1</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={tempCard.color1 || '#0074cc'}
                      onChange={(e) => setTempCard({ ...tempCard, color1: e.target.value })}
                      className="size-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={tempCard.color1 || '#0074cc'}
                      onChange={(e) => setTempCard({ ...tempCard, color1: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1.5">Color de Fondo 2</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={tempCard.color2 || '#004580'}
                      onChange={(e) => setTempCard({ ...tempCard, color2: e.target.value })}
                      className="size-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 p-0 overflow-hidden"
                    />
                    <input 
                      type="text"
                      value={tempCard.color2 || '#004580'}
                      onChange={(e) => setTempCard({ ...tempCard, color2: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-botones (solo si existen originalmente) */}
              {tempCard.subButtons && tempCard.subButtons.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">Sub-Botones de Acceso Rápido</label>
                  <div className="space-y-2">
                    {tempCard.subButtons.map((btn, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-[10px] font-black text-slate-400 w-12 uppercase">Botón {index+1}</span>
                        <input 
                          type="text" 
                          value={btn.label}
                          onChange={(e) => {
                            const updatedBtns = [...tempCard.subButtons];
                            updatedBtns[index] = { ...updatedBtns[index], label: e.target.value };
                            setTempCard({ ...tempCard, subButtons: updatedBtns });
                          }}
                          placeholder="Etiqueta"
                          className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => setEditCardId(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveCard}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal de Crear/Editar Pedido G3D */}
      {isG3dOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-full md:max-w-6xl lg:max-w-[1450px] w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus size={20} className="text-emerald-500" />
                {g3dOrderToEdit ? 'Editar Pedido de Diseño G3D' : 'Crear Pedido de Diseño G3D'}
              </h3>
              <button 
                onClick={() => setIsG3dOrderModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              
              {/* Bloque de Datos de Vendedor y Cliente */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Vendedor Dropdown o Input Manual */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                      Nombre del Vendedor *
                    </label>
                    {(hasPermission('G3d.CrearPedido.EscribirVendedor') || hasPermission('Admin.*') || userRole === 'Admin') ? (
                      <>
                        <input
                          type="text"
                          list="g3d-vendedores-list"
                          value={g3dOrderForm.vendedor || ''}
                          onChange={handleVendorInputChange}
                          placeholder="Escribe o selecciona vendedor..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                        />
                        <datalist id="g3d-vendedores-list">
                          {g3dVendors.map((v) => (
                            <option key={v.id} value={v.nombre || v.email} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <select
                        value={g3dOrderForm.vendedor || ''}
                        onChange={handleVendorChange}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                      >
                        <option value="">Selecciona un vendedor...</option>
                        {g3dVendors.map((v) => {
                          const value = v.nombre || v.email;
                          return (
                            <option key={v.id} value={value}>
                              {v.nombre || v.email}
                            </option>
                          );
                        })}
                        {g3dOrderForm.vendedor && !g3dVendors.some(v => (v.nombre || v.email) === g3dOrderForm.vendedor) && (
                          <option value={g3dOrderForm.vendedor}>
                            {g3dOrderForm.vendedor}
                          </option>
                        )}
                      </select>
                    )}
                  </div>

                  {/* Teléfono del Vendedor */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                      Teléfono del Vendedor
                    </label>
                    <input 
                      type="text" 
                      placeholder="Teléfono del vendedor asignado"
                      value={g3dOrderForm.vendedor_telefono || ''}
                      onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, vendedor_telefono: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                    />
                  </div>

                  {/* Switch para Precio Mayorista */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Precio Mayorista</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Forzar Tarifa</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newWholesale = !g3dOrderForm.es_mayorista;
                        setG3dOrderForm(prev => {
                          const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                          const updatedItems = currentItems.map(row => {
                            const selectedProduct = g3dProducts.find(p => p.id === row.producto_id);
                            if (selectedProduct) {
                              let calculatedPrice = row.precio;
                              if (row.variante_id) {
                                const variant = selectedProduct.variantes?.find((v: any) => v.id === row.variante_id);
                                if (variant) {
                                  if (newWholesale) {
                                    calculatedPrice = (variant.precio_mayorista && variant.precio_mayorista > 0)
                                      ? variant.precio_mayorista
                                      : (selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : (variant.precio || selectedProduct.precio));
                                  } else {
                                    calculatedPrice = (variant.precio && variant.precio > 0)
                                      ? variant.precio
                                      : selectedProduct.precio;
                                  }
                                }
                              } else {
                                calculatedPrice = newWholesale && selectedProduct.precio_mayorista > 0
                                  ? selectedProduct.precio_mayorista
                                  : selectedProduct.precio;
                              }
                              return { ...row, precio: calculatedPrice };
                            }
                            return row;
                          });

                          return {
                            ...prev,
                            es_mayorista: newWholesale,
                            items: updatedItems
                          };
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        g3dOrderForm.es_mayorista ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          g3dOrderForm.es_mayorista ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliente Nombre */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                      Nombre Completo del Cliente
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Juan Pérez"
                      value={g3dOrderForm.cliente_nombre || ''}
                      onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, cliente_nombre: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                    />
                  </div>

                  {/* Cliente Teléfono */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                      Teléfono del Cliente
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: +54 9 11 1234-5678"
                      value={g3dOrderForm.cliente_telefono || ''}
                      onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, cliente_telefono: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla Interactiva de Items */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-emerald-500" />
                    Detalle de Items del Pedido
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {g3dOrderForm.items.length} {g3dOrderForm.items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {/* Vista Escritorio (Tabla limpia sin isla, basada en div para evitar problemas de capas) */}
                <div className="hidden md:block overflow-visible">
                  {/* Encabezado */}
                  <div className="grid grid-cols-[80px_320px_1fr_120px_160px_110px_40px] gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-100 font-black uppercase tracking-wider text-[9px] px-2">
                    <div className="text-center">Cant.</div>
                    <div>Item / Producto</div>
                    <div>Descripción</div>
                    <div>Precio ($)</div>
                    <div className="text-center">Muestras & Pagos ($)</div>
                    <div className="text-center">Confirmar</div>
                    <div></div>
                  </div>

                  {/* Filas */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-visible">
                    {g3dOrderForm.items.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-[80px_320px_1fr_120px_160px_110px_40px] gap-3 items-start py-3.5 px-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/5 transition-colors overflow-visible">
                        {/* Cantidad */}
                        <div>
                          <input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={row.cantidad ?? ''}
                            onChange={(e) => handleUpdateItemField(index, 'cantidad', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs"
                          />
                        </div>

                        {/* Item / Producto */}
                        <div className="relative overflow-visible">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="Buscar o escribir producto..."
                              value={row.item ?? ''}
                              onChange={(e) => {
                                handleUpdateItemField(index, 'item', e.target.value);
                                if (row.producto_id) {
                                  handleUpdateItemField(index, 'producto_id', '');
                                  handleUpdateItemField(index, 'variante_id', '');
                                }
                              }}
                              onFocus={() => setFocusedItemIdx(index)}
                              className="w-full pr-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setFocusedItemIdx(prev => prev === index ? null : index)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer z-10"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Selector Secundario de Variantes (si el producto seleccionado posee variantes) */}
                          {row.producto_id && (
                            (() => {
                              const prod = g3dProducts.find(p => p.id === row.producto_id);
                              if (prod && prod.variantes && prod.variantes.length > 0) {
                                return (
                                  <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Variante:</span>
                                    <select
                                      value={row.variante_id || ''}
                                      onChange={(e) => {
                                        const vId = e.target.value;
                                        const matchedV = prod.variantes.find((v: any) => v.id === vId);
                                        if (matchedV) {
                                          const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                          const variantPrice = isWholesale && matchedV.precio_mayorista > 0 ? matchedV.precio_mayorista : (matchedV.precio || prod.precio);
                                          handleUpdateItemField(index, 'item', `${prod.nombre} (${matchedV.combinacion})`);
                                          handleUpdateItemField(index, 'variante_id', matchedV.id);
                                          handleUpdateItemField(index, 'precio', variantPrice);
                                          if (matchedV.imagen || matchedV.imagen_url) {
                                            handleUpdateItemField(index, 'imagen', matchedV.imagen || matchedV.imagen_url);
                                          }
                                        } else {
                                          const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                          const basePrice = isWholesale && prod.precio_mayorista > 0 ? prod.precio_mayorista : prod.precio;
                                          handleUpdateItemField(index, 'item', prod.nombre);
                                          handleUpdateItemField(index, 'variante_id', '');
                                          handleUpdateItemField(index, 'precio', basePrice);
                                        }
                                      }}
                                      className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    >
                                      <option value="">➖ Seleccionar Variable...</option>
                                      {prod.variantes.map((v: any) => (
                                        <option key={v.id} value={v.id}>
                                          {v.combinacion} (${(g3dOrderForm.es_mayorista && v.precio_mayorista > 0) ? v.precio_mayorista : v.precio})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()
                          )}

                          {focusedItemIdx === index && (
                            <>
                              <div 
                                className="fixed inset-0 z-30" 
                                onClick={() => setFocusedItemIdx(null)} 
                              />
                              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-40 divide-y divide-slate-100 dark:divide-slate-800">
                                {g3dProducts.filter(p => p.nombre.toLowerCase().includes((row.item || '').toLowerCase())).length === 0 ? (
                                  <div className="p-3 text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold">
                                    Sin coincidencias directas.
                                  </div>
                                ) : (
                                  g3dProducts.filter(p => p.nombre.toLowerCase().includes((row.item || '').toLowerCase())).map((p) => {
                                    const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                    const defaultPrice = isWholesale && p.precio_mayorista > 0 ? p.precio_mayorista : p.precio;
                                    const canSeeWholesale = hasPermission('G3d.PrecioMayorista.Ver');

                                    return (
                                      <div key={p.id} className="flex flex-col bg-slate-50/50 dark:bg-slate-900/10">
                                        {/* Fila del Producto Base */}
                                        <div className="w-full px-3 py-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors text-xs border-none">
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {p.imagen ? (
                                              <img src={p.imagen} className="size-7.5 rounded object-cover border border-slate-100 dark:border-slate-850" alt="" />
                                            ) : (
                                              <div className="size-7.5 rounded bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Package size={11} />
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.categoria}</p>
                                            </div>
                                          </div>
                                          
                                          {(() => {
                                            const pWholesale = (p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : Number(p.precio || 0);
                                            return (
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleUpdateItemField(index, 'item', p.nombre);
                                                    handleUpdateItemField(index, 'producto_id', p.id);
                                                    handleUpdateItemField(index, 'variante_id', '');
                                                    handleUpdateItemField(index, 'precio', isWholesale ? pWholesale : p.precio);
                                                    handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                    if (p.imagen) {
                                                      handleUpdateItemField(index, 'imagen', p.imagen);
                                                    }
                                                    setFocusedItemIdx(null);
                                                  }}
                                                  className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[9.5px] font-black uppercase rounded-lg border border-emerald-500/20 shadow-sm cursor-pointer"
                                                  title="Precio minorista"
                                                >
                                                  Min: ${p.precio}
                                                </button>
                                                {isWholesale && (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      handleUpdateItemField(index, 'item', p.nombre);
                                                      handleUpdateItemField(index, 'producto_id', p.id);
                                                      handleUpdateItemField(index, 'variante_id', '');
                                                      handleUpdateItemField(index, 'precio', pWholesale);
                                                      handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                      if (p.imagen) {
                                                        handleUpdateItemField(index, 'imagen', p.imagen);
                                                      }
                                                      setFocusedItemIdx(null);
                                                    }}
                                                    className="px-2.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-[9.5px] font-black uppercase rounded-lg border border-amber-500/20 shadow-sm cursor-pointer"
                                                    title="Precio mayorista"
                                                  >
                                                    May: ${pWholesale}
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        {/* Variantes del Producto */}
                                        {p.variantes && p.variantes.length > 0 && (
                                          <div className="bg-slate-100/30 dark:bg-slate-950/20 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                            {p.variantes.map((v: any) => {
                                              const vMin = (v.precio && Number(v.precio) > 0) ? Number(v.precio) : Number(p.precio || 0);
                                              const vWholesale = (v.precio_mayorista && Number(v.precio_mayorista) > 0)
                                                ? Number(v.precio_mayorista)
                                                : ((p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : vMin);

                                              let variantImg = '';
                                              if (v.imagenes && v.imagenes.length > 0) {
                                                variantImg = v.imagenes[0];
                                              } else if (v.imagen_url && v.imagen_url.startsWith('[')) {
                                                try {
                                                  const parsed = JSON.parse(v.imagen_url);
                                                  if (parsed && parsed.length > 0) {
                                                    variantImg = parsed[0];
                                                  }
                                                } catch (e) {
                                                  variantImg = v.imagen_url;
                                                }
                                              } else {
                                                variantImg = v.imagen || v.imagen_url || '';
                                              }
                                              if (!variantImg) {
                                                variantImg = p.imagen || '';
                                              }

                                              return (
                                                <div
                                                  key={v.id}
                                                  className="w-full text-left pl-7 pr-3 py-2 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 flex items-center justify-between gap-3 transition-colors border-none"
                                                >
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {variantImg ? (
                                                      <img src={variantImg} className="size-5.5 rounded object-cover border border-slate-100 dark:border-slate-850" alt="" />
                                                    ) : (
                                                      <div className="size-5.5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <Layers size={9} />
                                                      </div>
                                                    )}
                                                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-350 truncate">
                                                      <span className="text-amber-500/70 font-bold mr-1">↳</span> {v.combinacion}
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleUpdateItemField(index, 'item', `${p.nombre} (${v.combinacion})`);
                                                        handleUpdateItemField(index, 'producto_id', p.id);
                                                        handleUpdateItemField(index, 'variante_id', v.id);
                                                        handleUpdateItemField(index, 'precio', isWholesale ? vWholesale : vMin);
                                                        handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                        if (variantImg) {
                                                          handleUpdateItemField(index, 'imagen', variantImg);
                                                        }
                                                        setFocusedItemIdx(null);
                                                      }}
                                                      className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-emerald-500/20 shadow-sm cursor-pointer"
                                                      title="Precio minorista"
                                                    >
                                                      Min: ${vMin}
                                                    </button>
                                                    {isWholesale && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          handleUpdateItemField(index, 'item', `${p.nombre} (${v.combinacion})`);
                                                          handleUpdateItemField(index, 'producto_id', p.id);
                                                          handleUpdateItemField(index, 'variante_id', v.id);
                                                          handleUpdateItemField(index, 'precio', vWholesale);
                                                          handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                          if (variantImg) {
                                                            handleUpdateItemField(index, 'imagen', variantImg);
                                                          }
                                                          setFocusedItemIdx(null);
                                                        }}
                                                        className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-amber-500/20 shadow-sm cursor-pointer"
                                                        title="Precio mayorista"
                                                      >
                                                        May: ${vWholesale}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </>
                          )}

                          {/* Dropdown de variantes */}
                          {(() => {
                            const selectedProduct = g3dProducts.find(p => p.id === row.producto_id);
                            if (!selectedProduct || !selectedProduct.variantes || selectedProduct.variantes.length === 0) return null;
                            
                            const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                            return (
                              <div className="mt-1.5">
                                <select
                                  value={row.variante_id || ''}
                                  onChange={(e) => {
                                    const varId = e.target.value;
                                    const variant = selectedProduct.variantes.find((v: any) => v.id === varId);
                                    if (variant) {
                                      let variantPrice = 0;
                                      if (isWholesale) {
                                        variantPrice = (variant.precio_mayorista && variant.precio_mayorista > 0)
                                          ? variant.precio_mayorista
                                          : (selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : (variant.precio || selectedProduct.precio));
                                      } else {
                                        variantPrice = (variant.precio && variant.precio > 0)
                                          ? variant.precio
                                          : selectedProduct.precio;
                                      }
                                      
                                      handleUpdateItemField(index, 'item', `${selectedProduct.nombre} (${variant.combinacion})`);
                                      handleUpdateItemField(index, 'precio', variantPrice);
                                      handleUpdateItemField(index, 'variante_id', varId);
                                      
                                      let variantImg = '';
                                      if (variant.imagenes && variant.imagenes.length > 0) {
                                        variantImg = variant.imagenes[0];
                                      } else if (variant.imagen_url && variant.imagen_url.startsWith('[')) {
                                        try {
                                          const parsed = JSON.parse(variant.imagen_url);
                                          if (parsed && parsed.length > 0) {
                                            variantImg = parsed[0];
                                          }
                                        } catch (e) {
                                          variantImg = variant.imagen_url;
                                        }
                                      } else {
                                        variantImg = variant.imagen || variant.imagen_url || '';
                                      }
                                      if (!variantImg) {
                                        variantImg = selectedProduct.imagen || '';
                                      }
                                      if (variantImg) {
                                        handleUpdateItemField(index, 'imagen', variantImg);
                                      }
                                    } else {
                                      const basePrice = isWholesale && selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : selectedProduct.precio;
                                      handleUpdateItemField(index, 'item', selectedProduct.nombre);
                                      handleUpdateItemField(index, 'precio', basePrice);
                                      handleUpdateItemField(index, 'variante_id', '');
                                      if (selectedProduct.imagen) {
                                        handleUpdateItemField(index, 'imagen', selectedProduct.imagen);
                                      }
                                    }
                                  }}
                                  className="w-full text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg px-2 py-1 font-bold text-emerald-800 dark:text-emerald-400 focus:outline-none"
                                >
                                  <option value="">-- Seleccionar Variante --</option>
                                  {selectedProduct.variantes.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                      {v.combinacion} (${v.precio && v.precio > 0 ? v.precio : (isWholesale && selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : selectedProduct.precio)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Descripción */}
                        <div>
                          <input
                            type="text"
                            placeholder="Descripción / notas"
                            value={row.descripcion || ''}
                            onChange={(e) => handleUpdateItemField(index, 'descripcion', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs"
                          />
                        </div>

                        {/* Precio */}
                        <div>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={row.precio ?? ''}
                              onChange={(e) => handleUpdateItemField(index, 'precio', e.target.value)}
                              className="w-full pl-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs"
                            />
                          </div>
                        </div>

                        {/* Muestras y Capturas de Pago ($) */}
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Botones de Carga */}
                          <div className="flex items-center gap-1">
                            {/* Botón Subir Muestras */}
                            <label
                              title="Subir foto de muestra para fabricación"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                            >
                              <Upload size={13} />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleUploadItemImage(index, e)}
                              />
                            </label>

                            {/* Botón $ Subir Capturas de Pago */}
                            <label
                              title="Subir captura / comprobante de pago ($)"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-lg cursor-pointer transition-all border border-emerald-500/30 flex items-center justify-center font-black"
                            >
                              <DollarSign size={13} />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleUploadItemPaymentCapture(index, e)}
                              />
                            </label>
                          </div>

                          {/* Miniaturas */}
                          {(() => {
                            const itemImgs: string[] = getProductImages(row);
                            const itemCaptures: string[] = Array.isArray(row.capturas_pago) ? row.capturas_pago : [];

                            return (
                              <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] p-0.5 scrollbar-none">
                                {/* Muestras */}
                                {itemImgs.map((imgSrc, imgIdx) => (
                                  <div key={`sample-${imgIdx}`} className="relative size-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 group shrink-0 shadow-sm" title="Foto de Muestra">
                                    <img 
                                      src={imgSrc} 
                                      alt={`Muestra ${imgIdx + 1}`} 
                                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                      className="w-full h-full object-cover" 
                                    />
                                    <button
                                      type="button"
                                      title="Eliminar muestra"
                                      onClick={() => {
                                        setG3dOrderForm(prev => {
                                          const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                                          const updated = currentItems.map((r, i) => {
                                            if (i === index) {
                                              const imgs = Array.isArray(r.imagenes) ? r.imagenes : (r.imagen ? [r.imagen] : []);
                                              const filtered = imgs.filter((_, k) => k !== imgIdx);
                                              return {
                                                ...r,
                                                imagen: filtered[0] || '',
                                                imagenes: filtered
                                              };
                                            }
                                            return r;
                                          });
                                          return { ...prev, items: updated };
                                        });
                                      }}
                                      className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-lg"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}

                                {/* Capturas de Pago ($) */}
                                {itemCaptures.map((capUrl, capIdx) => (
                                  <div key={`pay-${capIdx}`} className="relative size-7 rounded-lg overflow-hidden border-2 border-emerald-500 group shrink-0 shadow-sm" title="Captura de Pago ($)">
                                    <img 
                                      src={capUrl} 
                                      alt={`Pago ${capIdx + 1}`} 
                                      className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[7px] font-black px-0.5 rounded-bl">
                                      $
                                    </div>
                                    <button
                                      type="button"
                                      title="Eliminar captura de pago"
                                      onClick={() => {
                                        setG3dOrderForm(prev => {
                                          const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                                          const updated = currentItems.map((r, i) => {
                                            if (i === index) {
                                              const caps = Array.isArray(r.capturas_pago) ? r.capturas_pago : [];
                                              const filtered = caps.filter((_, k) => k !== capIdx);
                                              return {
                                                ...r,
                                                capturas_pago: filtered,
                                                comprobantes_pago: filtered
                                              };
                                            }
                                            return r;
                                          });
                                          return { ...prev, items: updated };
                                        });
                                      }}
                                      className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-lg"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Confirmar Ítem Individual */}
                        <div className="flex items-center justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleItemConfirm(index)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                              Boolean(row.confirmado) 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title={row.confirmado ? 'Ítem confirmado para fabricación' : 'Hacer clic para confirmar ítem'}
                          >
                            <CheckCircle2 size={12} />
                            <span>{row.confirmado ? 'OK' : 'Confirmar'}</span>
                          </button>
                        </div>

                        {/* Eliminar Fila */}
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            disabled={g3dOrderForm.items.length <= 1}
                            onClick={() => handleRemoveItemRow(index)}
                            className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vista Móvil (vertical - limpia y optimizada, libre de islas) */}
                <div className="block md:hidden space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-visible">
                  {g3dOrderForm.items.map((row, index) => (
                    <div key={row.id} className="pt-4 first:pt-0 space-y-3.5 overflow-visible">
                      <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-200 tracking-wider">
                          Ítem #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Botón Confirmar Ítem */}
                          <button
                            type="button"
                            onClick={() => handleToggleItemConfirm(index)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                              Boolean(row.confirmado) 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 size={12} />
                            <span>{row.confirmado ? 'Confirmado' : 'Confirmar'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={g3dOrderForm.items.length <= 1}
                            onClick={() => handleRemoveItemRow(index)}
                            className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3.5 overflow-visible">
                        {/* Cantidad */}
                        <div className="col-span-3 space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={row.cantidad ?? ''}
                            onChange={(e) => handleUpdateItemField(index, 'cantidad', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs shadow-sm"
                          />
                        </div>

                        {/* Item / Producto */}
                        <div className="col-span-9 space-y-1 overflow-visible">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Producto / Servicio</label>
                          <div className="relative">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="Buscar o escribir..."
                                value={row.item ?? ''}
                                onChange={(e) => {
                                  handleUpdateItemField(index, 'item', e.target.value);
                                  if (row.producto_id) {
                                    handleUpdateItemField(index, 'producto_id', '');
                                    handleUpdateItemField(index, 'variante_id', '');
                                  }
                                }}
                                onFocus={() => setFocusedItemIdx(index)}
                                className="w-full pr-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setFocusedItemIdx(prev => prev === index ? null : index)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer z-10"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            {/* Selector Secundario de Variantes (si el producto seleccionado posee variantes) */}
                            {row.producto_id && (
                              (() => {
                                const prod = g3dProducts.find(p => p.id === row.producto_id);
                                if (prod && prod.variantes && prod.variantes.length > 0) {
                                  return (
                                    <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                                      <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Variante:</span>
                                      <select
                                        value={row.variante_id || ''}
                                        onChange={(e) => {
                                          const vId = e.target.value;
                                          const matchedV = prod.variantes.find((v: any) => v.id === vId);
                                          if (matchedV) {
                                            const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                            const variantPrice = isWholesale && matchedV.precio_mayorista > 0 ? matchedV.precio_mayorista : (matchedV.precio || prod.precio);
                                            handleUpdateItemField(index, 'item', `${prod.nombre} (${matchedV.combinacion})`);
                                            handleUpdateItemField(index, 'variante_id', matchedV.id);
                                            handleUpdateItemField(index, 'precio', variantPrice);
                                            if (matchedV.imagen || matchedV.imagen_url) {
                                              handleUpdateItemField(index, 'imagen', matchedV.imagen || matchedV.imagen_url);
                                            }
                                          } else {
                                            const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                            const basePrice = isWholesale && prod.precio_mayorista > 0 ? prod.precio_mayorista : prod.precio;
                                            handleUpdateItemField(index, 'item', prod.nombre);
                                            handleUpdateItemField(index, 'variante_id', '');
                                            handleUpdateItemField(index, 'precio', basePrice);
                                          }
                                        }}
                                        className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                      >
                                        <option value="">➖ Seleccionar Variable...</option>
                                        {prod.variantes.map((v: any) => (
                                          <option key={v.id} value={v.id}>
                                            {v.combinacion} (${(g3dOrderForm.es_mayorista && v.precio_mayorista > 0) ? v.precio_mayorista : v.precio})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                }
                                return null;
                              })()
                            )}

                            {focusedItemIdx === index && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setFocusedItemIdx(null)} 
                                />
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-40 divide-y divide-slate-100 dark:divide-slate-800">
                                  {g3dProducts.filter(p => p.nombre.toLowerCase().includes((row.item || '').toLowerCase())).length === 0 ? (
                                    <div className="p-3 text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold">
                                      Sin coincidencias directas.
                                    </div>
                                  ) : (
                                    g3dProducts.filter(p => p.nombre.toLowerCase().includes((row.item || '').toLowerCase())).map((p) => {
                                      const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                                      const defaultPrice = isWholesale && p.precio_mayorista > 0 ? p.precio_mayorista : p.precio;
                                      const canSeeWholesale = hasPermission('G3d.PrecioMayorista.Ver');

                                      return (
                                        <div key={p.id} className="flex flex-col bg-slate-50/50 dark:bg-slate-900/10">
                                          {/* Fila del Producto Base */}
                                          <div className="w-full px-3 py-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors text-xs border-none">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                              {p.imagen ? (
                                                <img src={p.imagen} className="size-7 rounded object-cover border border-slate-100 dark:border-slate-850" alt="" />
                                              ) : (
                                                <div className="size-7 rounded bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Package size={11} />
                                                </div>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.categoria}</p>
                                              </div>
                                            </div>
                                            
                                            {(() => {
                                              const pWholesale = (p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : Number(p.precio || 0);
                                              return (
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      handleUpdateItemField(index, 'item', p.nombre);
                                                      handleUpdateItemField(index, 'producto_id', p.id);
                                                      handleUpdateItemField(index, 'variante_id', '');
                                                      handleUpdateItemField(index, 'precio', isWholesale ? pWholesale : p.precio);
                                                      handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                      if (p.imagen) {
                                                        handleUpdateItemField(index, 'imagen', p.imagen);
                                                      }
                                                      setFocusedItemIdx(null);
                                                    }}
                                                    className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-emerald-500/20 shadow-sm cursor-pointer"
                                                    title="Precio minorista"
                                                  >
                                                    Min: ${p.precio}
                                                  </button>
                                                  {isWholesale && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleUpdateItemField(index, 'item', p.nombre);
                                                        handleUpdateItemField(index, 'producto_id', p.id);
                                                        handleUpdateItemField(index, 'variante_id', '');
                                                        handleUpdateItemField(index, 'precio', pWholesale);
                                                        handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                        if (p.imagen) {
                                                          handleUpdateItemField(index, 'imagen', p.imagen);
                                                        }
                                                        setFocusedItemIdx(null);
                                                      }}
                                                      className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-amber-500/20 shadow-sm cursor-pointer"
                                                      title="Precio mayorista"
                                                    >
                                                      May: ${pWholesale}
                                                    </button>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          {/* Variantes del Producto */}
                                          {p.variantes && p.variantes.length > 0 && (
                                            <div className="bg-slate-100/30 dark:bg-slate-950/20 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                              {p.variantes.map((v: any) => {
                                                const vMin = (v.precio && Number(v.precio) > 0) ? Number(v.precio) : Number(p.precio || 0);
                                                const vWholesale = (v.precio_mayorista && Number(v.precio_mayorista) > 0)
                                                  ? Number(v.precio_mayorista)
                                                  : ((p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : vMin);

                                                let variantImg = '';
                                                if (v.imagenes && v.imagenes.length > 0) {
                                                  variantImg = v.imagenes[0];
                                                } else if (v.imagen_url && v.imagen_url.startsWith('[')) {
                                                  try {
                                                    const parsed = JSON.parse(v.imagen_url);
                                                    if (parsed && parsed.length > 0) {
                                                      variantImg = parsed[0];
                                                    }
                                                  } catch (e) {
                                                    variantImg = v.imagen_url;
                                                  }
                                                } else {
                                                  variantImg = v.imagen || v.imagen_url || '';
                                                }
                                                if (!variantImg) {
                                                  variantImg = p.imagen || '';
                                                }

                                                return (
                                                  <div
                                                    key={v.id}
                                                    className="w-full text-left pl-7 pr-3 py-2 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 flex items-center justify-between gap-3 transition-colors border-none"
                                                  >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                      {variantImg ? (
                                                        <img src={variantImg} className="size-5.5 rounded object-cover border border-slate-100 dark:border-slate-850" alt="" />
                                                      ) : (
                                                        <div className="size-5.5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                          <Layers size={9} />
                                                        </div>
                                                      )}
                                                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-350 truncate">
                                                        <span className="text-amber-500/70 font-bold mr-1">↳</span> {v.combinacion}
                                                      </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          handleUpdateItemField(index, 'item', `${p.nombre} (${v.combinacion})`);
                                                          handleUpdateItemField(index, 'producto_id', p.id);
                                                          handleUpdateItemField(index, 'variante_id', v.id);
                                                          handleUpdateItemField(index, 'precio', isWholesale ? vWholesale : vMin);
                                                          handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                          if (variantImg) {
                                                            handleUpdateItemField(index, 'imagen', variantImg);
                                                          }
                                                          setFocusedItemIdx(null);
                                                        }}
                                                        className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-emerald-500/20 shadow-sm cursor-pointer"
                                                        title="Precio minorista"
                                                      >
                                                        Min: ${vMin}
                                                      </button>
                                                      {isWholesale && (
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            handleUpdateItemField(index, 'item', `${p.nombre} (${v.combinacion})`);
                                                            handleUpdateItemField(index, 'producto_id', p.id);
                                                            handleUpdateItemField(index, 'variante_id', v.id);
                                                            handleUpdateItemField(index, 'precio', vWholesale);
                                                            handleUpdateItemField(index, 'descripcion', p.descripcion || '');
                                                            if (variantImg) {
                                                              handleUpdateItemField(index, 'imagen', variantImg);
                                                            }
                                                            setFocusedItemIdx(null);
                                                          }}
                                                          className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-black uppercase rounded-lg border border-amber-500/20 shadow-sm cursor-pointer"
                                                          title="Precio mayorista"
                                                        >
                                                          May: ${vWholesale}
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown de variantes en móvil */}
                      {(() => {
                        const selectedProduct = g3dProducts.find(p => p.id === row.producto_id);
                        if (!selectedProduct || !selectedProduct.variantes || selectedProduct.variantes.length === 0) return null;
                        
                        const isWholesale = Boolean(g3dOrderForm.es_mayorista);
                        return (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Variante de Producto</label>
                            <select
                              value={row.variante_id || ''}
                              onChange={(e) => {
                                const varId = e.target.value;
                                const variant = selectedProduct.variantes.find((v: any) => v.id === varId);
                                if (variant) {
                                  let variantPrice = 0;
                                  if (isWholesale) {
                                    variantPrice = (variant.precio_mayorista && variant.precio_mayorista > 0)
                                      ? variant.precio_mayorista
                                      : (selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : (variant.precio || selectedProduct.precio));
                                  } else {
                                    variantPrice = (variant.precio && variant.precio > 0)
                                      ? variant.precio
                                      : selectedProduct.precio;
                                  }
                                  
                                  handleUpdateItemField(index, 'item', `${selectedProduct.nombre} (${variant.combinacion})`);
                                  handleUpdateItemField(index, 'precio', variantPrice);
                                  handleUpdateItemField(index, 'variante_id', varId);
                                  
                                  let variantImg = '';
                                  if (variant.imagenes && variant.imagenes.length > 0) {
                                    variantImg = variant.imagenes[0];
                                  } else if (variant.imagen_url && variant.imagen_url.startsWith('[')) {
                                    try {
                                      const parsed = JSON.parse(variant.imagen_url);
                                      if (parsed && parsed.length > 0) {
                                        variantImg = parsed[0];
                                      }
                                    } catch (e) {
                                      variantImg = variant.imagen_url;
                                    }
                                  } else {
                                    variantImg = variant.imagen || variant.imagen_url || '';
                                  }
                                  if (!variantImg) {
                                    variantImg = selectedProduct.imagen || '';
                                  }
                                  if (variantImg) {
                                    handleUpdateItemField(index, 'imagen', variantImg);
                                  }
                                } else {
                                  const basePrice = isWholesale && selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : selectedProduct.precio;
                                  handleUpdateItemField(index, 'item', selectedProduct.nombre);
                                  handleUpdateItemField(index, 'precio', basePrice);
                                  handleUpdateItemField(index, 'variante_id', '');
                                  if (selectedProduct.imagen) {
                                    handleUpdateItemField(index, 'imagen', selectedProduct.imagen);
                                  }
                                }
                              }}
                              className="w-full text-xs bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl px-3 py-2 font-black text-emerald-800 dark:text-emerald-400 focus:outline-none"
                            >
                              <option value="">-- Seleccionar Variante --</option>
                              {selectedProduct.variantes.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                  {v.combinacion} (${v.precio && v.precio > 0 ? v.precio : (isWholesale && selectedProduct.precio_mayorista > 0 ? selectedProduct.precio_mayorista : selectedProduct.precio)})
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-12 gap-3.5">
                        {/* Descripción */}
                        <div className="col-span-7 space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Descripción / Notas</label>
                          <input
                            type="text"
                            placeholder="Descripción / notas"
                            value={row.descripcion || ''}
                            onChange={(e) => handleUpdateItemField(index, 'descripcion', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs shadow-sm"
                          />
                        </div>

                        {/* Precio */}
                        <div className="col-span-5 space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100">Precio ($)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={row.precio ?? ''}
                              onChange={(e) => handleUpdateItemField(index, 'precio', e.target.value)}
                              className="w-full pl-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Muestras y Capturas ($) en Móvil */}
                      <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        {(() => {
                          const itemImgs: string[] = getProductImages(row);
                          const itemCaptures: string[] = Array.isArray(row.capturas_pago) ? row.capturas_pago : [];

                          return (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-100 tracking-wider">
                                  Archivos del Ítem:
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {/* Botón Muestras */}
                                  <label className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer transition-all">
                                    <Upload size={11} className="text-indigo-500" />
                                    <span>Muestras</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => handleUploadItemImage(index, e)}
                                    />
                                  </label>

                                  {/* Botón $ Capturas de Pago */}
                                  <label className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer transition-all">
                                    <DollarSign size={11} />
                                    <span>Pagos ($)</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => handleUploadItemPaymentCapture(index, e)}
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Previews Móvil */}
                              {(itemImgs.length > 0 || itemCaptures.length > 0) && (
                                <div className="flex items-center gap-2 overflow-x-auto p-1">
                                  {/* Muestras */}
                                  {itemImgs.map((imgSrc, imgIdx) => (
                                    <div key={`mob-sample-${imgIdx}`} className="relative size-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shrink-0 shadow-sm">
                                      <img src={imgSrc} alt={`Muestra ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setG3dOrderForm(prev => {
                                            const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                                            const updated = currentItems.map((r, i) => {
                                              if (i === index) {
                                                const imgs = Array.isArray(r.imagenes) ? r.imagenes : (r.imagen ? [r.imagen] : []);
                                                const filtered = imgs.filter((_, k) => k !== imgIdx);
                                                return {
                                                  ...r,
                                                  imagen: filtered[0] || '',
                                                  imagenes: filtered
                                                };
                                              }
                                              return r;
                                            });
                                            return { ...prev, items: updated };
                                          });
                                        }}
                                        className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-lg"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}

                                  {/* Capturas $ */}
                                  {itemCaptures.map((capUrl, capIdx) => (
                                    <div key={`mob-pay-${capIdx}`} className="relative size-10 rounded-lg overflow-hidden border-2 border-emerald-500 group shrink-0 shadow-sm">
                                      <img src={capUrl} alt={`Pago ${capIdx + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-bl">
                                        $
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setG3dOrderForm(prev => {
                                            const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                                            const updated = currentItems.map((r, i) => {
                                              if (i === index) {
                                                const caps = Array.isArray(r.capturas_pago) ? r.capturas_pago : [];
                                                const filtered = caps.filter((_, k) => k !== capIdx);
                                                return {
                                                  ...r,
                                                  capturas_pago: filtered,
                                                  comprobantes_pago: filtered
                                                };
                                              }
                                              return r;
                                            });
                                            return { ...prev, items: updated };
                                          });
                                        }}
                                        className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-lg"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón Agregar más Items */}
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={14} className="text-emerald-500" />
                    Agregar más items
                  </button>
                </div>
              </div>

              {/* Precio y Seña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Precio */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                    Precio del Pedido ($) <span className="text-slate-400 text-[9px] lowercase">(calculado / editable)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      placeholder="Ej: 15000"
                      value={g3dOrderForm.precio ?? ''}
                      onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, precio: e.target.value })}
                      className="w-full pl-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Seña */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-100 mb-1">
                    Seña ($) <span className="text-slate-400 text-[9px] lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      placeholder="Ej: 5000"
                      value={g3dOrderForm.seña ?? ''}
                      onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, seña: e.target.value })}
                      className="w-full pl-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button 
                onClick={() => setIsG3dOrderModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveG3dOrder}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                {g3dOrderToEdit ? 'Actualizar Pedido' : 'Registrar Pedido'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
