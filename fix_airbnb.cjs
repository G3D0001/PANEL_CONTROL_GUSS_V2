const fs = require('fs');
let content = fs.readFileSync('src/components/MisProductosView.tsx', 'utf-8');

// Labels
content = content.replace(/className="block text-\[9px\] font-bold text-slate-500 uppercase mb-1"/g, 'className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"');

// Inputs and selects with text-[10px]
content = content.replace(/className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md p-1\.5 text-\[10px\] font-bold focus:ring-2 focus:ring-(indigo|green|orange|sky)-500"/g, 
  'className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-shadow"');

content = content.replace(/className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-(indigo|orange)-500"/g,
  'className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-shadow"');

content = content.replace(/className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-md p-1\.5 text-\[10px\] font-bold focus:ring-2 focus:ring-sky-500"/g,
  'className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-shadow"');

fs.writeFileSync('src/components/MisProductosView.tsx', content);
console.log('Script execution complete.');
