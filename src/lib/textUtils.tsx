import React from 'react';
import { Globe, Phone } from 'lucide-react';

export const renderSmartText = (text: string) => {
  if (!text) return null;
  
  // Regex para detectar LINK:url NOMBRE:Texto
  const linkRegex = /LINK:(https?:\/\/[^\s]+)\s+NOMBRE:([^\n\r]+)/g;
  // Regex para detectar ACTION:whatsapp:numero NOMBRE:Texto
  const waRegex = /ACTION:whatsapp:([0-9]+)\s+NOMBRE:([^\n\r]+)/g;
  
  const parts: React.ReactNode[] = [];
  const allMatches: { index: number, length: number, component: React.ReactNode }[] = [];
  
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      component: (
        <a 
          key={`link-${match.index}`}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 my-1 mx-1"
        >
          <Globe size={12} />
          {match[2]}
        </a>
      )
    });
  }
  
  waRegex.lastIndex = 0;
  while ((match = waRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      component: (
        <a 
          key={`wa-${match.index}`}
          href={`https://wa.me/${match[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 my-1 mx-1"
        >
          <Phone size={12} />
          {match[2]}
        </a>
      )
    });
  }
  
  allMatches.sort((a, b) => a.index - b.index);
  
  let lastIndex = 0;
  allMatches.forEach((m) => {
    if (m.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, m.index)}</span>);
    }
    parts.push(m.component);
    lastIndex = m.index + m.length;
  });
  
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? <div className="whitespace-pre-wrap leading-relaxed">{parts}</div> : <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
};
