import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, Navigation, Phone, User, CheckCircle, Loader2, AlertCircle, Sparkles, Building2 } from 'lucide-react';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

export function WelcomeForm() {
  const { user, userRole, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState(user?.user_metadata?.full_name || '');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [telefonoRespaldo, setTelefonoRespaldo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  // San Fernando del Valle de Catamarca
  const defaultCenter: [number, number] = [-28.4695, -65.7795];

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        setDireccion(data.display_name);
      }
    } catch (err) {
      console.error('Error in reverse geocoding:', err);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    reverseGeocode(lat, lng);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  const useCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setError('La geolocalización no es compatible con tu navegador.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationFound(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener tu ubicación actual.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        handleLocationFound(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      const isLocalUser = localStorage.getItem('g3d_local_session') !== null;
      const targetTable = 'perfiles_locales';
      
      const { data } = await supabase
        .from(targetTable)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        if (data.nombre) setNombre(data.nombre);
        if (data.telefono_principal) setTelefonoPrincipal(data.telefono_principal);
        if (data.telefono_respaldo) setTelefonoRespaldo(data.telefono_respaldo || '');
        if (data.direccion_escrita) setDireccion(data.direccion_escrita);
        if (data.latitud && data.longitud) {
          setLocation({ lat: data.latitud, lng: data.longitud });
        }
      }
    };
    
    loadProfileData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('Por favor, selecciona tu punto exacto de entrega/residencia en el mapa.');
      return;
    }

    if (!telefonoPrincipal) {
      setError('Necesitamos un teléfono de contacto principal.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isLocalUser = localStorage.getItem('g3d_local_session') !== null;
      const targetTable = 'perfiles_locales';

      const updateData = {
        id: user?.id,
        nombre,
        telefono_principal: telefonoPrincipal,
        telefono_respaldo: telefonoRespaldo || null,
        direccion_escrita: direccion,
        latitud: location.lat,
        longitud: location.lng,
        fecha_inicio: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from(targetTable)
        .upsert(updateData);

      if (saveError) throw saveError;

      await refreshProfile();
      
      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Error al completar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-12 gap-5">
      {/* Brand Header */}
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
          <span className="material-symbols-outlined text-2xl">3d_rotation</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none uppercase tracking-tight">G3D System</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración de Membresía</p>
        </div>
      </div>

      <div className="max-w-[1200px] w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
        {/* Left Side: Onboarding Content */}
        <div className="flex-1 p-5 md:p-12 space-y-10 lg:max-w-md border-r border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={12} /> Paso Final
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter leading-[0.9]">
              TE DAMOS <br/>LA BIENVENIDA
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Estás en la lista blanca de <span className="font-bold text-slate-900 dark:text-white">G3D</span>. Completa estos datos para formalizar tu perfil en la plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Información Personal */}
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none dark:text-white transition-colors duration-150 shadow-sm"
                    placeholder="Nombre Completo"
                  />
                </div>
              </div>

              {/* Teléfonos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="tel"
                    required
                    value={telefonoPrincipal}
                    onChange={(e) => setTelefonoPrincipal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-3 py-4 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none dark:text-white transition-colors duration-150 shadow-sm"
                    placeholder="Celular"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="tel"
                    value={telefonoRespaldo}
                    onChange={(e) => setTelefonoRespaldo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-3 py-4 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none dark:text-white transition-colors duration-150 shadow-sm"
                    placeholder="Respaldo (Opc)"
                  />
                </div>
              </div>

              {/* Dirección Resumen */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 min-h-[60px] flex items-start gap-3">
                <MapPin className="text-primary shrink-0" size={18} />
                <p className="text-[11px] font-bold text-slate-500 leading-normal">
                  {direccion || "Haz clic en el mapa para marcar tu dirección exacta de residencia o negocio."}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-bold uppercase tracking-tight">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white shadow-sm border border-slate-700 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-90  transition-colors duration-150 shadow-2xl shadow-primary/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="" size={20} />
              ) : (
                <>Finalizar y Entrar <CheckCircle size={20} /></>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Map Interactivo */}
        <div className="flex-1 relative min-h-[500px]">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={(map) => { if (map) mapRef.current = map; }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {location && (
              <Marker 
                position={[location.lat, location.lng]} 
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handleLocationFound(position.lat, position.lng);
                  },
                }}
              />
            )}
            <MapEvents />
          </MapContainer>

          {/* Map Overlay HUD */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-[1000]">
            <div className="flex justify-end pointer-events-auto">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 flex items-center gap-3 font-bold text-[11px] uppercase tracking-widest "
              >
                {isLocating ? (
                  <Loader2 className="" size={16} />
                ) : (
                  <Navigation size={16} />
                )}
                Obtener mi GPS
              </button>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto">
              <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <MapPin className="" size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Localizador Manual</p>
                    <p className="text-xs font-bold text-white/80 max-w-sm">
                      Mueve el marcador o toca la pantalla para indicarnos donde entregarte los pedidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
        Acceso restigido para testers v3.0 • Nodo Sur
      </p>
    </div>
  );
}
