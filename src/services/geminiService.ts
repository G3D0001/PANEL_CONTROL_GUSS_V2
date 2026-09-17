import { GoogleGenAI } from "@google/genai";

import { Category } from '@/src/types';

// El API Key se maneja automáticamente por el entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const DEFAULT_AI_PROMPT = `Eres un experto en Marketing y Copywriting profesional. 
Tu tarea es transformar descripciones de productos simples en textos atractivos, persuasivos y profesionales para una tienda online.

REGLAS ESTRICTAS:
1. **Tono:** Profesional, persuasivo y orientado a la venta (Marketing Genius).
2. **Contenido:** Usa el texto del usuario como base. No inventes características técnicas que no estén presentes, pero mejora la forma en que se presentan.
3. **Emojis:** Usa emojis relevantes para hacer el texto visualmente atractivo y fácil de leer (ej: ✨, 📦, 🚀, 🛠️, 🏠, ⚡).
4. **Variables:** Si el texto contiene variables como {{cliente}}, {{id}}, etc., NO las modifiques ni las elimines.
5. **Formato:** Usa listas con viñetas si hay múltiples características. Asegura una estructura clara: Gancho inicial, beneficios/detalles y cierre.
6. **Corrección:** Corrige ortografía, gramática y capitalización (mayúsculas/minúsculas).
7. **Salida:** Devuelve ÚNICAMENTE el texto final optimizado, sin introducciones ni comentarios.`;

export class GeminiService {
  private static USAGE_KEY = 'g3d_ai_usage';
  private static DAILY_LIMIT = 50; // Límite diario para el plan gratuito

  static getUsage(): { count: number, limit: number, percentage: number } {
    const usage = JSON.parse(localStorage.getItem(this.USAGE_KEY) || '{"count": 0, "lastUpdate": ""}');
    const today = new Date().toDateString();
    
    if (usage.lastUpdate !== today) {
      return { count: 0, limit: this.DAILY_LIMIT, percentage: 0 };
    }
    
    return { 
      count: usage.count, 
      limit: this.DAILY_LIMIT, 
      percentage: Math.min(100, (usage.count / this.DAILY_LIMIT) * 100) 
    };
  }

  static isQuotaReached(): boolean {
    const usage = this.getUsage();
    return usage.count >= usage.limit;
  }

  private static incrementUsage() {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem(this.USAGE_KEY) || '{"count": 0, "lastUpdate": ""}');
    
    if (usage.lastUpdate !== today) {
      usage.count = 1;
      usage.lastUpdate = today;
    } else {
      usage.count += 1;
    }
    
    localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage));
    // Disparar evento para actualizar componentes
    window.dispatchEvent(new Event('ai_usage_updated'));
  }

  static async fixText(text: string, customPrompt?: string): Promise<string> {
    if (!text || text.trim().length < 3) return text;

    const usage = this.getUsage();
    if (usage.count >= usage.limit) {
      throw new Error("QUOTA_EXCEEDED");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: text,
        config: {
          systemInstruction: customPrompt || DEFAULT_AI_PROMPT,
          temperature: 0.7,
        },
      });

      const result = response.text;
      if (!result) throw new Error("No se recibió respuesta de la IA");
      
      this.incrementUsage();
      return result.trim();
    } catch (error: any) {
      console.error("Error en GeminiService:", error);
      
      // Manejo de cuota excedida (Free Tier)
      if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
        throw new Error("QUOTA_EXCEEDED");
      }
      
      throw error;
    }
  }

  static async suggestCategories(
    productData: { nombre: string; descripcion: string }, 
    categories: Category[]
  ): Promise<{ 
    suggestedIds: string[]; 
    suggestedPath?: string;
    explanation: string;
  }> {
    const categoriesList = categories.map(c => {
      const parent = categories.find(p => p.id === c.parent_id);
      return {
        id: c.id,
        name: c.name,
        path: parent ? `${parent.name} > ${c.name}` : c.name
      };
    });

    const categoriesTree = JSON.stringify(categoriesList);
    const productInfo = `Nombre: ${productData.nombre}\nDescripción: ${productData.descripcion}`;

    const prompt = `Actúa como un experto categorizador de productos de e-commerce tipo Mercado Libre.
Tu objetivo es analizar un producto y sugerir las categorías más adecuadas de una lista existente, o sugerir una nueva rama si ninguna encaja perfectamente.

LISTA DE CATEGORÍAS ACTUALES:
${categoriesTree}

PRODUCTO A ANALIZAR:
${productInfo}

INSTRUCCIONES:
1. Analiza el producto y busca las categorías que mejor encajen.
2. Un producto puede pertenecer a VARIAS categorías si son ramas distintas (ej: "Letra Corpórea" puede ir en "Impresión 3D" y "Cartelería").
3. Si crees que falta una categoría específica, sugiere una "Ruta Recomendada" (ej: Publicidad > Cartelería > Letras Corpóreas).
4. Devuelve la respuesta en formato JSON puro, sin markdown:
{
  "suggestedIds": ["uuid1", "uuid2"],
  "suggestedPath": "Nueva > Rama > Categoria",
  "explanation": "Breve explicación de por qué estas categorías."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const result = response.text;
    if (!result) throw new Error("No se recibió respuesta de la IA");
    
    this.incrementUsage();
    try {
      // Limpiar posible markdown
      const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Error parsing Gemini JSON:", result);
      return { suggestedIds: [], explanation: "Error analizando sugerencias." };
    }
  }

  /**
   * Limpieza básica de texto por código (sin IA)
   */
  static cleanText(text: string, type: 'title' | 'sentence' | 'uppercase' | 'none' = 'title'): string {
    if (!text) return '';
    
    let cleaned = text.trim().replace(/\s+/g, ' ');

    if (type === 'title') {
      // Capitalizar cada palabra (ej: juan perez -> Juan Perez)
      return cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    if (type === 'sentence') {
      // Capitalizar solo la primera letra
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }

    if (type === 'uppercase') {
      return cleaned.toUpperCase();
    }

    return cleaned;
  }
}
