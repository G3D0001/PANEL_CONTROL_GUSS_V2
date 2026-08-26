import fs from 'fs';
let c = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

c = c.replace(
  /<div className="space-y-2">\s*<label className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo URL \(Para Recibos y PDFs\)<\/label>\s*<input\s*type="text"\s*value=\{systemConfig\.logo_url \|\| ''\}\s*onChange=\{\(e\) => setSystemConfig\(prev => \(\{ \.\.\.prev, logo_url: e\.target\.value \}\)\)\}\s*className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary\/20 text-xs font-bold"\s*placeholder="https:\/\/\.\.\."\s*\/>\s*<\/div>/,
  `
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo URL (Para Recibos y PDFs)</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.logo_url ? (
          <img src={systemConfig.logo_url} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={systemLogoInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'logo_url')}
          className="hidden"
        />
        <button 
          onClick={() => systemLogoInputRef.current?.click()}
          disabled={isUploadingSystemConfig.logo_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.logo_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.logo_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
  </div>`
);

c = c.replace(
  /<div className="space-y-2">\s*<label className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 ml-1">Icono de la Web \(Favicon URL\)<\/label>\s*<input\s*type="text"\s*value=\{systemConfig\.favicon_url \|\| ''\}\s*onChange=\{\(e\) => setSystemConfig\(prev => \(\{ \.\.\.prev, favicon_url: e\.target\.value \}\)\)\}\s*className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary\/20 text-xs font-bold"\s*placeholder="https:\/\/\.\.\. \(PNG\/ICO recomendado\)"\s*\/>\s*<p className="text-\[10px\] text-slate-500 ml-2 mt-1">Este ícono se muestra en la pestaña del navegador y al guardar en favoritos\.<\/p>\s*<\/div>/,
  `
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Icono de la Web (Favicon URL)</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.favicon_url ? (
          <img src={systemConfig.favicon_url} className="w-full h-full object-cover" alt="Favicon" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={faviconInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'favicon_url')}
          className="hidden"
        />
        <button 
          onClick={() => faviconInputRef.current?.click()}
          disabled={isUploadingSystemConfig.favicon_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.favicon_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.favicon_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
    <p className="text-[10px] text-slate-500 ml-2 mt-1">Este ícono se muestra en la pestaña del navegador y al guardar en favoritos.</p>
  </div>`
);

c = c.replace(
  /<div className="space-y-2 pt-2">\s*<label className="text-\[10px\] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo del Panel de Control<\/label>\s*<input\s*type="text"\s*value=\{systemConfig\.panel_logo_url \|\| ''\}\s*onChange=\{\(e\) => setSystemConfig\(prev => \(\{ \.\.\.prev, panel_logo_url: e\.target\.value \}\)\)\}\s*className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary\/20 text-xs font-bold"\s*placeholder="https:\/\/\.\.\."\s*\/>\s*<p className="text-\[10px\] text-slate-500 ml-2 mt-1">Reemplaza el logo general dentro de las vistas de administración\.<\/p>\s*<\/div>/,
  `
  <div className="space-y-2 pt-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Logo del Panel de Control</label>
    <div className="flex gap-4 items-center">
      <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
        {systemConfig.panel_logo_url ? (
          <img src={systemConfig.panel_logo_url} className="w-full h-full object-cover" alt="Panel Logo" referrerPolicy="no-referrer" />
        ) : (
          <ImageIcon className="text-slate-300" size={24} />
        )}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*"
          ref={panelLogoInputRef}
          onChange={(e) => handleSystemFileUpload(e, 'panel_logo_url')}
          className="hidden"
        />
        <button 
          onClick={() => panelLogoInputRef.current?.click()}
          disabled={isUploadingSystemConfig.panel_logo_url}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isUploadingSystemConfig.panel_logo_url ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {isUploadingSystemConfig.panel_logo_url ? 'Subiendo...' : 'Subir desde dispositivo'}
        </button>
      </div>
    </div>
    <p className="text-[10px] text-slate-500 ml-2 mt-1">Reemplaza el logo general dentro de las vistas de administración.</p>
  </div>`
);

fs.writeFileSync('src/components/SettingsView.tsx', c);
