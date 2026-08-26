import React, { useState } from 'react';
import { Upload, X, Trash2, Image as ImageIcon, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import heic2any from 'heic2any';

interface MultiImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function MultiImageManager({ images = [], onChange, maxImages = 10 }: MultiImageManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality jpeg
            resolve(compressedBase64);
          } else {
            reject(new Error('No se pudo obtener el contexto 2D del canvas'));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Error al cargar la imagen en memoria'));
        };
        img.src = blobUrl;
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Puedes subir un máximo de ${maxImages} imágenes.`);
      return;
    }

    toast.info("Procesando y comprimiendo imágenes...");
    try {
      const processedFiles: File[] = [];
      for (const file of files) {
        const fileName = file.name || 'foto.jpg';
        const fileType = file.type || '';
        
        const isHeic = fileName.toLowerCase().endsWith('.heic') || 
                       fileName.toLowerCase().endsWith('.heif') || 
                       fileType === 'image/heic' || 
                       fileType === 'image/heif';

        if (isHeic) {
          try {
            let convertHeicFn = heic2any;
            if (typeof convertHeicFn !== 'function' && (convertHeicFn as any)?.default) {
              convertHeicFn = (convertHeicFn as any).default;
            }

            if (typeof convertHeicFn === 'function') {
              const convertedBlob = await convertHeicFn({
                blob: file,
                toType: "image/jpeg",
                quality: 0.7
              });
              const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              const convertedFile = new File([singleBlob], fileName.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg'
              });
              processedFiles.push(convertedFile);
            } else {
              throw new Error("Librería de conversión HEIC no está lista");
            }
          } catch (heicErr) {
            console.error("Error al convertir HEIC:", heicErr);
            toast.error(`No se pudo procesar formato iPhone (HEIC) para: ${fileName}. Se intentará de forma normal.`);
            processedFiles.push(file); // fallback
          }
        } else {
          processedFiles.push(file);
        }
      }

      const promises = processedFiles.map(file => processFile(file));
      const compressedImages = await Promise.all(promises);
      const newImages = [...images, ...compressedImages];
      onChange(newImages);
      setActiveIndex(images.length); // Point to first newly uploaded image
      toast.success("Imágenes cargadas correctamente.");
    } catch (err) {
      console.error("Error al procesar imágenes:", err);
      toast.error("Error al procesar una o más imágenes.");
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    onChange(newImages);
    if (activeIndex >= newImages.length && newImages.length > 0) {
      setActiveIndex(newImages.length - 1);
    }
  };

  const setAsPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const newImages = [...images];
    const [target] = newImages.splice(indexToPrimary, 1);
    newImages.unshift(target);
    onChange(newImages);
    setActiveIndex(0);
    toast.success("Imagen establecida como principal.");
  };

  return (
    <div className="space-y-2">
      {images.length > 0 ? (
        <div className="flex justify-center">
          {/* Única miniatura con el contador de fotos */}
          <div 
            onClick={() => setIsOpen(true)}
            className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md cursor-pointer group hover:scale-105 transition duration-250 bg-slate-50 dark:bg-slate-950"
          >
            <img 
              src={images[0]} 
              alt="Miniatura principal" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            {/* Numerito/Badge indicador en la esquina */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/75 text-white text-[11px] font-black uppercase tracking-wider rounded-lg backdrop-blur-sm shadow flex items-center gap-1">
              <ImageIcon size={11} />
              {images.length}
            </div>
            
            {/* Overlay al pasar el mouse */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
              <span className="text-white text-[10px] font-black uppercase tracking-wider">Ver Galería</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
            <div className="flex flex-col items-center justify-center pt-4 pb-4">
              <Upload className="w-6 h-6 text-slate-400 mb-2 animate-bounce" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-center px-4">
                Subir Fotos (Múltiple)
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Soporta JPG, PNG, WEBP, HEIC</p>
            </div>
            <input
              type="file"
              accept="image/*, image/heic, image/heif, .heic, .heif"
              multiple
              onChange={handleFilesUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* MODAL DE GALERÍA DE IMÁGENES INTERACTIVA */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col max-h-[90vh]">
            {/* Header de la Galería */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Galería de Imágenes
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Administrá y seleccioná el orden de tus fotos</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              {/* Vista previa de tamaño grande */}
              {images.length > 0 ? (
                <div className="relative flex-1 min-h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800/80">
                  <img
                    src={images[activeIndex]}
                    alt={`Preview ${activeIndex + 1}`}
                    className="max-h-[350px] max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Controles de la imagen activa */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center gap-2">
                    {activeIndex !== 0 ? (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(activeIndex)}
                        className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 dark:bg-white/90 dark:hover:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md backdrop-blur flex items-center gap-1 transition"
                      >
                        <Check size={12} className="text-emerald-500" />
                        Establecer Principal
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1">
                        <Check size={12} />
                        Foto Principal
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(activeIndex)}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md flex items-center gap-1 transition text-[10px] font-bold"
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                  <ImageIcon size={48} className="mb-2 stroke-1" />
                  <p className="text-xs font-bold uppercase tracking-wider">No hay fotos cargadas</p>
                </div>
              )}

              {/* Lista horizontal de miniaturas */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Fotos cargadas ({images.length} de {maxImages})
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition border-2 ${
                        idx === activeIndex 
                          ? 'border-indigo-600 scale-105 shadow-md' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {idx === 0 && (
                        <div className="absolute top-0.5 left-0.5 bg-emerald-600 text-[8px] text-white px-1 font-black rounded-md uppercase">
                          Pri
                        </div>
                      )}
                      {/* Botón rápido para eliminar en la miniatura */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute bottom-1 right-1 bg-black/60 hover:bg-red-600 text-white p-0.5 rounded-md transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Botón para agregar más fotos en la miniatura de la lista */}
                  {images.length < maxImages && (
                    <label className="w-16 h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 rounded-xl cursor-pointer flex flex-col items-center justify-center flex-shrink-0 transition bg-slate-50 dark:bg-slate-950/40">
                      <Plus size={16} className="text-slate-400" />
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Agregar</span>
                      <input
                        type="file"
                        accept="image/*, image/heic, image/heif, .heic, .heif"
                        multiple
                        onChange={handleFilesUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
