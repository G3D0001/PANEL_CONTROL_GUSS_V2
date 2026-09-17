import fs from 'fs';
let c = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

c = c.replace(
  /const \[isUploadingAvatar, setIsUploadingAvatar\] = useState\(false\);/,
  `const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const panelLogoInputRef = useRef<HTMLInputElement>(null);
  const systemLogoInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploadingSystemConfig, setIsUploadingSystemConfig] = useState<Record<string, boolean>>({
    favicon_url: false,
    panel_logo_url: false,
    logo_url: false
  });

  const handleSystemFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    setIsUploadingSystemConfig(prev => ({ ...prev, [field]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = \`\${Math.random().toString(36).substring(2)}_\${Date.now()}.\${fileExt}\`;
      const filePath = \`system/\${fileName}\`; // using 'system' folder

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public_assets').getPublicUrl(filePath);
      
      setSystemConfig(prev => ({ ...prev, [field]: data.publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(\`Error al subir la imagen: \${error.message}\`);
    } finally {
      setIsUploadingSystemConfig(prev => ({ ...prev, [field]: false }));
      if (field === 'favicon_url' && faviconInputRef.current) faviconInputRef.current.value = '';
      if (field === 'panel_logo_url' && panelLogoInputRef.current) panelLogoInputRef.current.value = '';
      if (field === 'logo_url' && systemLogoInputRef.current) systemLogoInputRef.current.value = '';
    }
  };`
);

fs.writeFileSync('src/components/SettingsView.tsx', c);
