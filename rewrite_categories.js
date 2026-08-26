import fs from 'fs';

let content = fs.readFileSync('src/components/CategoriesView.tsx', 'utf-8');

// Add insideWrapper to props
content = content.replace(/export function CategoriesView\(\) \{/, 'export function CategoriesView({ insideWrapper }: { insideWrapper?: boolean }) {');

// Remove header if insideWrapper
const headerRegex = /\{\/\* Header \*\/\}\n\s*<header[\s\S]*?<\/header>/m;
const headerMatch = content.match(headerRegex);

if (headerMatch) {
  content = content.replace(headerRegex, '{!insideWrapper && (' + headerMatch[0] + ')}');
}

// Make the rows more compact
content = content.replace(/p-3 rounded-2xl/g, 'p-2 rounded-xl');
content = content.replace(/margin-left: level > 0 \? `\$\{level \* 24\}px`/g, 'marginLeft: level > 0 ? `${level * 16}px`');
content = content.replace(/gap-4/g, 'gap-2');
content = content.replace(/w-10 h-10/g, 'w-8 h-8');
content = content.replace(/text-sm font-bold/g, 'text-xs font-semibold');

// Remove massive bg from the whole component?
// return ( <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
content = content.replace(/flex flex-col h-full bg-slate-50 dark:bg-slate-950/, 'flex flex-col h-full'); 

fs.writeFileSync('src/components/CategoriesView.tsx', content);

let wlContent = fs.readFileSync('src/components/WorkflowsView.tsx', 'utf-8');
wlContent = wlContent.replace(/export function WorkflowsView\(\) \{/, 'export function WorkflowsView({ insideWrapper }: { insideWrapper?: boolean }) {');

// Remove beta tag from Workflows (flujos kiero q deje de mostrar un "(beta)")
wlContent = wlContent.replace(/Flujos de Trabajo <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase tracking-wider">Beta<\/span>/g, 'Flujos de Trabajo');

const wlHeaderRegex = /\{\/\* Header \*\/\}\n\s*<header[\s\S]*?<\/header>/m;
const wlHeaderMatch = wlContent.match(wlHeaderRegex);
if (wlHeaderMatch) {
  wlContent = wlContent.replace(wlHeaderRegex, '{!insideWrapper && (' + wlHeaderMatch[0] + ')}');
}
wlContent = wlContent.replace(/flex flex-col h-full bg-slate-50 dark:bg-slate-950/, 'flex flex-col h-full'); 
fs.writeFileSync('src/components/WorkflowsView.tsx', wlContent);
