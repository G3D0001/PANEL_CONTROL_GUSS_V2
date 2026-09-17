import React, { useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import heic2any from 'heic2any';

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (!files.length) return;
    
    let newImages = [...images];
    let skippedWeight = 0;
    let skippedFormat = 0;

    for (let file of files) {
      if (newImages.length >= 5) {
        toast.error('Límite de 5 imágenes alcanzado. Se omitieron algunas.');
        break;
      }
      
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') || 
                     file.type === 'image/heic' || 
                     file.type === 'image/heif';

      // Validations
      if (file.size > 5 * 1024 * 1024 && !isHeic) { // 5MB Limit for standard files
        skippedWeight++;
        continue;
      }
      if (!isHeic && !file.type.match(/image\/(jpeg|png|webp)/)) {
        skippedFormat++;
        continue;
      }

      if (isHeic) {
        try {
          toast.info(`Convirtiendo imagen HEIC de celular: ${file.name}...`);
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.7
          });
          const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([singleBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg'
          });
        } catch (heicErr) {
          console.error("Error al convertir HEIC:", heicErr);
          toast.error(`No se pudo procesar HEIC para: ${file.name}`);
          continue;
        }
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
      newImages = [...newImages, base64];
    }

    if (skippedWeight > 0) toast.error(`${skippedWeight} archivo(s) superaron el límite de 5MB.`);
    if (skippedFormat > 0) toast.error(`${skippedFormat} archivo(s) con formato no soportado.`);

    onChange(newImages);
    
    // reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onChange(newImages);
    } else if (direction === 'right' && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onChange(newImages);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        {images.map((img, i) => (
          <div key={i} className="relative group w-[72px] h-[72px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
            <img src={img} alt={`Imagen ${i+1}`} className="w-full h-full object-cover" />
            
            {i === 0 && (
              <div className="absolute top-0 left-0 bg-primary/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-br-lg shadow-sm z-10">
                PORTADA
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1 z-20">
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeImage(i); }} 
                  className="bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-md transition-colors"
                  title="Eliminar"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
              
              <div className="flex justify-between">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveImage(i, 'left'); }}
                  disabled={i === 0}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-0.5 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={12} strokeWidth={3} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveImage(i, 'right'); }}
                  disabled={i === images.length - 1}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-0.5 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {images.length < 5 && (
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-[72px] h-[72px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors duration-150 outline-none"
          >
            <Plus size={16} />
            <span className="text-[8px] font-bold mt-1">AÑADIR</span>
          </button>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/jpeg, image/png, image/webp, image/heic, image/heif, .heic, .heif" 
          multiple
          className="hidden" 
        />
        
        {images.length < 5 && (
            <div className="text-[9px] text-slate-400 font-medium ml-2">
                <p>Formatos aceptados: JPG, PNG, WEBP, HEIC.</p>
                <p>Peso máximo: 5MB. Hasta 5 fotos.</p>
            </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-2.5 rounded-lg text-[9px] font-medium leading-relaxed">
        ⚠️ AVISO DE CALIDAD: Preferentemente usa imágenes originales de tus productos. Si usas imágenes creadas con Inteligencia Artificial (IA), asegúrate de que el producto no se vea deformado y coincida exactamente con lo que vas a entregar para evitar reclamos o fraudes.
      </div>
    </div>
  );
}
