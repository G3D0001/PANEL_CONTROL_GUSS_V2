import fs from 'fs';

let content = fs.readFileSync('src/components/MisProductosView.tsx', 'utf-8');

// Container modal:
content = content.replace(/rounded-3xl.*?shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\]/g, 'rounded-2xl w-full max-w-3xl shadow-xl');

// Remove slow transitions if any
content = content.replace(/transition-all/g, 'transition-colors duration-150');
content = content.replace(/transition-shadow/g, 'transition-colors duration-150');
content = content.replace(/animate-pulse/g, '');

// Inputs padding & size reduction
content = content.replace(/rounded-xl px-4 py-3 text-sm/g, 'rounded-xl px-3 py-2 text-xs shadow-sm');
content = content.replace(/text-sm font-semibold/g, 'text-xs font-semibold');
content = content.replace(/text-base font-bold/g, 'text-sm font-semibold');

// Modal header padding
content = content.replace(/px-6 py-5/g, 'px-5 py-4');
content = content.replace(/p-6/g, 'p-5'); // Reduce padding inside the modal body

// "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
content = content.replace(/bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold/g, 'bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm');

// Modal title "text-lg font-semibold"
content = content.replace(/text-lg font-semibold/g, 'text-base font-bold');

// Small buttons in cards
content = content.replace(/font-black/g, 'font-bold');

// Tables Headers
content = content.replace(/text-\[10px\] font-black text-slate-500 uppercase tracking-wider/g, 'text-[10px] font-semibold text-slate-500 uppercase tracking-wider');

// Coloured banners 
content = content.replace(/rounded-lg border/g, 'rounded-xl shadow-sm border');

fs.writeFileSync('src/components/MisProductosView.tsx', content);
