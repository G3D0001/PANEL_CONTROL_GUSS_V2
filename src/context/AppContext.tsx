import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface BusinessProfile {
  nombre_negocio: string;
  cuit: string;
  direccion: string;
  whatsapp: string;
  email_soporte: string;
  instagram: string;
  logo_url: string;
  color_primario: string;
  tienda_url?: string;
  tienda_titulo?: string;
  favicon_url?: string;
  panel_logo_url?: string;
  ai_prompt?: string;
  ai_enabled?: boolean;
}

interface CustomColors {
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  titleColor: string;
  subtitleColor: string;
  islandBg: string;
  islandBorder: string;
  linkColor: string;
}

interface UISettings {
  scale: number;
  fontSize: number;
  theme: 'light' | 'dark' | 'system';
  persona: 'professional' | 'glass' | 'brutalist';
  texture: 'solid' | 'grainy' | 'mesh';
  borderRadius: 'standard' | 'soft' | 'sharp';
  customColors: CustomColors;
}

interface AppContextType {
  businessProfile: BusinessProfile;
  uiSettings: UISettings;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  refreshBusinessProfile: () => Promise<void>;
  loading: boolean;
}

const defaultProfile: BusinessProfile = {
  nombre_negocio: 'G3D Creative Studio',
  cuit: '',
  direccion: '',
  whatsapp: '',
  email_soporte: '',
  instagram: '',
  logo_url: '',
  color_primario: '#00C2FF',
  ai_prompt: '',
  ai_enabled: true
};

const defaultUI: UISettings = {
  scale: 1,
  fontSize: 16,
  theme: 'light',
  persona: 'professional',
  texture: 'mesh',
  borderRadius: 'standard',
  customColors: {
    btnPrimaryBg: '#0f172a', // Slate 900
    btnPrimaryText: '#ffffff', // White
    btnSecondaryBg: '#64748b', // Slate 500
    btnSecondaryText: '#ffffff', // White
    titleColor: '#0f172a', // Slate 900
    subtitleColor: '#64748b', // Slate 500
    islandBg: '#ffffff', // White
    islandBorder: '#e2e8f0', // Slate 200
    linkColor: '#3b82f6' // Blue 500
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultProfile);
  const [uiSettings, setUISettings] = useState<UISettings>(() => {
    const saved = localStorage.getItem('g3d_ui_settings');
    let parsed = saved ? JSON.parse(saved) : {};
    
    // Soportar inicialización anidada limpia de colores personalizados
    const mergedColors = {
      ...defaultUI.customColors,
      ...(parsed.customColors || {})
    };

    return { 
      ...defaultUI, 
      ...parsed, 
      customColors: mergedColors 
    };
  });
  const [loading, setLoading] = useState(true);

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .single();

      if (!error && data) {
        setBusinessProfile(data.datos || data);
      }
    } catch (err) {
      console.error('Error fetching business profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  // Sync UI Settings to LocalStorage and Apply CSS Variables
  useEffect(() => {
    localStorage.setItem('g3d_ui_settings', JSON.stringify(uiSettings));
    
    const root = document.documentElement;
    root.style.setProperty('--app-scale', uiSettings.scale.toString());
    root.style.setProperty('--base-font-size', `${uiSettings.fontSize}px`);
    root.style.setProperty('--app-radius', 
      uiSettings.borderRadius === 'soft' ? '3rem' : 
      uiSettings.borderRadius === 'sharp' ? '0.5rem' : '2.5rem'
    );

    // Inyectar colores de UI dinámicos
    if (uiSettings.customColors) {
      root.style.setProperty('--btn-primary-bg', uiSettings.customColors.btnPrimaryBg);
      root.style.setProperty('--btn-primary-text', uiSettings.customColors.btnPrimaryText);
      root.style.setProperty('--btn-secondary-bg', uiSettings.customColors.btnSecondaryBg);
      root.style.setProperty('--btn-secondary-text', uiSettings.customColors.btnSecondaryText);
      root.style.setProperty('--title-color', uiSettings.customColors.titleColor);
      root.style.setProperty('--subtitle-color', uiSettings.customColors.subtitleColor);
      root.style.setProperty('--island-bg', uiSettings.customColors.islandBg);
      root.style.setProperty('--island-border', uiSettings.customColors.islandBorder);
      root.style.setProperty('--link-color', uiSettings.customColors.linkColor);
    }
    
    // Theme Logic Improvement
    const updateTheme = () => {
      if (uiSettings.theme === 'dark' || (uiSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    // Listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (uiSettings.theme === 'system') updateTheme();
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    
    root.style.zoom = uiSettings.scale.toString();

    // Apply Persona Classes to Body
    root.classList.remove('persona-professional', 'persona-glass', 'persona-brutalist');
    root.classList.add(`persona-${uiSettings.persona}`);

    root.classList.remove('texture-solid', 'texture-grainy', 'texture-mesh');
    root.classList.add(`texture-${uiSettings.texture}`);

  }, [uiSettings]);

  useEffect(() => {
    if (businessProfile.color_primario) {
      document.documentElement.style.setProperty('--color-primary', businessProfile.color_primario);
    }
  }, [businessProfile.color_primario]);

  const updateBusinessProfile = useCallback((profile: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({ ...prev, ...profile }));
  }, []);

  const updateUISettings = useCallback((settings: Partial<UISettings>) => {
    setUISettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Memoizar el value evita que TODOS los consumidores de useApp() se
  // re-rendericen cuando el provider vuelve a renderizarse sin cambios reales.
  const contextValue = useMemo(() => ({
    businessProfile,
    uiSettings,
    updateBusinessProfile,
    updateUISettings,
    refreshBusinessProfile: fetchBusinessProfile,
    loading,
  }), [businessProfile, uiSettings, updateBusinessProfile, updateUISettings, fetchBusinessProfile, loading]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
