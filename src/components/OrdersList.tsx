import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Columns, 
  PlusCircle, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  ChevronDown,
  MoreVertical,
  History,
  ArrowRight,
  Loader2,
  ArrowUpDown,
  GripVertical,
  Eye,
  EyeOff,
  X,
  List,
  LayoutGrid,
  AlertCircle,
  Timer,
  ShieldAlert,
  Clock,
  ChevronUp,
  Settings,
  ClipboardList,
  ShoppingBag,
  Hourglass,
  Trash2,
  CheckSquare,
  Globe,
  Upload,
  Plus,
  Package,
  Check,
  ExternalLink,
  Download,
  DollarSign,
  CheckCircle2,
  Share2,
  Copy,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Wrench,
  Truck,
  PackageCheck,
  Archive,
  Edit3,
  MessageSquare,
  Maximize2,
  Phone,
  UploadCloud,
  Layers,
  Activity
} from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { apiService } from '@/src/services/apiService';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../types/permissions';
import { differenceInDays, parseISO } from 'date-fns';
import { getProductImages, parseImages } from '../utils/imageUtils';

// ... (rest of the constants)

const ALL_COLUMNS = [
  { id: 'id_pedido', label: 'ID_PEDIDO' },
  { id: 'fecha_creacion', label: 'FECHA_CREACION' },
  { id: 'vendedor', label: 'VENDEDOR' },
  { id: 'cliente_nombre', label: 'CLIENTE_NOMBRE' },
  { id: 'cliente_telefono', label: 'CLIENTE_TELEFONO' },
  { id: 'cliente_direccion', label: 'CLIENTE_DIRECCION' },
  { id: 'cliente_email', label: 'CLIENTE_EMAIL' },
  { id: 'descripcion', label: 'DESCRIPCION' },
  { id: 'tipo_trabajo', label: 'TIPO_TRABAJO' },
  { id: 'cantidad', label: 'CANTIDAD' },
  { id: 'precio_total', label: 'PRECIO_TOTAL' },
  { id: 'total_pagado', label: 'TOTAL_PAGADO' },
  { id: 'saldo', label: 'SALDO' },
  { id: 'estado_cuenta', label: 'ESTADO_CUENTA' },
  { id: 'estado_pedido', label: 'ESTADO_PEDIDO' },
  { id: 'fecha_entrega', label: 'FECHA_ENTREGA' },
  { id: 'entregado', label: 'ENTREGADO' },
  { id: 'archivado', label: 'ARCHIVADO' },
  { id: 'oculto', label: 'OCULTO' },
];

const VIBRANT_STATUS_COLORS: Record<string, string> = {
  'Presupuesto': '#00B0FF', // Celeste vibrante
  'PRESUPUESTAR': '#00B0FF',
  'PRESUPUESTADO': '#00B0FF',
  'Falta Diseñar': '#FF3D00', // Naranja rojizo fuerte
  'Diseñado': '#D500F9', // Púrpura neón
  'En Proceso': '#00E676', // Verde brillante
  'En Fabricación': '#00C853', // Verde esmeralda fuerte
  'Pendiente Entrega': '#FFAB00', // Ámbar intenso
  'Entregado': '#455A64', // Gris azulado oscuro
  'CANCELADO': '#FF1744', // Rojo puro
};

const DraggableAny = Draggable as any;

export function OrdersList() {
  const { user, userRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA G3D PEDIDOS ---
  const [g3dOrders, setG3dOrders] = useState<any[]>([]);
  const [isG3dModalOpen, setIsG3dModalOpen] = useState(false);
  const [g3dOrderToEdit, setG3dOrderToEdit] = useState<any | null>(null);
  const [g3dProducts, setG3dProducts] = useState<any[]>([]);
  const [focusedItemIdx, setFocusedItemIdx] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [g3dOrderForm, setG3dOrderForm] = useState({
    vendedor: '',
    vendedor_telefono: '',
    cliente_nombre: '',
    cliente_telefono: '',
    es_mayorista: false,
    items: [
      { id: 'item-1', cantidad: 1, item: '', producto_id: '', variante_id: '', descripcion: '', precio: '', imagen: '', imagenes: [] as string[], archivo_link: '' }
    ],
    precio: '',
    seña: '',
    capturas_pago: [] as string[],
    producto_confirmado: false
  });

  // --- ESTADOS Y MANEJADORES PARA ASENTAR PAGO DE DEUDA ($) ---
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentImage, setPaymentImage] = useState<string | null>(null);
  const [paymentReceiptModal, setPaymentReceiptModal] = useState<any | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // --- ESTADOS Y MANEJADORES PARA VISTA PREVIA LIGHTBOX Y FABRICACIÓN ---
  const [lightboxModal, setLightboxModal] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    title?: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ''
  });

  const [showAddFabricationNote, setShowAddFabricationNote] = useState<boolean>(false);
  const [fabricationNote, setFabricationNote] = useState<string>('');
  const [fabricationPhoto, setFabricationPhoto] = useState<string | null>(null);
  const [isProcessingFabPhoto, setIsProcessingFabPhoto] = useState<boolean>(false);

  const openLightbox = (images: string[], index: number = 0, title: string = '') => {
    if (!images || images.length === 0) return;
    setLightboxModal({
      isOpen: true,
      images,
      currentIndex: index,
      title
    });
  };

  const handleFabPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingFabPhoto(true);
      const toastModule = await import('sonner');
      const loadingToast = toastModule.toast.loading('Procesando foto de avance...');
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setFabricationPhoto(compressedBase64);
          setIsProcessingFabPhoto(false);
          toastModule.toast.dismiss(loadingToast);
          toastModule.toast.success('Foto de avance lista');
        };
      };
    } catch (err) {
      setIsProcessingFabPhoto(false);
      import('sonner').then(({ toast }) => toast.error('Error procesando imagen'));
    }
  };

  const handleSaveFabricationProgress = async () => {
    if (!selectedOrderDetails) return;
    if (!fabricationNote.trim() && !fabricationPhoto) {
      import('sonner').then(({ toast }) => toast.error('Ingresa una nota o adjunta una foto de avance.'));
      return;
    }

    try {
      const existingBitacora = Array.isArray(selectedOrderDetails.bitacora_fabricacion) ? selectedOrderDetails.bitacora_fabricacion : [];
      const newEntry = {
        fecha: new Date().toISOString(),
        usuario: user?.user_metadata?.full_name || user?.email || 'Producción',
        estado: selectedOrderDetails.estado_pedido || 'En Fabricación',
        nota: fabricationNote.trim(),
        foto: fabricationPhoto || null
      };

      const updatedBitacora = [newEntry, ...existingBitacora];
      const existingImgs = selectedOrderDetails.imagenes || [];
      const updatedImgs = fabricationPhoto ? Array.from(new Set([...existingImgs, fabricationPhoto])) : existingImgs;

      const updatedOrder = {
        ...selectedOrderDetails,
        bitacora_fabricacion: updatedBitacora,
        imagenes: updatedImgs
      };

      setSelectedOrderDetails(updatedOrder);

      // Persistir en Supabase y caché local
      await apiService.saveG3dOrder(updatedOrder);
      await loadG3dOrders();

      setFabricationNote('');
      setFabricationPhoto(null);
      setShowAddFabricationNote(false);
      import('sonner').then(({ toast }) => toast.success('Avance de fabricación registrado.'));
    } catch (e) {
      import('sonner').then(({ toast }) => toast.error('Error al guardar el avance.'));
    }
  };

  const handleOpenPaymentModal = (order: any) => {
    setPaymentOrder(order);
    const total = parseFloat(String(order.precio || 0));
    const paid = parseFloat(String(order.seña || 0));
    const remaining = Math.max(0, total - paid);
    setPaymentAmount(remaining > 0 ? String(remaining) : '');
    setPaymentMethod('Transferencia');
    setPaymentNotes('');
    setPaymentImage(null);
  };

  const handlePaymentImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024) {
        import('sonner').then(({ toast }) => toast.error('La imagen supera el límite de 15MB'));
        return;
      }
      const toastModule = await import('sonner');
      const loadingToast = toastModule.toast.loading('Procesando imagen del comprobante...');
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setPaymentImage(compressed);
            toastModule.toast.dismiss(loadingToast);
            toastModule.toast.success('Comprobante adjuntado con éxito');
          } else {
            setPaymentImage(event.target?.result as string);
            toastModule.toast.dismiss(loadingToast);
          }
        };
        img.onerror = () => {
          toastModule.toast.dismiss(loadingToast);
          toastModule.toast.error('Error al procesar el archivo de imagen');
        };
      };
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error('Error al cargar la imagen'));
    }
  };

  const handleSavePayment = async () => {
    if (!paymentOrder) return;
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      import('sonner').then(({ toast }) => toast.error('Ingresa un monto válido mayor a 0'));
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const totalPrice = parseFloat(String(paymentOrder.precio || 0));
      const currentPaid = parseFloat(String(paymentOrder.seña || 0));
      const newPaid = currentPaid + amountToPay;
      const remainingDebt = Math.max(0, totalPrice - newPaid);

      // Actualizar pedido en Supabase y caché local
      const existingCapturas = Array.isArray(paymentOrder.capturas_pago) ? paymentOrder.capturas_pago : (paymentOrder.comprobante_url ? [paymentOrder.comprobante_url] : []);
      const updatedCapturas = paymentImage ? Array.from(new Set([...existingCapturas, paymentImage])) : existingCapturas;
      
      const updatedOrderObj = {
        ...paymentOrder,
        seña: newPaid,
        total_pagado: newPaid,
        monto_pagado: newPaid,
        capturas_pago: updatedCapturas,
        comprobantes_pago: updatedCapturas,
        comprobante_url: updatedCapturas[0] || null
      };

      await apiService.saveG3dOrder(updatedOrderObj);

      // Intentar registrar en tabla de pagos de Supabase
      try {
        await supabase.from('pagos').insert([{
          pedido_id: paymentOrder.id,
          monto: amountToPay,
          metodo_pago: paymentMethod,
          concepto: `Abono/Pago a pedido G3D ${paymentOrder.id} (${paymentNotes || 'Sin notas'})`,
          comprobante_url: paymentImage || null,
          fecha: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Error asentando pago en Supabase:", e);
      }

      await loadG3dOrders();

      const nowFormatted = new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const receiptData = {
        orderId: paymentOrder.id,
        itemTitle: paymentOrder.item_nombre || paymentOrder.producto_nombre || paymentOrder.items?.[0]?.item || 'Pedido G3D',
        vendedor: paymentOrder.vendedor || 'La Casa / Admin',
        vendedor_telefono: paymentOrder.vendedor_telefono || paymentOrder.telefono || '',
        cliente: paymentOrder.cliente_nombre || paymentOrder.nombre_cliente || paymentOrder.cliente || paymentOrder.vendedor || 'Cliente',
        cliente_telefono: paymentOrder.cliente_telefono || paymentOrder.vendedor_telefono || '',
        precioTotal: totalPrice,
        paidBefore: currentPaid,
        amountPaidNow: amountToPay,
        newPaidTotal: newPaid,
        remainingDebt: remainingDebt,
        paymentMethod: paymentMethod,
        paymentNotes: paymentNotes,
        paymentImage: paymentImage,
        date: nowFormatted
      };

      import('sonner').then(({ toast }) => toast.success(`¡Pago de $${amountToPay.toLocaleString('es-AR')} asentado con éxito!`));
      setPaymentOrder(null);
      setPaymentReceiptModal(receiptData);
      loadG3dOrders();
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Error al asentar pago'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const [g3dVendors, setG3dVendors] = useState<any[]>([]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const matched = g3dVendors.find(v => (v.nombre || v.email) === selectedValue);
    setG3dOrderForm(prev => ({
      ...prev,
      vendedor: selectedValue,
      vendedor_telefono: matched ? (matched.telefono || '') : ''
    }));
  };

  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    const matched = g3dVendors.find(v => (v.nombre || v.email) === selectedValue);
    setG3dOrderForm(prev => ({
      ...prev,
      vendedor: selectedValue,
      vendedor_telefono: matched ? (matched.telefono || '') : prev.vendedor_telefono
    }));
  };

  useEffect(() => {
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

    if (isG3dModalOpen) {
      fetchVendors();
    }
  }, [isG3dModalOpen]);

  const handleImageUploadG3D = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const base64List: string[] = [];
    const toastModule = await import('sonner');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toastModule.toast.error(`La imagen ${file.name} supera los 10MB`);
        continue;
      }

      try {
        const base64Str = await new Promise<string>((resolve, reject) => {
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

              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
              resolve(compressedBase64);
            };
            img.onerror = () => reject(new Error('Error al cargar la imagen en canvas'));
          };
          reader.onerror = (err) => reject(err);
        });

        base64List.push(base64Str);
      } catch (err: any) {
        console.error("Error compressing image:", err);
        toastModule.toast.error(`Fallo al comprimir ${file.name}`);
      }
    }

    if (base64List.length > 0) {
      setG3dOrderForm(prev => ({
        ...prev,
        imagenes: [...(prev.imagenes || []), ...base64List]
      }));
      toastModule.toast.success(`Se cargaron ${base64List.length} imágenes correctamente.`);
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveImageG3D = (indexToRemove: number) => {
    setG3dOrderForm(prev => ({
      ...prev,
      imagenes: (prev.imagenes || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };
  
  const loadG3dOrders = async () => {
    try {
      const orders = await apiService.getOrders();
      setG3dOrders(orders || []);
    } catch (err) {
      console.error(err);
      const saved = localStorage.getItem('g3d_designed_orders');
      setG3dOrders(saved ? JSON.parse(saved) : []);
    }
  };

  useEffect(() => {
    loadG3dOrders();
  }, []);

  useEffect(() => {
    if (user) {
      setG3dOrderForm(prev => ({
        ...prev,
        vendedor: user.nombre || user.email || 'Vendedor G3D'
      }));
    }
  }, [user]);

  useEffect(() => {
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
          const { data: legacyData } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });
          if (legacyData && legacyData.length > 0) {
            productosList = legacyData;
          } else {
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
    if (isG3dModalOpen) {
      fetchProducts();
    }
  }, [isG3dModalOpen]);

  const handleAddItemRow = () => {
    setG3dOrderForm(prev => ({
      ...prev,
      items: [
        ...(Array.isArray(prev.items) ? prev.items : []),
        { id: `item-${Date.now()}`, cantidad: 1, item: '', producto_id: '', variante_id: '', descripcion: '', precio: '', imagen: '', imagenes: [], archivo_link: '' }
      ]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      const updatedItems = currentItems.filter((_, idx) => idx !== index);
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
    const existingImgs: string[] = Array.isArray(itemRow?.imagenes) ? [...itemRow.imagenes] : (itemRow?.imagen ? [itemRow.imagen] : []);

    if (existingImgs.length >= 5) {
      import('sonner').then(({ toast }) => toast.error("Límite máximo alcanzado: Ya hay 5 fotos adjuntas a este ítem."));
      event.target.value = '';
      return;
    }

    const availableSlots = 5 - existingImgs.length;
    const filesToProcess: File[] = Array.from(files).slice(0, availableSlots) as File[];

    if (files.length > availableSlots) {
      import('sonner').then(({ toast }) => toast.info(`Solo se procesaron ${availableSlots} foto(s) para no superar el límite de 5 por ítem.`));
    }

    const newCompressedImgs: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        import('sonner').then(({ toast }) => toast.error(`La imagen "${file.name}" supera los 10MB`));
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

        // 2. Fallback a Base64 si falla el Storage
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
            const currentImgs = Array.isArray(row.imagenes) ? [...row.imagenes] : (row.imagen ? [row.imagen] : []);
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
      import('sonner').then(({ toast }) => toast.success(`${newCompressedImgs.length} foto(s) adjuntada(s) al ítem.`));
    }

    event.target.value = '';
  };

  const handleToggleItemConfirm = (index: number) => {
    setG3dOrderForm(prev => {
      const currentItems = Array.isArray(prev?.items) ? prev.items : [];
      const updated = currentItems.map((r, i) => {
        if (i === index) {
          return {
            ...r,
            confirmado: !r.confirmado
          };
        }
        return r;
      });
      return { ...prev, items: updated };
    });
  };

  const handleUploadItemPaymentCapture = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess: File[] = Array.from(files) as File[];
    const newUploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        import('sonner').then(({ toast }) => toast.error(`La imagen "${file.name}" supera los 10MB`));
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
        console.error("Error al procesar captura de pago del ítem:", err);
      }
    }

    if (newUploadedUrls.length > 0) {
      setG3dOrderForm(prev => {
        const currentItems = Array.isArray(prev?.items) ? prev.items : [];
        const updated = currentItems.map((r, i) => {
          if (i === index) {
            const caps = Array.isArray(r.capturas_pago) ? [...r.capturas_pago] : [];
            const merged = [...caps, ...newUploadedUrls];
            return {
              ...r,
              capturas_pago: merged,
              comprobantes_pago: merged
            };
          }
          return r;
        });
        return { ...prev, items: updated };
      });
      import('sonner').then(({ toast }) => toast.success(`${newUploadedUrls.length} captura(s) de pago adjuntada(s) al ítem.`));
    }

    event.target.value = '';
  };

  const handleUploadPaymentCaptures = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess: File[] = Array.from(files) as File[];
    const newUploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        import('sonner').then(({ toast }) => toast.error(`La imagen "${file.name}" supera los 10MB`));
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
      import('sonner').then(({ toast }) => toast.success(`${newUploadedUrls.length} captura(s) de pago agregada(s).`));
    }

    event.target.value = '';
  };

  const handleSaveG3dOrder = async () => {
    try {
      if (!g3dOrderForm.vendedor) {
        import('sonner').then(({ toast }) => toast.error("El nombre del vendedor es obligatorio."));
        return;
      }

      // Validar permiso de cliente opcional
      const canHaveOptionalClient = hasPermission('G3d.CrearPedido.ClienteOpcional') || hasPermission('Admin.*') || userRole === 'Admin';
      if (!canHaveOptionalClient) {
        if (!g3dOrderForm.cliente_nombre?.trim() || !g3dOrderForm.cliente_telefono?.trim()) {
          import('sonner').then(({ toast }) => toast.error("El Nombre Completo del Cliente y el Teléfono son obligatorios."));
          return;
        }
      }
      
      const globalCapturas = Array.isArray(g3dOrderForm.capturas_pago) ? g3dOrderForm.capturas_pago : [];
      
      if (g3dOrderToEdit) {
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
        import('sonner').then(({ toast }) => toast.success("Pedido G3D actualizado correctamente."));
      } else {
        const validItems = (g3dOrderForm.items || []).filter(i => i.item && i.item.trim() !== '');
        if (validItems.length === 0) {
          import('sonner').then(({ toast }) => toast.error("Debes agregar al menos un ítem al pedido."));
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

        import('sonner').then(({ toast }) => toast.success(newOrdersToPush.length === 1 
          ? "¡Pedido G3D registrado con éxito!" 
          : `¡Se registraron ${newOrdersToPush.length} pedidos individuales con éxito!`));
      }
      
      setIsG3dModalOpen(false);
      loadG3dOrders();
      setG3dOrderToEdit(null);
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error("Error al guardar: " + err.message));
    }
  };

  const handleDeleteG3dOrder = async (id: string) => {
    try {
      if (!confirm("¿Estás seguro de eliminar este pedido de diseño G3D?")) return;
      await apiService.deleteOrders([id]);
      import('sonner').then(({ toast }) => toast.success("Pedido eliminado."));
      await loadG3dOrders();
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error(err.message));
    }
  };

  const handleToggleConfirmG3d = async (orderId: string, currentStatus: boolean) => {
    try {
      const targetOrder = g3dOrders.find((o: any) => o.id === orderId || o.id_pedido === orderId || o.codigo_pedido === orderId);
      if (targetOrder) {
        const updatedOrder = { ...targetOrder, producto_confirmado: !currentStatus };
        await apiService.saveG3dOrder(updatedOrder);
      }
      import('sonner').then(({ toast }) => toast.success(!currentStatus ? "¡Pedido Confirmado!" : "Confirmación removida."));
      await loadG3dOrders();
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error(err.message));
    }
  };
  const [filter, setFilter] = useState<string[]>(() => {
    const estado = searchParams.get('estado');
    return estado ? [estado] : ['Todos'];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sellerFilter, setSellerFilter] = useState('Todos');
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    presupuestos: false,
    produccion: true,
    historial: false
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('g3d_column_order');
    return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.id);
  });
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('g3d_visible_columns');
    return saved ? JSON.parse(saved) : [
      'id_pedido', 'fecha_creacion', 'cliente_nombre', 'descripcion', 'tipo_trabajo', 'precio_total', 'saldo', 'estado_pedido', 'fecha_entrega'
    ];
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('g3d_column_widths');
    const defaults: Record<string, number> = {
      id_pedido: 100,
      fecha_creacion: 120,
      vendedor: 120,
      cliente_nombre: 180,
      cliente_telefono: 140,
      cliente_direccion: 200,
      cliente_email: 180,
      descripcion: 250,
      tipo_trabajo: 120,
      cantidad: 80,
      precio_total: 110,
      total_pagado: 110,
      saldo: 110,
      estado_cuenta: 120,
      estado_pedido: 150,
      fecha_entrega: 120,
      entregado: 100,
      archivado: 100,
      oculto: 100,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  const getQuoteValidity = (fechaCreacion: string) => {
    if (!fechaCreacion) return null;
    const start = parseISO(fechaCreacion);
    const now = new Date();
    const diff = differenceInDays(now, start);
    return 15 - diff;
  };

  const [debtOnly, setDebtOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'tabla' | 'cuadros' | 'kanban'>(() => {
    if (userRole === 'Produccion') return 'kanban';
    return 'tabla';
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelectAll = (filteredOrders: any[]) => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id_pedido));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    setIsDeleting(true);
    try {
      const res = await apiService.deleteOrders(selectedIds);
      if (res.success) {
        setOrders(prev => prev.filter(o => !selectedIds.includes(o.id_pedido)));
        setSelectedIds([]);
        setShowDeleteConfirm(false);
        // Notificar al sidebar por si acaso
        window.dispatchEvent(new Event('reports_updated'));
      } else {
        throw new Error("No se pudieron eliminar los pedidos");
      }
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Floating Permissions UI State removed from here as requested to be in DevRoleSimulator

  useEffect(() => {
    async function loadOrders() {
      const ordersData = await apiService.getOrders();
      setOrders(ordersData);
      setLoading(false);
    }
    
    async function loadStatuses() {
      let { data, error } = await supabase
        .from('diccionario_estados_pedido')
        .select('*')
        .order('nivel_prioridad', { ascending: true });
      
      if (error || !data || data.length === 0) {
        const { data: dataPlural, error: errorPlural } = await supabase
          .from('diccionario_estados_pedidos')
          .select('*')
          .order('nivel_prioridad', { ascending: true });
        
        if (!errorPlural && dataPlural && dataPlural.length > 0) {
          data = dataPlural;
          error = null;
        }
      }

      if (!error && data && data.length > 0) {
        setAvailableStatuses(data);
      } else {
        const { data: oldData } = await supabase
          .from('parametros_produccion')
          .select('estados_pedido')
          .eq('id', 1)
          .single();
        
        if (oldData && Array.isArray(oldData.estados_pedido)) {
          const mapped = oldData.estados_pedido.map((s: any) => ({
            nombre_estado: s.label || s.nombre_estado,
            color_pastel_hex: s.color_pastel_hex || s.color,
            es_activo: s.es_activo !== false,
            nivel_prioridad: s.nivel_prioridad ?? 999
          })).sort((a: any, b: any) => a.nivel_prioridad - b.nivel_prioridad);
          setAvailableStatuses(mapped);
        } else {
          setAvailableStatuses([
            { nombre_estado: 'FALTA DISEÑAR', nivel_prioridad: 10 },
            { nombre_estado: 'PREPARACIÓN', nivel_prioridad: 20 },
            { nombre_estado: 'EN IMPRESIÓN', nivel_prioridad: 30 },
            { nombre_estado: 'POSPROCESADO', nivel_prioridad: 40 },
            { nombre_estado: 'EMPAQUETADO', nivel_prioridad: 50 },
            { nombre_estado: 'ENTREGADO', nivel_prioridad: 60 },
          ]);
        }
      }
    }

    loadOrders();
    loadStatuses();

    const handleGlobalClick = () => {
      setActiveRowMenuId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    localStorage.setItem('g3d_column_order', JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    localStorage.setItem('g3d_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('g3d_column_widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowColumnConfig(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setColumnOrder(items);
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleResize = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.pageX;
    const startWidth = columnWidths[colId] || 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + (moveEvent.pageX - startX));
      setColumnWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const renderStatusOptions = (currentStatus?: string) => {
    const list = [...availableStatuses];
    const currentUpper = (currentStatus || '').toUpperCase();
    if (currentUpper && !list.some(st => (typeof st === 'string' ? st : st.nombre_estado || '').toUpperCase() === currentUpper)) {
      list.push({ nombre_estado: currentUpper, nivel_prioridad: 999 });
    }
    return list.map((st, idx) => {
      const name = typeof st === 'string' ? st : (st.nombre_estado || '');
      if (!name) return null;
      return (
        <option key={st.id || name || idx} value={name}>
          {name.toUpperCase()}
        </option>
      );
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!orderId) return;

    // Actualización optimista en todas las listas de estado local
    setOrders(prev => prev.map(o => {
      const isMatch = (o.id === orderId || o.id_pedido === orderId || o.codigo_pedido === orderId);
      return isMatch ? { ...o, estado_pedido: newStatus, estado: newStatus } : o;
    }));

    setG3dOrders(prev => prev.map(o => {
      const isMatch = (o.id === orderId || o.id_pedido === orderId || o.codigo_pedido === orderId);
      return isMatch ? { ...o, estado_pedido: newStatus, estado: newStatus } : o;
    }));

    setSelectedOrderDetails((prev: any) => {
      if (!prev) return null;
      const isMatch = (prev.id === orderId || prev.id_pedido === orderId || prev.codigo_pedido === orderId);
      return isMatch ? { ...prev, estado_pedido: newStatus, estado: newStatus } : prev;
    });

    setUpdatingStatusId(orderId);
    try {
      const res = await apiService.updateOrderStatus(orderId, newStatus);

      if (!res?.success) {
        import('sonner').then(({ toast }) => toast.error("Error al guardar el nuevo estado en el servidor"));
      } else {
        import('sonner').then(({ toast }) => toast.success(`Estado actualizado a: ${newStatus}`));
      }
    } catch (err: any) {
      import('sonner').then(({ toast }) => toast.error('Error al actualizar estado: ' + (err?.message || 'Error desconocido')));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const allFilteredOrders = orders
    .filter(order => {
      // Filtro de Seguridad: Si tiene 'Ver_Propios', solo ve sus pedidos A MENOS que sea Admin o Produccion
      // Verificamos explícitamente Admin.* para evitar cualquier ocultamiento accidental al Admin
      const isAdminOrStaff = userRole === 'Admin' || userRole === 'Produccion' || hasPermission(PERMISSIONS.ADMIN.FULL_BRANCH.id);
      
      if (hasPermission('Pedidos.Ver_Propios') && !isAdminOrStaff) {
        const userEmail = user?.email?.toLowerCase().trim();
        const clientEmail = (order.cliente_email || "").toLowerCase().trim();
        if (userEmail !== clientEmail) return false;
      }

      const matchesSeller = sellerFilter === 'Todos' || order.vendedor === sellerFilter;
      const matchesMyOrders = !showMyOrders || order.vendedor === user?.email || order.vendedor === user?.user_metadata?.full_name;
      const matchesSearch = searchTerm === '' || Object.values(order).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesDebt = !debtOnly || (parseFloat(order.saldo) > 0);
      return matchesSeller && matchesMyOrders && matchesSearch && matchesDebt;
    })
    .sort((a, b) => {
      if (!sortConfig) {
        // Lógica de prioridad personalizada solicitada por el usuario:
        // 1. FALTA DISEÑAR siempre arriba
        // 2. Resto sigue el nivel_prioridad del diccionario
        const getPriority = (statusName: string) => {
          const s = (statusName || "").trim().toUpperCase();
          if (s === 'FALTA DISEÑAR') return -1000; // Prioridad máxima
          return availableStatuses.find(s => s.nombre_estado === statusName)?.nivel_prioridad ?? 999;
        };

        const priorityA = getPriority(a.estado_pedido);
        const priorityB = getPriority(b.estado_pedido);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Si tienen la misma prioridad (misma etapa), el más reciente arriba
        return new Date(b.fecha_creacion || 0).getTime() - new Date(a.fecha_creacion || 0).getTime();
      }

      const { key, direction } = sortConfig;
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalDebt = useMemo(() => {
    return allFilteredOrders.reduce((sum, order) => {
      const status = (order.estado_pedido || "").trim().toUpperCase();
      const isQuote = status.includes('PRESUPUEST') || status.includes('PREUPUEST') || status.includes('COTIZA');
      if (isQuote) return sum;
      return sum + (parseFloat(order.saldo) || 0);
    }, 0);
  }, [allFilteredOrders]);

  const getSectionOrders = (type: 'presupuestos' | 'produccion' | 'historial') => {
    return allFilteredOrders.filter(order => {
      const status = (order.estado_pedido || "").trim().toUpperCase();
      const isQuote = status.includes('PRESUPUEST') || status.includes('PREUPUEST') || status.includes('COTIZA');
      const isFinished = status === 'ENTREGADO' && (parseFloat(order.saldo) || 0) <= 0;

      if (type === 'presupuestos') return isQuote;
      if (type === 'historial') return isFinished;
      // Producción: No es presupuesto Y no está finalizado (Entregado con saldo 0)
      return !isQuote && !isFinished;
    }).filter(order => {
      // Aplicar el filtro de estado específico si no es 'Todos'
      return filter.includes('Todos') || filter.some(f => (order.estado_pedido || "").toLowerCase() === f.toLowerCase());
    });
  };

  const sections = [
    { id: 'presupuestos', label: 'PRESUPUESTOS Y COTIZACIONES', color: 'text-rose-600', icon: ClipboardList },
    { id: 'produccion', label: 'PRODUCCIÓN EN CURSO', color: 'text-primary', icon: ShoppingBag },
    { id: 'historial', label: 'HISTORIAL DE FINALIZADOS (SALDO 0)', color: 'text-emerald-600', icon: History },
  ];

  const activeColumns = columnOrder.filter(id => visibleColumns.includes(id));

  const resetFilters = () => {
    setFilter(['Todos']);
    setSearchTerm('');
    setDebtOnly(false);
  };

  const tabParam = searchParams.get('tab');
  const currentTab = tabParam === 'inactivos' ? 'inactivos' : 'activos';

  const isOrderInactive = (order: any) => {
    const statusName = (order.estado_pedido || order.estado || '').toString().trim().toUpperCase();
    const isDelivered = statusName === 'ENTREGADO' || statusName === 'FINALIZADO';
    
    const totalPrice = parseFloat(order.precio_total ?? order.monto_total ?? order.precio ?? 0);
    const paidAmount = parseFloat(order.total_pagado ?? order.monto_pagado ?? order.seña ?? 0);
    const remainingSaldo = parseFloat(order.saldo ?? (totalPrice - paidAmount));

    const isPaidInFull = remainingSaldo <= 0 || (paidAmount >= totalPrice && totalPrice > 0);

    return isDelivered && isPaidInFull;
  };

  const activeOrdersList = useMemo(() => {
    return g3dOrders.filter(o => !isOrderInactive(o));
  }, [g3dOrders]);

  const inactiveOrdersList = useMemo(() => {
    return g3dOrders.filter(o => isOrderInactive(o));
  }, [g3dOrders]);

  const currentTabOrders = currentTab === 'inactivos' ? inactiveOrdersList : activeOrdersList;

  const availableSellers = useMemo(() => {
    const set = new Set<string>();
    g3dOrders.forEach(o => {
      if (o.vendedor) set.add(o.vendedor);
    });
    return Array.from(set);
  }, [g3dOrders]);

  const displayedOrders = useMemo(() => {
    return currentTabOrders.filter(order => {
      const isAdminOrStaff = userRole === 'Admin' || userRole === 'Produccion' || hasPermission(PERMISSIONS.ADMIN.FULL_BRANCH.id);
      if (hasPermission('Pedidos.Ver_Propios') && !isAdminOrStaff) {
        const userEmail = user?.email?.toLowerCase().trim();
        const clientEmail = (order.cliente_email || "").toLowerCase().trim();
        const sellerName = (order.vendedor || "").toLowerCase().trim();
        if (userEmail !== clientEmail && !sellerName.includes(userEmail)) return false;
      }

      const matchesSeller = sellerFilter === 'Todos' || order.vendedor === sellerFilter;

      const matchesSearch = !searchTerm || Object.values(order).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );

      return matchesSeller && matchesSearch;
    });
  }, [currentTabOrders, sellerFilter, searchTerm, userRole, user, hasPermission]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className=" text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Header con título y botón Nuevo Pedido */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-4 sm:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
              Centro de Pedidos G3D
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {currentTab === 'inactivos' ? 'Pedidos Inactivos' : 'Pedidos Activos'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            {currentTab === 'inactivos' 
              ? 'Histórico de pedidos entregados y saldados para garantía y registro.'
              : 'Monitoreo en tiempo real de fabricación, saldos y entregas pendientes.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setG3dOrderToEdit(null);
              setG3dOrderForm({
                vendedor: user?.nombre || user?.email || '',
                cliente_nombre: '',
                cliente_telefono: '',
                producto_id: '',
                producto_nombre: '',
                precio: '',
                imagenes: [] as string[],
                link_recomendado: '',
                descripcion: '',
                producto_confirmado: false
              });
              setIsG3dModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </header>

      {/* Tab Selector & Filtros */}
      <div className="px-4 sm:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <button 
            onClick={() => setSearchParams({ tab: 'activos' })}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
              currentTab === 'activos'
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <PackageCheck size={16} />
            <span>Pedidos Activos</span>
            <span className={cn(
              "px-2 py-0.5 text-[10px] rounded-full font-bold",
              currentTab === 'activos' ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
              {activeOrdersList.length}
            </span>
          </button>

          <button 
            onClick={() => setSearchParams({ tab: 'inactivos' })}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
              currentTab === 'inactivos'
                ? "bg-slate-800 dark:bg-slate-700 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Archive size={16} />
            <span>Pedidos Inactivos</span>
            <span className={cn(
              "px-2 py-0.5 text-[10px] rounded-full font-bold",
              currentTab === 'inactivos' ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
              {inactiveOrdersList.length}
            </span>
          </button>
        </div>

        {/* Buscador y Filtro de Vendedor */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar cliente, ítem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-48 sm:w-60 font-semibold"
            />
          </div>
          {availableSellers.length > 0 && (
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
            >
              <option value="Todos">Todos los Vendedores</option>
              {availableSellers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
        {displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <ClipboardList size={48} className="text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {currentTab === 'inactivos' ? 'No hay pedidos inactivos' : 'No hay pedidos activos'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              {currentTab === 'inactivos'
                ? 'Los pedidos entregados y completamente saldados aparecerán aquí automáticamente.'
                : 'Comienza registrando un nuevo pedido usando el botón superior "Nuevo Pedido".'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista Desktop (Tabla) */}
            <div className="hidden md:block overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3.5">ID / Fecha</th>
                    <th className="px-4 py-3.5">Vendedor</th>
                    <th className="px-4 py-3.5">Cliente</th>
                    <th className="px-3 py-3.5 text-center">Cant.</th>
                    <th className="px-4 py-3.5">Ítem a Fabricar</th>
                    <th className="px-4 py-3.5">Precio / Seña / Saldo</th>
                    <th className="px-4 py-3.5 text-center">Estado Producción</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {displayedOrders.map((order) => {
                    const firstItem = (order.items && order.items[0]) || {};
                    const itemTitle = order.item_nombre || firstItem.item || order.producto_nombre || 'Ítem sin nombre';
                    const itemQty = order.item_cantidad || firstItem.cantidad || order.cantidad || 1;
                    const itemImgs = Array.from(new Set([...getProductImages(firstItem), ...getProductImages(order)]));
                    const itemImg = itemImgs[0] || '';
                    const itemDesc = firstItem.descripcion || order.descripcion || '';

                    const totalPrice = parseFloat(order.precio_total ?? order.monto_total ?? order.precio ?? 0);
                    const paidAmount = parseFloat(order.total_pagado ?? order.monto_pagado ?? order.seña ?? 0);
                    const remainingSaldo = parseFloat(order.saldo ?? (totalPrice - paidAmount));

                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrderDetails(order)}
                        className={cn(
                          "hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors cursor-pointer",
                          order.producto_confirmado && "bg-emerald-500/[0.02]"
                        )}
                      >
                        {/* ID / Fecha */}
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {order.id}
                          </span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                            {new Date(order.fecha || order.fecha_creacion || Date.now()).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Vendedor */}
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                            {order.vendedor || '—'}
                          </span>
                          {order.vendedor_telefono && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                              📞 {order.vendedor_telefono}
                            </span>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="px-4 py-3.5 align-middle">
                          {order.cliente_nombre && order.cliente_nombre.trim() !== '' ? (
                            <>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                                {order.cliente_nombre}
                              </span>
                              {order.cliente_telefono && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                  📞 {order.cliente_telefono}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No especificado</span>
                          )}
                        </td>

                        {/* Cantidad */}
                        <td className="px-3 py-3.5 text-center align-middle">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black rounded-lg text-xs border border-indigo-100 dark:border-indigo-900/40">
                            {itemQty} u.
                          </span>
                        </td>

                        {/* Ítem a fabricar */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {itemImg ? (
                              <div className="relative size-9 shrink-0">
                                <img 
                                  src={itemImg} 
                                  alt={itemTitle} 
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback') as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                  className="size-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm cursor-zoom-in"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(itemImg, '_blank');
                                  }}
                                />
                                <div className="img-fallback hidden size-9 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400 shrink-0">
                                  <Package size={14} />
                                </div>
                              </div>
                            ) : (
                              <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                <Package size={14} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate max-w-[200px]">
                                {itemTitle}
                              </p>
                              {itemDesc && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                                  {itemDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Precio / Seña / Saldo */}
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                            ${totalPrice.toLocaleString()}
                          </span>
                          {paidAmount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                              Abonado: ${paidAmount.toLocaleString()}
                            </span>
                          )}
                          {remainingSaldo > 0 ? (
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 block bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 w-fit mt-0.5">
                              Debe: ${remainingSaldo.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40 w-fit mt-0.5">
                              ✓ Saldado
                            </span>
                          )}
                        </td>

                        {/* Estado Producción */}
                        <td className="px-4 py-3.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.estado_pedido || order.estado || 'FALTA DISEÑAR'}
                            onChange={(e) => handleStatusChange(order.id || order.id_pedido || order.codigo_pedido, e.target.value)}
                            disabled={updatingStatusId === (order.id || order.id_pedido || order.codigo_pedido)}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-all bg-white dark:bg-slate-900 shadow-sm",
                              (order.estado_pedido || order.estado || '').toUpperCase() === 'ENTREGADO'
                                ? "text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800"
                                : (order.estado_pedido || order.estado || '').toUpperCase() === 'EN IMPRESIÓN'
                                ? "text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800"
                                : "text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800"
                            )}
                          >
                            {renderStatusOptions(order.estado_pedido || order.estado)}
                          </select>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón $ de Asentar Pago */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPaymentModal(order);
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-lg border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Asentar pago / Abonar deuda"
                            >
                              <DollarSign size={13} />
                              <span>Pagar</span>
                            </button>

                            {/* Ver bitácora */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderDetails(order);
                              }}
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                              title="Ver bitácora y avance"
                            >
                              <Eye size={13} />
                            </button>

                            {/* Editar */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setG3dOrderToEdit(order);
                                setG3dOrderForm({
                                  vendedor: order.vendedor || user?.nombre || user?.email || '',
                                  cliente_nombre: order.cliente_nombre || '',
                                  cliente_telefono: order.cliente_telefono || '',
                                  producto_id: order.producto_id || '',
                                  producto_nombre: order.producto_nombre || order.item_nombre || '',
                                  precio: order.precio || order.precio_total || '',
                                  imagenes: getProductImages(order),
                                  link_recomendado: order.link_recomendado || '',
                                  descripcion: order.descripcion || '',
                                  producto_confirmado: order.producto_confirmado || false
                                });
                                setIsG3dModalOpen(true);
                              }}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                              title="Editar pedido"
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Eliminar */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteG3dOrder(order.id);
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                              title="Eliminar pedido"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Mobile */}
            <div className="block md:hidden space-y-4">
              {displayedOrders.map((order) => {
                const firstItem = (order.items && order.items[0]) || {};
                const itemTitle = order.item_nombre || firstItem.item || order.producto_nombre || 'Ítem sin nombre';
                const itemQty = order.item_cantidad || firstItem.cantidad || order.cantidad || 1;
                const itemImgs = Array.from(new Set([...getProductImages(firstItem), ...getProductImages(order)]));
                const itemImg = itemImgs[0] || '';
                const itemDesc = firstItem.descripcion || order.descripcion || '';

                const totalPrice = parseFloat(order.precio_total ?? order.monto_total ?? order.precio ?? 0);
                const paidAmount = parseFloat(order.total_pagado ?? order.monto_pagado ?? order.seña ?? 0);
                const remainingSaldo = parseFloat(order.saldo ?? (totalPrice - paidAmount));

                return (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrderDetails(order)}
                    className={cn(
                      "bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm space-y-3.5 transition-all cursor-pointer hover:border-indigo-500/40",
                      order.producto_confirmado 
                        ? "border-emerald-500/30 bg-emerald-500/[0.01]" 
                        : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    {/* Cabecera Tarjeta */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {new Date(order.fecha || order.fecha_creacion || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.estado_pedido || order.estado || 'FALTA DISEÑAR'}
                          onChange={(e) => handleStatusChange(order.id || order.id_pedido || order.codigo_pedido, e.target.value)}
                          disabled={updatingStatusId === (order.id || order.id_pedido || order.codigo_pedido)}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border outline-none cursor-pointer bg-white dark:bg-slate-900",
                            (order.estado_pedido || order.estado || '').toUpperCase() === 'ENTREGADO' 
                              ? "text-emerald-800 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800" 
                              : "text-amber-800 border-amber-300 dark:text-amber-300 dark:border-amber-800"
                          )}
                        >
                          {renderStatusOptions(order.estado_pedido || order.estado)}
                        </select>
                      </div>
                    </div>

                    {/* Info de Vendedor y Cliente */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 text-xs">
                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-400 dark:text-slate-500">Vendedor</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {order.vendedor || '—'}
                        </span>
                        {order.vendedor_telefono && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            📞 {order.vendedor_telefono}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[8px] font-black uppercase text-slate-400 dark:text-slate-500">Cliente</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {order.cliente_nombre || <span className="text-slate-400 italic font-normal">Sin cliente</span>}
                        </span>
                        {order.cliente_telefono && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            📞 {order.cliente_telefono}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ítem a Fabricar */}
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-xl flex items-center gap-3">
                      {itemImg ? (
                        <div className="relative size-11 shrink-0">
                          <img 
                            src={itemImg} 
                            alt={itemTitle} 
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            className="size-11 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm cursor-pointer"
                            onClick={() => window.open(itemImg, '_blank')}
                          />
                          <div className="img-fallback hidden size-11 rounded-lg bg-indigo-100/50 dark:bg-indigo-900/40 items-center justify-center text-indigo-500 shrink-0">
                            <Package size={18} />
                          </div>
                        </div>
                      ) : (
                        <div className="size-11 rounded-lg bg-indigo-100/50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 shrink-0">
                          <Package size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Cantidad: {itemQty} u.
                        </span>
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate mt-0.5">
                          {itemTitle}
                        </h5>
                        {itemDesc && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {itemDesc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Precios & Saldos */}
                    <div className="flex items-center justify-between px-1 text-xs bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Total</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          ${totalPrice.toLocaleString()}
                        </span>
                      </div>
                      {paidAmount > 0 && (
                        <div className="text-center">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Abonado</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ${paidAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Saldo</span>
                        {remainingSaldo > 0 ? (
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                            Debe: ${remainingSaldo.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            ✓ Saldado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botones de Acción Mobile */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {/* Botón $ Asentar Pago */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPaymentModal(order);
                        }}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-xl border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <DollarSign size={13} />
                        <span>Asentar Pago ($)</span>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderDetails(order);
                        }}
                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                        title="Bitácora"
                      >
                        <Eye size={14} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteG3dOrder(order.id);
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

        {/* Modal de Crear/Editar Pedido G3D */}
        {isG3dModalOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white">
              
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <PlusCircle size={20} className="text-emerald-500" />
                    {g3dOrderToEdit ? 'Editar Pedido de Diseño G3D' : 'Crear Pedido de Diseño G3D'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Selecciona items del catálogo con precio minorista y mayorista autocompletados
                  </p>
                </div>
                <button 
                  onClick={() => setIsG3dModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                 
                 {/* Switch de Precio Mayorista */}
                 <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                   <div>
                     <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                       <ShoppingBag size={14} className="text-indigo-600 dark:text-indigo-400" />
                       Aplicar Tarifa Mayorista
                     </h4>
                     <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80">
                       Al activar, se autocompletarán los precios mayoristas configurados de los productos
                     </p>
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       const nextState = !g3dOrderForm.es_mayorista;
                       setG3dOrderForm(prev => {
                         const updatedItems = (prev.items || []).map((row) => {
                           if (!row.item) return row;
                           const matchedProd = g3dProducts.find(p => 
                             p.nombre === row.item || 
                             (p.variantes && p.variantes.some((v: any) => `${p.nombre} (${v.combinacion})` === row.item))
                           );
                           if (!matchedProd) return row;

                           let matchedVar: any = null;
                           if (matchedProd.variantes) {
                             matchedVar = matchedProd.variantes.find((v: any) => `${matchedProd.nombre} (${v.combinacion})` === row.item);
                           }

                           let newPrice = Number(row.precio);
                           if (matchedVar) {
                             const vMin = (matchedVar.precio && Number(matchedVar.precio) > 0) ? Number(matchedVar.precio) : Number(matchedProd.precio || 0);
                             const vMay = (matchedVar.precio_mayorista && Number(matchedVar.precio_mayorista) > 0) ? Number(matchedVar.precio_mayorista) : ((matchedProd.precio_mayorista && Number(matchedProd.precio_mayorista) > 0) ? Number(matchedProd.precio_mayorista) : vMin);
                             newPrice = nextState ? vMay : vMin;
                           } else {
                             const pMin = Number(matchedProd.precio || 0);
                             const pMay = (matchedProd.precio_mayorista && Number(matchedProd.precio_mayorista) > 0) ? Number(matchedProd.precio_mayorista) : pMin;
                             newPrice = nextState ? pMay : pMin;
                           }

                           return { ...row, precio: newPrice };
                         });

                         const total = updatedItems.reduce((acc, current) => {
                           const qty = current.cantidad || 0;
                           const pr = parseFloat(String(current.precio)) || 0;
                           return acc + (qty * pr);
                         }, 0);

                         return {
                           ...prev,
                           es_mayorista: nextState,
                           items: updatedItems,
                           precio: String(total)
                         };
                       });
                     }}
                     className={cn(
                       "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                       g3dOrderForm.es_mayorista ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                     )}
                   >
                     <span
                       className={cn(
                         "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                         g3dOrderForm.es_mayorista ? "translate-x-5" : "translate-x-0"
                       )}
                     />
                   </button>
                 </div>

                 {/* Grid para Vendedor y Cliente */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   
                   {/* Vendedor Dropdown */}
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Nombre del Vendedor *
                     </label>
                     {(hasPermission('G3d.CrearPedido.EscribirVendedor') || hasPermission('Admin.*') || userRole === 'Admin') ? (
                       <>
                         <input
                           type="text"
                           list="g3d-vendedores-list-orders"
                           value={g3dOrderForm.vendedor || ''}
                           onChange={handleVendorInputChange}
                           placeholder="Escribe o selecciona vendedor..."
                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                         />
                         <datalist id="g3d-vendedores-list-orders">
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
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Teléfono del Vendedor <span className="text-slate-400 text-[9px] lowercase">(autocompletado)</span>
                     </label>
                     <input 
                       type="text" 
                       placeholder="Ej: +54 9 11 1234-5678"
                       value={g3dOrderForm.vendedor_telefono}
                       onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, vendedor_telefono: e.target.value })}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                     />
                   </div>

                   {/* Cliente Nombre */}
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Nombre Completo del Cliente
                     </label>
                     <input 
                       type="text" 
                       placeholder="Ej: Juan Pérez"
                       value={g3dOrderForm.cliente_nombre}
                       onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, cliente_nombre: e.target.value })}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                     />
                   </div>

                   {/* Cliente Teléfono */}
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Teléfono del Cliente
                     </label>
                     <input 
                       type="text" 
                       placeholder="Ej: +54 9 11 1234-5678"
                       value={g3dOrderForm.cliente_telefono}
                       onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, cliente_telefono: e.target.value })}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                     />
                   </div>

                 </div>

                 {/* Lista de Ítems / Productos */}
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                       Items / Productos del Pedido
                     </label>
                     <button
                       type="button"
                       onClick={handleAddItemRow}
                       className="px-2.5 py-1 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 uppercase transition-colors cursor-pointer"
                     >
                       <Plus size={12} /> Agregar Item
                     </button>
                   </div>

                   {/* Filas de Ítems */}
                   <div className="space-y-4">
                     {g3dOrderForm.items && g3dOrderForm.items.map((row, idx) => {
                       const searchVal = (row.item || '').toLowerCase().trim();
                       const filteredProds = searchVal.length > 0 
                         ? g3dProducts.filter(p => 
                             p.nombre?.toLowerCase().includes(searchVal) ||
                             p.categoria?.toLowerCase().includes(searchVal) ||
                             (p.variantes && p.variantes.some((v: any) => v.combinacion?.toLowerCase().includes(searchVal)))
                           )
                         : g3dProducts;

                       return (
                         <div key={row.id || idx} className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                           <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                               Ítem #{idx + 1}
                             </span>
                             <div className="flex items-center gap-2">
                               <button
                                 type="button"
                                 onClick={() => handleToggleItemConfirm(idx)}
                                 className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                   Boolean(row.confirmado)
                                     ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                     : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                                 }`}
                               >
                                 <CheckCircle2 size={12} />
                                 <span>{row.confirmado ? 'Confirmado' : 'Confirmar'}</span>
                               </button>
                               {(g3dOrderForm.items || []).length > 1 && (
                                 <button
                                   type="button"
                                   onClick={() => handleRemoveItemRow(idx)}
                                   className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               )}
                             </div>
                           </div>

                           <div className="grid grid-cols-12 gap-3">
                             {/* Cantidad */}
                             <div className="col-span-3 md:col-span-2 space-y-1">
                               <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Cant.</label>
                               <input 
                                 type="number" 
                                 min="1"
                                 value={row.cantidad}
                                 onChange={(e) => handleUpdateItemField(idx, 'cantidad', parseInt(e.target.value) || 1)}
                                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                               />
                             </div>

                             {/* Búsqueda / Autocompletado de Producto */}
                             <div className="col-span-9 md:col-span-7 space-y-1 relative">
                               <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Seleccionar Producto del Catálogo</label>
                               <input 
                                 type="text" 
                                 placeholder="Escribe para buscar producto..."
                                 value={row.item}
                                 onFocus={() => setFocusedItemIdx(idx)}
                                 onChange={(e) => handleUpdateItemField(idx, 'item', e.target.value)}
                                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                               />

                               {/* Desplegable Autocomplete */}
                               {focusedItemIdx === idx && (
                                 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                   <div className="p-2 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                     <span>Catálogo G3D ({filteredProds.length} resultados)</span>
                                     <button type="button" onClick={() => setFocusedItemIdx(null)} className="hover:text-slate-600 dark:hover:text-slate-200"><X size={12} /></button>
                                   </div>
                                   {filteredProds.length === 0 ? (
                                     <div className="p-3 text-center text-xs text-slate-400 italic">No se encontraron productos coincidentes</div>
                                   ) : (
                                     filteredProds.map((p) => {
                                       const hasVariants = p.variantes && p.variantes.length > 0;
                                       const pRetail = Number(p.precio || 0);
                                       const pWholesale = (p.precio_mayorista && Number(p.precio_mayorista) > 0) ? Number(p.precio_mayorista) : pRetail;

                                       return (
                                         <div key={p.id} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                           <div 
                                             className="flex items-center justify-between cursor-pointer p-1 rounded-lg"
                                             onClick={() => handleSelectProductForItem(idx, p)}
                                           >
                                             <div className="flex items-center gap-2 min-w-0">
                                               {p.imagen ? (
                                                 <img src={p.imagen} alt={p.nombre} className="size-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                                               ) : (
                                                 <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><Package size={14} /></div>
                                               )}
                                               <div className="min-w-0">
                                                 <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">{p.nombre}</span>
                                                 <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                   Min: ${pRetail} | May: ${pWholesale}
                                                 </span>
                                               </div>
                                             </div>
                                             <button 
                                               type="button"
                                               className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-500/20"
                                             >
                                               Seleccionar
                                             </button>
                                           </div>

                                           {/* Lista de Variantes si existen */}
                                           {hasVariants && (
                                             <div className="ml-10 mt-1.5 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-900/60 pl-2">
                                               {p.variantes.map((v: any) => {
                                                 const vRetail = (v.precio && Number(v.precio) > 0) ? Number(v.precio) : pRetail;
                                                 const vWholesale = (v.precio_mayorista && Number(v.precio_mayorista) > 0) ? Number(v.precio_mayorista) : pWholesale;

                                                 return (
                                                   <div 
                                                     key={v.id || v.combinacion}
                                                     onClick={() => handleSelectProductForItem(idx, p, v)}
                                                     className="flex items-center justify-between p-1.5 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors text-xs"
                                                   >
                                                     <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                       ↳ {v.combinacion}
                                                     </span>
                                                     <div className="flex items-center gap-2">
                                                       <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                                         Min: ${vRetail} | May: ${vWholesale}
                                                       </span>
                                                       <span className="text-[9px] font-black uppercase text-indigo-500">Elegir</span>
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
                               )}
                             </div>

                             {/* Precio */}
                             <div className="col-span-12 md:col-span-3 space-y-1">
                               <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Precio Un. ($)</label>
                               <input 
                                 type="number" 
                                 placeholder="0"
                                 value={row.precio}
                                 onChange={(e) => handleUpdateItemField(idx, 'precio', e.target.value)}
                                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                               />
                             </div>
                           </div>

                           {/* Descripción / Notas del Ítem */}
                           <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Detalles / Instrucciones del Ítem</label>
                             <textarea 
                               rows={2}
                               placeholder="Ej: Color azul brillante, escala 120%, relleno 15%"
                               value={row.descripcion}
                               onChange={(e) => handleUpdateItemField(idx, 'descripcion', e.target.value)}
                               className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-800 dark:text-slate-100 resize-none focus:outline-none"
                             />
                           </div>

                           {/* Galería de Imágenes y Carga Directa */}
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                 Fotos / Imágenes del Ítem ({(Array.isArray(row.imagenes) ? row.imagenes.length : (row.imagen ? 1 : 0))}/5 max)
                               </span>
                               {(Array.isArray(row.imagenes) ? row.imagenes.length : (row.imagen ? 1 : 0)) < 5 && (
                                 <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-500 cursor-pointer transition-all">
                                   <Upload size={12} className="text-slate-400" />
                                   Adjuntar Fotos (hasta 5)
                                   <input 
                                     type="file" 
                                     accept="image/*" 
                                     multiple
                                     className="hidden" 
                                     onChange={(e) => handleUploadItemImage(idx, e)} 
                                   />
                                 </label>
                               )}
                             </div>

                             {/* Previews de Imágenes */}
                             {((Array.isArray(row.imagenes) && row.imagenes.length > 0) || row.imagen) && (
                               <div className="flex items-center gap-2 overflow-x-auto p-1">
                                 {(Array.isArray(row.imagenes) && row.imagenes.length > 0 ? row.imagenes : [row.imagen]).map((imgSrc: string, imgIdx: number) => (
                                   <div key={imgIdx} className="relative size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group shrink-0 shadow-sm">
                                     <img src={imgSrc} alt={`Miniatura ${imgIdx}`} className="w-full h-full object-cover" />
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setG3dOrderForm(prev => {
                                           const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                                           const updated = currentItems.map((r, i) => {
                                             if (i === idx) {
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
                                       className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl cursor-pointer"
                                     >
                                       <X size={14} />
                                     </button>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>

                           {/* Link 3MF del Ítem */}
                           <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                               Link / URL de Descarga del Archivo .3MF (Opcional)
                             </label>
                             <div className="flex gap-2">
                               <input 
                                 type="url" 
                                 placeholder="https://... (Link de descarga directa del modelo 3d)"
                                 value={row.archivo_link || ''}
                                 onChange={(e) => handleUpdateItemField(idx, 'archivo_link', e.target.value)}
                                 className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
                               />
                               {row.archivo_link && row.archivo_link.trim() !== '' && (
                                 <a 
                                   href={row.archivo_link} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   download
                                   className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
                                 >
                                   <Download size={13} /> Probar Link
                                 </a>
                               )}
                             </div>
                           </div>

                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Precio Final y Seña */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Precio Total del Pedido ($) * <span className="text-slate-400 text-[9px] lowercase">(autocalculado/editable)</span>
                     </label>
                     <input 
                       type="number" 
                       placeholder="Ej: 15000"
                       value={g3dOrderForm.precio}
                       onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, precio: e.target.value })}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                     />
                   </div>

                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                       Seña ($) <span className="text-slate-400 text-[9px] lowercase">(opcional)</span>
                     </label>
                     <input 
                       type="number" 
                       placeholder="Ej: 5000"
                       value={g3dOrderForm.seña}
                       onChange={(e) => setG3dOrderForm({ ...g3dOrderForm, seña: e.target.value })}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                     />
                   </div>
                 </div>

                 {/* Sección Separada: Capturas / Comprobantes de Pago (Vendedor / Cliente) */}
                 <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/10 border border-emerald-500/20 rounded-2xl space-y-3">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div>
                       <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                         <DollarSign size={14} className="text-emerald-500" />
                         Capturas / Comprobantes de Pago (Vendedor / Cliente)
                       </h4>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                         Carga aquí las capturas de transferencia o comprobantes de pago. Estarán separadas de las imágenes de muestra de fabricación.
                       </p>
                     </div>
                     <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0">
                       <Upload size={14} />
                       <span>Subir Capturas (Múltiple)</span>
                       <input 
                         type="file" 
                         accept="image/*" 
                         multiple
                         className="hidden" 
                         onChange={handleUploadPaymentCaptures} 
                       />
                     </label>
                   </div>

                   {/* Previews de Capturas de Pago */}
                   {Array.isArray(g3dOrderForm.capturas_pago) && g3dOrderForm.capturas_pago.length > 0 ? (
                     <div className="flex items-center gap-2.5 overflow-x-auto p-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-500/20">
                       {g3dOrderForm.capturas_pago.map((capUrl, capIdx) => (
                         <div key={capIdx} className="relative size-14 rounded-xl overflow-hidden border-2 border-emerald-500/40 group shrink-0 shadow-sm bg-slate-100 dark:bg-slate-800">
                           <img src={capUrl} alt={`Captura ${capIdx + 1}`} className="w-full h-full object-cover" />
                           <div className="absolute top-0.5 left-0.5 px-1 bg-emerald-600/90 text-white text-[8px] font-black rounded uppercase">
                             Pago #{capIdx + 1}
                           </div>
                           <button
                             type="button"
                             onClick={() => {
                               setG3dOrderForm(prev => ({
                                 ...prev,
                                 capturas_pago: (prev.capturas_pago || []).filter((_, k) => k !== capIdx)
                               }));
                             }}
                             className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-xl"
                             title="Eliminar captura"
                           >
                             <X size={14} />
                           </button>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                       No se han adjuntado capturas de pago aún.
                     </div>
                   )}
                 </div>

                 {/* Switch de Confirmado */}
                 <div className="flex items-center justify-between p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                   <div>
                     <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">¿Producto Confirmado?</h4>
                     <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">
                       Indica si el cliente ha confirmado la fabricación de este diseño
                     </p>
                   </div>
                   <button
                     type="button"
                     onClick={() => setG3dOrderForm({ ...g3dOrderForm, producto_confirmado: !g3dOrderForm.producto_confirmado })}
                     className={cn(
                       "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                       g3dOrderForm.producto_confirmado ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                     )}
                   >
                     <span
                       className={cn(
                         "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                         g3dOrderForm.producto_confirmado ? "translate-x-5" : "translate-x-0"
                       )}
                     />
                   </button>
                 </div>

              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setIsG3dModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveG3dOrder}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {g3dOrderToEdit ? 'Guardar Cambios' : 'Confirmar y Crear Pedido'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal Informativo de Detalle del Pedido */}
        {selectedOrderDetails && (() => {
          // Extracción y validación rigurosa de Vendedor
          const sellerName = (selectedOrderDetails.vendedor || selectedOrderDetails.vendedor_nombre || '').trim();
          const sellerPhone = (selectedOrderDetails.vendedor_telefono || '').trim();
          const isSellerEmpty = !sellerName || ['perdio', 'desconocido', 'sin vendedor', 'ninguno', 'null', 'undefined'].includes(sellerName.toLowerCase());
          const showSellerCard = !isSellerEmpty || sellerPhone !== '';

          // Extracción y validación rigurosa de Cliente
          const clientName = (selectedOrderDetails.cliente_nombre || selectedOrderDetails.cliente || '').trim();
          const clientPhone = (selectedOrderDetails.cliente_telefono || selectedOrderDetails.telefono || '').trim();
          const clientAddress = (selectedOrderDetails.cliente_direccion || selectedOrderDetails.direccion || '').trim();
          const isClientEmpty = !clientName || ['desconocido', 'ninguno', 'null', 'undefined'].includes(clientName.toLowerCase());
          const showClientCard = !isClientEmpty || clientPhone !== '' || clientAddress !== '';

          // Cálculo Financiero
          const totalPrice = parseFloat(String(selectedOrderDetails.precio || 0));
          const paidAmount = parseFloat(String(selectedOrderDetails.seña || selectedOrderDetails.monto_abonado || 0));
          const remainingBalance = Math.max(0, totalPrice - paidAmount);
          const isFullyPaid = remainingBalance <= 0 && totalPrice > 0;

          // Recopilación de imágenes separando Muestras/Fabricación y Capturas de Pago
          const orderImages = getProductImages(selectedOrderDetails);
          const itemImages: string[] = [];
          if (Array.isArray(selectedOrderDetails.items)) {
            selectedOrderDetails.items.forEach((it: any) => {
              itemImages.push(...getProductImages(it));
            });
          }
          const bitacoraImages: string[] = [];
          if (Array.isArray(selectedOrderDetails.bitacora_fabricacion)) {
            selectedOrderDetails.bitacora_fabricacion.forEach((log: any) => {
              if (log.foto) bitacoraImages.push(log.foto);
            });
          }
          const paymentImages: string[] = [];
          if (Array.isArray(selectedOrderDetails.capturas_pago)) paymentImages.push(...selectedOrderDetails.capturas_pago);
          if (Array.isArray(selectedOrderDetails.comprobantes_pago)) paymentImages.push(...selectedOrderDetails.comprobantes_pago);
          if (selectedOrderDetails.comprobante_url) paymentImages.push(selectedOrderDetails.comprobante_url);
          if (selectedOrderDetails.comprobante_img) paymentImages.push(selectedOrderDetails.comprobante_img);

          const sampleImages = Array.from(new Set([...orderImages, ...itemImages, ...bitacoraImages])).filter(Boolean);
          const distinctPaymentImages = Array.from(new Set(paymentImages)).filter(Boolean);

          return (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
                
                {/* Encabezado Principal */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-sm">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Detalles del Pedido #{selectedOrderDetails.id}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        Registrado el: {new Date(selectedOrderDetails.fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrderDetails(null)} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto space-y-6 scrollbar-thin">

                  {/* 1. Estado de Confirmación y Resumen Financiero Estratégico */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950/80 dark:to-indigo-950/20 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {/* Confirmación de Pedido */}
                    <div className="space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Estado de Confirmación
                        </span>
                        <div className="inline-flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm border",
                            selectedOrderDetails.producto_confirmado 
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" 
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          )}>
                            <div className={cn("size-2 rounded-full animate-pulse", selectedOrderDetails.producto_confirmado ? "bg-emerald-500" : "bg-amber-500")} />
                            {selectedOrderDetails.producto_confirmado ? '✓ Producto Confirmado' : '⏳ Pendiente de Confirmación'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Estado de Pago
                        </span>
                        <span className={cn(
                          "text-xs font-extrabold uppercase px-3 py-1 rounded-xl inline-block border",
                          isFullyPaid 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                        )}>
                          {isFullyPaid ? '✓ Totalmente Saldado' : paidAmount > 0 ? '⚡ Cuenta con Seña' : '⚠️ Sin Pagos Asentados'}
                        </span>
                      </div>
                    </div>

                    {/* Balance Financiero y Botón de Pago */}
                    <div className="text-right flex flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                          Monto Total
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          ${totalPrice.toFixed(2)}
                        </span>

                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Abonado: ${paidAmount.toFixed(2)}
                          </p>
                          {remainingBalance > 0 && (
                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg inline-block border border-amber-500/20">
                              Saldo Restante: ${remainingBalance.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const orderToPay = selectedOrderDetails;
                          setSelectedOrderDetails(null);
                          handleOpenPaymentModal(orderToPay);
                        }}
                        className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2 hover:scale-102 active:scale-98"
                      >
                        <DollarSign size={15} />
                        <span>Asentar Pago ($)</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Proceso de Fabricación (Stepper Interactivo y Selector) */}
                  <div className="p-4 sm:p-5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Wrench size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                          Etapa de Fabricación
                        </span>
                      </div>
                      
                      {/* Desplegable interactivo para cambiar estado en Vista Previa */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Estado:</span>
                        <select
                          value={selectedOrderDetails.estado_pedido || selectedOrderDetails.estado || 'FALTA DISEÑAR'}
                          onChange={async (e) => {
                            const newSt = e.target.value;
                            const targetId = selectedOrderDetails.id || selectedOrderDetails.id_pedido || selectedOrderDetails.codigo_pedido;
                            await handleStatusChange(targetId, newSt);
                          }}
                          disabled={updatingStatusId === (selectedOrderDetails.id || selectedOrderDetails.id_pedido || selectedOrderDetails.codigo_pedido)}
                          className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 outline-none cursor-pointer shadow-sm hover:border-indigo-500 transition-all"
                        >
                          {renderStatusOptions(selectedOrderDetails.estado_pedido || selectedOrderDetails.estado)}
                        </select>
                      </div>
                    </div>

                    {/* Botones de Acceso Rápido por Etapa */}
                    <div className="flex flex-wrap gap-1.5">
                      {availableStatuses.map((st, idx) => {
                        const statusName = typeof st === 'string' ? st : (st?.nombre_estado || '');
                        const statusKey = typeof st === 'string' ? st : (st?.id || st?.nombre_estado || `st-${idx}`);
                        if (!statusName) return null;
                        const isActive = (selectedOrderDetails.estado_pedido || 'Falta Diseñar').toUpperCase() === statusName.toUpperCase();
                        const targetId = selectedOrderDetails.id || selectedOrderDetails.id_pedido || selectedOrderDetails.codigo_pedido;
                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={async () => {
                              await handleStatusChange(targetId, statusName);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1.5",
                              isActive
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            {isActive && <Check size={12} />}
                            <span>{statusName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón y Desplegable para Registrar Avance / Foto de Fabricación */}
                    <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                      <button
                        type="button"
                        onClick={() => setShowAddFabricationNote(!showAddFabricationNote)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>{showAddFabricationNote ? 'Ocultar Formulario de Avance' : 'Registrar Avance / Foto de Producción'}</span>
                      </button>

                      {showAddFabricationNote && (
                        <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3 animate-in fade-in duration-150">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            Detalles del Avance de Producción
                          </span>
                          <textarea
                            value={fabricationNote}
                            onChange={(e) => setFabricationNote(e.target.value)}
                            placeholder="Escribe detalles del avance de fabricación (ej: Pieza #1 impresa correctamente, pasando a postprocesado)..."
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            rows={2}
                          />

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors">
                              <Camera size={14} className="text-indigo-500" />
                              <span>{fabricationPhoto ? 'Cambiar Foto' : 'Adjuntar Foto de Avance'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFabPhotoChange}
                                className="hidden"
                              />
                            </label>

                            {fabricationPhoto && (
                              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 p-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900">
                                <img src={fabricationPhoto} alt="Foto Avance" className="size-8 rounded-lg object-cover" />
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Foto lista</span>
                                <button
                                  type="button"
                                  onClick={() => setFabricationPhoto(null)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleSaveFabricationProgress}
                              disabled={isProcessingFabPhoto}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <UploadCloud size={14} />
                              <span>Guardar Avance</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bitácora de Fabricación Histórica */}
                    {Array.isArray(selectedOrderDetails.bitacora_fabricacion) && selectedOrderDetails.bitacora_fabricacion.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Historial de Avances Registrados
                        </span>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                          {selectedOrderDetails.bitacora_fabricacion.map((log: any, lIdx: number) => (
                            <div key={lIdx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-3 justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                    {log.usuario || 'Producción'}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(log.fecha).toLocaleString()}
                                  </span>
                                </div>
                                {log.nota && <p className="text-slate-700 dark:text-slate-300 font-medium">{log.nota}</p>}
                              </div>
                              {log.foto && (
                                <button
                                  type="button"
                                  onClick={() => openLightbox([log.foto], 0, 'Foto de Avance de Fabricación')}
                                  className="shrink-0 relative group"
                                >
                                  <img src={log.foto} alt="Avance" className="size-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 size={12} />
                                  </div>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Vendedor y Cliente (Condicional: Se ocultan 100% si no existen datos válidos) */}
                  {(showSellerCard || showClientCard) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Ficha Vendedor */}
                      {showSellerCard && (
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            Vendedor
                          </span>
                          <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {sellerName}
                          </h5>
                          {sellerPhone && (
                            <a
                              href={`https://wa.me/${sellerPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                            >
                              <Phone size={13} />
                              <span>WhatsApp: {sellerPhone}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Ficha Cliente */}
                      {showClientCard && (
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              Datos del Cliente
                            </span>
                            {(selectedOrderDetails.cliente_id || selectedOrderDetails.id_cliente) && (
                              <span className="text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                                UUID: {(selectedOrderDetails.cliente_id || selectedOrderDetails.id_cliente).toString().slice(0, 8)}...
                              </span>
                            )}
                          </div>
                          {clientName && (
                            <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {clientName}
                            </h5>
                          )}
                          {clientPhone && (
                            <a
                              href={`https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                            >
                              <Phone size={13} />
                              <span>WhatsApp: {clientPhone}</span>
                            </a>
                          )}
                          {clientAddress && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              📍 Dirección: {clientAddress}
                            </p>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* 4. Ítems del Pedido y Especificaciones de la Solicitud */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Ítems y Especificaciones de la Solicitud
                    </h4>

                    {(() => {
                      const itemsList = Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0
                        ? selectedOrderDetails.items
                        : [{
                            item: selectedOrderDetails.item_nombre || selectedOrderDetails.producto_nombre || 'Ítem sin nombre',
                            cantidad: selectedOrderDetails.item_cantidad || 1,
                            precio: selectedOrderDetails.item_precio || selectedOrderDetails.precio || 0,
                            descripcion: selectedOrderDetails.descripcion || '',
                            descripcion_custom: selectedOrderDetails.descripcion_custom || '',
                            descripcion_fabricacion: selectedOrderDetails.descripcion_fabricacion || selectedOrderDetails.notas_fabricacion || '',
                            variante: selectedOrderDetails.variante || selectedOrderDetails.tarifa || '',
                            imagen: (selectedOrderDetails.imagenes && selectedOrderDetails.imagenes[0]) || '',
                            imagenes: selectedOrderDetails.imagenes || [],
                            archivo_link: selectedOrderDetails.archivo_link || selectedOrderDetails.link_3mf || selectedOrderDetails.url || ''
                          }];

                      return itemsList.map((it: any, idx: number) => {
                        const fileLinkKeys = ['archivo_link', 'link_3mf', 'url', 'archivo_url', 'link', 'modelo_link', 'file_url', 'download_url'];
                        let fileLink = '';
                        for (const k of fileLinkKeys) {
                          if (it?.[k] && typeof it[k] === 'string' && it[k].trim()) {
                            fileLink = it[k].trim();
                            break;
                          }
                        }
                        if (!fileLink) {
                          for (const k of fileLinkKeys) {
                            if (selectedOrderDetails?.[k] && typeof selectedOrderDetails[k] === 'string' && selectedOrderDetails[k].trim()) {
                              fileLink = selectedOrderDetails[k].trim();
                              break;
                            }
                          }
                        }

                        const itemCatalogDesc = it.descripcion_custom || it.descripcion_item || (it.descripcion && it.descripcion !== selectedOrderDetails.descripcion ? it.descripcion : '');
                        const itemFabDesc = it.descripcion_fabricacion || it.notas_fabricacion || it.instrucciones_tecnicas;
                        const generalDesc = selectedOrderDetails.descripcion;
                        const itemVariant = it.variante || it.tarifa || it.tipo_tarifa;

                        return (
                          <div key={idx} className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                                    Ítem #{idx + 1} — Cantidad: {it.cantidad || 1} u.
                                  </span>
                                  {itemVariant && (
                                    <span className="text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                      Tarifa/Variante: {itemVariant}
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase mt-0.5">
                                  {it.item || it.item_nombre || 'Ítem sin nombre'}
                                </h5>
                              </div>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                ${it.precio || 0} c/u
                              </span>
                            </div>

                            {/* 1. Descripción Comercial del Ítem (Catálogo) */}
                            {itemCatalogDesc && itemCatalogDesc.trim() !== '' && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                                  🏷️ Descripción Comercial del Ítem:
                                </span>
                                <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 whitespace-pre-line leading-relaxed font-medium">
                                  {itemCatalogDesc}
                                </p>
                              </div>
                            )}

                            {/* 2. Descripción Técnica / Instrucciones para Fabricación */}
                            {itemFabDesc && itemFabDesc.trim() !== '' && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                  🛠️ Instrucciones Técnicas de Fabricación (Taller):
                                </span>
                                <p className="text-xs text-amber-950 dark:text-amber-100 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 whitespace-pre-line leading-relaxed font-medium">
                                  {itemFabDesc}
                                </p>
                              </div>
                            )}

                            {/* 3. Especificaciones Generales de la Solicitud */}
                            {generalDesc && generalDesc.trim() !== '' && !itemCatalogDesc && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                  Especificaciones / Instrucciones de Solicitud:
                                </span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 whitespace-pre-line leading-relaxed font-medium">
                                  {generalDesc}
                                </p>
                              </div>
                            )}

                            {/* Descarga de Archivo Industrial .3MF */}
                            {fileLink !== '' && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
                                    <FileText size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 block truncate">
                                      Modelo 3D Industrial (.3MF)
                                    </span>
                                    <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 block truncate max-w-xs sm:max-w-md">
                                      {fileLink}
                                    </span>
                                  </div>
                                </div>
                                <a 
                                  href={fileLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  download
                                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                                >
                                  <Download size={14} /> Descargar .3MF
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* 5A. Imágenes de Muestra / Fabricación */}
                  {sampleImages.length > 0 && (
                    <div className="p-4 sm:p-5 bg-indigo-50/50 dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera size={16} className="text-indigo-600 dark:text-indigo-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                            Imágenes de Muestra / Fabricación ({sampleImages.length})
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500">
                          Haz clic para ampliar en HD
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                        {sampleImages.map((imgSrc: string, imgIdx: number) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => openLightbox(sampleImages, imgIdx, `Muestra de Fabricación #${selectedOrderDetails.id}`)}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-indigo-200/60 dark:border-slate-800 shadow-sm hover:scale-105 hover:border-indigo-500 transition-all cursor-zoom-in bg-slate-100 dark:bg-slate-800"
                          >
                            <img
                              src={imgSrc}
                              alt={`Muestra ${imgIdx + 1}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 size={16} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5B. Capturas / Comprobantes de Pago (Vendedor / Cliente) */}
                  {distinctPaymentImages.length > 0 && (
                    <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                            Capturas / Comprobantes de Pago ({distinctPaymentImages.length})
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Comprobantes de Pago
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                        {distinctPaymentImages.map((imgSrc: string, imgIdx: number) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => openLightbox(distinctPaymentImages, imgIdx, `Captura de Pago #${selectedOrderDetails.id}`)}
                            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-sm hover:scale-105 hover:border-emerald-500 transition-all cursor-zoom-in bg-white dark:bg-slate-900"
                          >
                            <img
                              src={imgSrc}
                              alt={`Comprobante ${imgIdx + 1}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0.5 left-0.5 px-1 bg-emerald-600/90 text-white text-[8px] font-black rounded uppercase">
                              Pago
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 size={16} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Pie de Modal */}
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
                  <button
                    type="button"
                    onClick={() => {
                      const orderToPay = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      handleOpenPaymentModal(orderToPay);
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <DollarSign size={16} />
                    <span>Asentar Pago ($)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Cerrar Ventana
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Modal de Asentar Pago ($) */}
        {paymentOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                    $
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Asentar Pago de Deuda
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Registrar entrega de dinero / seña del ítem
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setPaymentOrder(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Resumen del Pedido */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ítem / Pedido:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[200px] text-right truncate">
                      {paymentOrder.item_nombre || paymentOrder.producto_nombre || paymentOrder.items?.[0]?.item || 'Pedido G3D'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Vendedor:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentOrder.vendedor || 'General'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Precio Total:</span>
                    <span className="font-bold text-slate-900 dark:text-white">${parseFloat(String(paymentOrder.precio || 0)).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Abonado hasta hoy (Seña):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(String(paymentOrder.seña || 0)).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Saldo Pendiente:</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      ${Math.max(0, parseFloat(String(paymentOrder.precio || 0)) - parseFloat(String(paymentOrder.seña || 0))).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Input Monto a Pagar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Monto a Ingresar / Asentar ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const total = parseFloat(String(paymentOrder.precio || 0));
                        const paid = parseFloat(String(paymentOrder.seña || 0));
                        const remaining = Math.max(0, total - paid);
                        setPaymentAmount(String(remaining));
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Saldar Deuda Total
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Ej: 5000"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-lg text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="MercadoPago">MercadoPago / Virtual</option>
                    <option value="Otro">Otro Método</option>
                  </select>
                </div>

                {/* Notas / Referencia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Notas / Comprobante (Opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Transferencia Banco Galicia / Seña en mano"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Carga de Imagen / Captura de Transferencia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Captura / Foto de Transferencia (Opcional)
                  </label>
                  {paymentImage ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img 
                          src={paymentImage} 
                          alt="Captura comprobante" 
                          className="size-14 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0" 
                        />
                        <div className="overflow-hidden text-left">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Captura Adjunta
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Comprobante listo para registrar</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <label 
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-colors"
                          title="Cambiar imagen"
                        >
                          <Camera size={14} />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePaymentImageChange} 
                            className="hidden" 
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setPaymentImage(null)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar captura"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="group flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 hover:bg-emerald-500/5 transition-all text-center">
                      <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Adjuntar Captura de Transferencia
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Seleccionar desde PC o Galería de Celular
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePaymentImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setPaymentOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={isSubmittingPayment}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingPayment ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                  <span>Confirmar y Asentar Pago</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ventana de Comprobante / Estado de Cuenta Post-Pago */}
        {paymentReceiptModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900 dark:text-white my-8">
              
              {/* Header de la Ventana */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 text-center relative">
                <button
                  onClick={() => setPaymentReceiptModal(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="size-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Comprobante de Pago</h2>
                <p className="text-xs text-emerald-100 mt-1 font-medium">Estado de cuenta actualizado del pedido</p>
              </div>

              {/* Cuerpo / Ticket del Comprobante */}
              <div className="p-6 space-y-5">
                
                {/* Caja de Detalles */}
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedido #{paymentReceiptModal.orderId}</p>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{paymentReceiptModal.itemTitle}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                      {paymentReceiptModal.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Vendedor</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{paymentReceiptModal.vendedor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{paymentReceiptModal.cliente}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Método de Pago</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{paymentReceiptModal.paymentMethod}</p>
                    </div>
                    {paymentReceiptModal.paymentNotes && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Nota / Ref.</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{paymentReceiptModal.paymentNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Desglose Monetario */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Precio Total del Ítem:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${paymentReceiptModal.precioTotal.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Abonado Anteriormente:</span>
                      <span>${paymentReceiptModal.paidBefore.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">Monto Ingresado Ahora:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">+${paymentReceiptModal.amountPaidNow.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Total Abonado Acumulado:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${paymentReceiptModal.newPaidTotal.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  {/* Badge de Estado de Cuenta */}
                  <div className={`p-4 rounded-xl border text-center flex items-center justify-center gap-2.5 ${
                    paymentReceiptModal.remainingDebt === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {paymentReceiptModal.remainingDebt === 0 ? (
                      <>
                        <CheckCircle2 size={20} className="shrink-0" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">¡CUENTA TOTALMENTE SALDADA!</p>
                          <p className="text-[11px] font-bold opacity-90">$0 Deuda Pendiente</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="shrink-0" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">SALDO RESTANTE PENDIENTE</p>
                          <p className="text-sm font-black">${paymentReceiptModal.remainingDebt.toLocaleString('es-AR')}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Captura de Pago Adjunta si existe */}
                  {paymentReceiptModal.paymentImage && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comprobante de Transferencia Adjunto:</p>
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 bg-black/5 flex items-center justify-center">
                        <img 
                          src={paymentReceiptModal.paymentImage} 
                          alt="Comprobante de pago" 
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones de Compartir y Copiar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const text = `🧾 *COMPROBANTE DE PAGO - G3D* 🧾\n---------------------------------\n📦 *Pedido:* ${paymentReceiptModal.itemTitle}\n👤 *Vendedor:* ${paymentReceiptModal.vendedor}\n👤 *Cliente:* ${paymentReceiptModal.cliente}\n📅 *Fecha:* ${paymentReceiptModal.date}\n\n💰 *Precio Total:* $${paymentReceiptModal.precioTotal.toLocaleString('es-AR')}\n💵 *Monto Abonado Ahora:* $${paymentReceiptModal.amountPaidNow.toLocaleString('es-AR')} (${paymentReceiptModal.paymentMethod})\n✅ *Total Abonado:* $${paymentReceiptModal.newPaidTotal.toLocaleString('es-AR')}\n${paymentReceiptModal.remainingDebt === 0 ? '🎉 *ESTADO DE CUENTA:* ¡CUENTA TOTALMENTE SALDADA ($0 DEUDA)!' : `⚠️ *SALDO PENDIENTE:* $${paymentReceiptModal.remainingDebt.toLocaleString('es-AR')}`}\n---------------------------------\n${paymentReceiptModal.paymentNotes ? `📝 *Nota:* ${paymentReceiptModal.paymentNotes}\n` : ''}¡Muchas gracias!`;
                      
                      const phone = paymentReceiptModal.cliente_telefono || paymentReceiptModal.vendedor_telefono || '';
                      const cleanPhone = phone.replace(/[^0-9]/g, '');
                      const url = cleanPhone 
                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
                        : `https://wa.me/?text=${encodeURIComponent(text)}`;
                      
                      window.open(url, '_blank');
                    }}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} />
                    <span>Compartir por WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      const text = `🧾 *COMPROBANTE DE PAGO - G3D* 🧾\n---------------------------------\n📦 *Pedido:* ${paymentReceiptModal.itemTitle}\n👤 *Vendedor:* ${paymentReceiptModal.vendedor}\n👤 *Cliente:* ${paymentReceiptModal.cliente}\n📅 *Fecha:* ${paymentReceiptModal.date}\n\n💰 *Precio Total:* $${paymentReceiptModal.precioTotal.toLocaleString('es-AR')}\n💵 *Monto Abonado Ahora:* $${paymentReceiptModal.amountPaidNow.toLocaleString('es-AR')} (${paymentReceiptModal.paymentMethod})\n✅ *Total Abonado:* $${paymentReceiptModal.newPaidTotal.toLocaleString('es-AR')}\n${paymentReceiptModal.remainingDebt === 0 ? '🎉 *ESTADO DE CUENTA:* ¡CUENTA TOTALMENTE SALDADA ($0 DEUDA)!' : `⚠️ *SALDO PENDIENTE:* $${paymentReceiptModal.remainingDebt.toLocaleString('es-AR')}`}\n---------------------------------\n${paymentReceiptModal.paymentNotes ? `📝 *Nota:* ${paymentReceiptModal.paymentNotes}\n` : ''}¡Muchas gracias!`;
                      
                      navigator.clipboard.writeText(text);
                      import('sonner').then(({ toast }) => toast.success("Resumen copiado al portapapeles"));
                    }}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Copy size={16} />
                    <span>Copiar Resumen</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setPaymentReceiptModal(null)}
                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
                  >
                    Cerrar Ventana
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Modal Full HD Lightbox para Galería de Imágenes */}
        {lightboxModal.isOpen && lightboxModal.images.length > 0 && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200 select-none">
            
            {/* Barra Superior */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">
                    {lightboxModal.title || 'Vista Previa de Imagen'}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold">
                    Imagen {lightboxModal.currentIndex + 1} de {lightboxModal.images.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxModal.images[lightboxModal.currentIndex]}
                  download={`imagen_pedido_${lightboxModal.currentIndex + 1}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Descargar imagen en HD"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Descargar</span>
                </a>

                <button
                  type="button"
                  onClick={() => setLightboxModal({ ...lightboxModal, isOpen: false })}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Visualizador Central de Imagen HD con Flechas */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              {/* Botón Flecha Izquierda */}
              {lightboxModal.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (lightboxModal.currentIndex - 1 + lightboxModal.images.length) % lightboxModal.images.length;
                    setLightboxModal({ ...lightboxModal, currentIndex: nextIdx });
                  }}
                  className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-indigo-600 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Imagen Principal */}
              <img
                src={lightboxModal.images[lightboxModal.currentIndex]}
                alt={`Vista ampliada ${lightboxModal.currentIndex + 1}`}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-all duration-300"
              />

              {/* Botón Flecha Derecha */}
              {lightboxModal.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (lightboxModal.currentIndex + 1) % lightboxModal.images.length;
                    setLightboxModal({ ...lightboxModal, currentIndex: nextIdx });
                  }}
                  className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-indigo-600 text-white border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Tira Inferior de Miniaturas */}
            {lightboxModal.images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pt-3 border-t border-white/10 scrollbar-thin">
                {lightboxModal.images.map((imgSrc: string, iIdx: number) => (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => setLightboxModal({ ...lightboxModal, currentIndex: iIdx })}
                    className={cn(
                      "size-12 sm:size-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      iIdx === lightboxModal.currentIndex
                        ? "border-indigo-500 scale-110 shadow-lg shadow-indigo-500/50"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    )}
                  >
                    <img src={imgSrc} alt={`Miniatura ${iIdx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    );
}

function KanbanView({ orders, statuses, onStatusChange, onEdit, selectedIds, onToggleSelect, userRole }: { 
  orders: any[], 
  statuses: any[], 
  onStatusChange: (id: string, status: string) => void,
  onEdit: (id: string) => void,
  selectedIds: string[],
  onToggleSelect: (id: string) => void,
  userRole: string | null
}) {
  const kanbanStatuses = (statuses && statuses.length > 0)
    ? [...statuses].sort((a, b) => (a.nivel_prioridad || 0) - (b.nivel_prioridad || 0))
    : [
        { nombre_estado: 'FALTA DISEÑAR', nivel_prioridad: 10 },
        { nombre_estado: 'PREPARACIÓN', nivel_prioridad: 20 },
        { nombre_estado: 'EN IMPRESIÓN', nivel_prioridad: 30 },
        { nombre_estado: 'POSPROCESADO', nivel_prioridad: 40 },
        { nombre_estado: 'EMPAQUETADO', nivel_prioridad: 50 },
        { nombre_estado: 'ENTREGADO', nivel_prioridad: 60 }
      ];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const orderId = result.draggableId;
    const newStatus = result.destination.droppableId;
    if (result.source.droppableId !== newStatus) {
      onStatusChange(orderId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full min-h-[600px] overflow-x-auto pb-8">
        {kanbanStatuses.map(status => (
          <div key={status.nombre_estado} className="flex flex-col w-80 shrink-0 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div 
                  className="size-2.5 rounded-full" 
                  style={{ backgroundColor: VIBRANT_STATUS_COLORS[status.nombre_estado] || status.color_pastel_hex }} 
                />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{status.nombre_estado}</h3>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {orders.filter(o => o.estado_pedido === status.nombre_estado).length}
              </span>
            </div>

            <Droppable droppableId={status.nombre_estado}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 p-3 space-y-3 transition-colors overflow-y-auto custom-scrollbar",
                    snapshot.isDraggingOver ? "bg-primary/5" : ""
                  )}
                >
                  {orders
                    .filter(o => o.estado_pedido === status.nombre_estado)
                    .map((order, index) => (
                      <DraggableAny key={order.id_pedido} draggableId={order.id_pedido} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onEdit(order.id_pedido)}
                            className={cn(
                              "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-colors duration-150 cursor-pointer group relative overflow-hidden",
                              snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-2" : "",
                              selectedIds.includes(order.id_pedido) && "ring-2 ring-primary border-primary bg-primary/5"
                            )}
                          >
                            {userRole === 'Admin' && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSelect(order.id_pedido);
                                }}
                                className={cn(
                                  "absolute top-2 left-2 z-10 size-5 rounded-md border-2 flex items-center justify-center transition-colors duration-150 shadow-sm",
                                  selectedIds.includes(order.id_pedido)
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {selectedIds.includes(order.id_pedido) && <CheckSquare size={12} />}
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                {order.id_pedido}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                <Clock size={10} />
                                {order.fecha_entrega ? new Date(order.fecha_entrega).toLocaleDateString() : 'S/F'}
                              </div>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{order.cliente_nombre}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed mb-3">"{order.descripcion}"</p>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{order.tipo_trabajo}</span>
                              {order.saldo > 0 && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
                                  DEUDA
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </DraggableAny>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function StatusBadge({ 
  status, 
  onChange, 
  availableStatuses, 
  isUpdating,
  isOpen = false,
  onToggle = () => {}
}: { 
  status: string;
  onChange?: (newStatus: string) => void;
  availableStatuses?: any[];
  isUpdating?: boolean;
  customerName?: string;
  isOpen?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 180)
      });
    }
  }, [isOpen]);

  const normalizedStatus = status?.trim();
  const dbStatus = availableStatuses?.find(s => s.nombre_estado === normalizedStatus);
  const isInactive = dbStatus && dbStatus.es_activo === false;
  
  const statusColor = VIBRANT_STATUS_COLORS[normalizedStatus] || dbStatus?.color_pastel_hex || dbStatus?.color || '#94a3b8';

  if (!onChange) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/5 w-fit">
        <div className="size-2 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{status}</span>
      </div>
    );
  }

  const allOptions = [
    ...(availableStatuses && availableStatuses.length > 0 ? (
      availableStatuses
        .filter(s => s.es_activo !== false || s.nombre_estado === status)
        .map(s => ({
          label: s.nombre_estado || 'Sin Etiqueta',
          value: s.nombre_estado || '',
          color: VIBRANT_STATUS_COLORS[s.nombre_estado] || s.color_pastel_hex || s.color,
          inactive: s.es_activo === false
        }))
    ) : (
      Object.keys(VIBRANT_STATUS_COLORS).map(s => ({
        label: s,
        value: s,
        color: VIBRANT_STATUS_COLORS[s],
        inactive: false
      }))
    ))
  ];

  return (
    <div className="relative" ref={triggerRef}>
      <button 
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter flex items-center justify-between gap-2 border transition-colors duration-150 shadow-sm group",
          isUpdating ? "opacity-50 cursor-wait bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-primary hover:shadow-md",
          isInactive && "grayscale"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="size-2 rounded-full shrink-0 group- transition-colors duration-150" style={{ backgroundColor: statusColor }} />
          <span className="truncate text-slate-700 dark:text-slate-200">{status || 'Sin Estado'}</span>
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 group-hover:text-primary transition-colors duration-150 duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={(e) => {
            e.stopPropagation();
            onToggle(e);
          }} />
          <div 
            style={{ 
              position: 'absolute',
              top: dropdownPos.top + 6,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 101
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 max-h-[300px] overflow-y-auto no-scrollbar border-t-4 border-t-primary"
          >
            <div className="px-4 py-2 mb-1 border-b border-slate-50 dark:border-white/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar Estado</p>
            </div>
            {allOptions.map((opt, idx) => (
              <button
                key={`${opt.value}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  onToggle(e);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase hover:bg-primary/5 transition-colors flex items-center gap-3 group/opt",
                  opt.value === status ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-400"
                )}
              >
                <div 
                  className="size-2.5 rounded-full shrink-0 group-hover/opt:scale-110 transition-colors duration-150" 
                  style={{ backgroundColor: opt.color || '#cbd5e1' }} 
                />
                <span className="flex-1">{opt.label}</span>
                {opt.value === status && <div className="size-1.5 bg-primary rounded-full " />}
                {opt.inactive && <span className="text-[8px] opacity-40 font-normal italic">(Inactivo)</span>}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
