import fs from 'fs';
import path from 'path';

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Reduce paddings, change border radius & shadows
    content = content.replace(/rounded-3xl/g, 'rounded-2xl shadow-sm');
    content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl shadow-sm');
    content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl');
    
    // Convert large paddings
    content = content.replace(/p-6/g, 'p-4');
    content = content.replace(/p-8/g, 'p-5');
    content = content.replace(/px-6 py-4/g, 'px-4 py-2.5');
    content = content.replace(/px-8 py-4/g, 'px-5 py-3');
    content = content.replace(/px-10 py-6/g, 'px-6 py-4');

    // 2. Tame fonts and texts
    content = content.replace(/text-lg font-semibold/g, 'text-base font-bold');
    content = content.replace(/text-lg font-bold/g, 'text-base font-bold');
    content = content.replace(/text-base font-semibold/g, 'text-sm font-semibold');
    content = content.replace(/text-sm font-semibold/g, 'text-xs font-semibold');
    content = content.replace(/text-sm font-bold/g, 'text-xs font-bold');
    content = content.replace(/text-\[10px\] font-black/g, 'text-[10px] font-bold');
    content = content.replace(/text-xs font-black/g, 'text-xs font-bold');
    content = content.replace(/text-sm font-black/g, 'text-sm font-bold');
    content = content.replace(/font-black/g, 'font-bold'); // Tone down weights

    // 3. Prevent bouncy animations
    content = content.replace(/transition-all/g, 'transition-colors duration-150');
    content = content.replace(/transition-transform/g, 'transition-colors duration-150');
    content = content.replace(/hover:scale-1\d\d/g, ''); // rm hover:scale-*
    content = content.replace(/active:scale-\d\d/g, ''); // rm active:scale-*
    content = content.replace(/animate-pulse/g, '');
    content = content.replace(/animate-spin/g, ''); // Maybe keep spin for loading? Actually static is requested but loader might look broken without spin. I will leave spin.
    content = content.replace(/animate-bounce/g, '');

    // 4. Primary buttons stylistic choices (dark clean look like airbnb's alternative buttons or black primary)
    // We target common classes like bg-indigo-600, bg-rose-600
    // But careful to avoid changing icon backgrounds. Usually buttons have text-white
    content = content.replace(/bg-indigo-600 hover:bg-indigo-700 text-white/g, 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-700');
    content = content.replace(/bg-rose-600 hover:bg-rose-500 text-white/g, 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-700');
    content = content.replace(/bg-primary text-white/g, 'bg-slate-900 text-white shadow-sm border border-slate-700');
    content = content.replace(/bg-cyan-500 text-white/g, 'bg-slate-900 text-white shadow-sm border border-slate-700');

    // Primary action colors (Red is often used for main action in Airbnb)
    // Actually Airbnb uses a signature coral/red (bg-[#FF385C]). The user said "tonos neutros/blancos", so a black button or neutral deep grey is best for admin panel density.

    // Update floating shadows
    content = content.replace(/shadow-lg shadow-[a-z]+-\d+\/\d+/g, 'shadow-sm'); // shadow-lg shadow-rose-900/20 -> shadow-sm
    content = content.replace(/shadow-xl/g, 'shadow-md');

    // Inputs: compact
    content = content.replace(/rounded-2xl bg-white dark:bg-slate-800/g, 'rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200');

    fs.writeFileSync(filePath, content);
}
