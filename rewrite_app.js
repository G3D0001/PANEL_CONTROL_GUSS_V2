import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Reduce paddings, change border radius
content = content.replace(/rounded-3xl/g, 'rounded-2xl shadow-sm');
content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl shadow-sm');

// Animations
content = content.replace(/transition-all/g, 'transition-colors duration-150');
content = content.replace(/hover:scale-\d+/g, '');
content = content.replace(/active:scale-\d+/g, '');

fs.writeFileSync('src/App.tsx', content);

// Let's do Sidebar.tsx if we didn't
let sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
sidebarContent = sidebarContent.replace(/rounded-3xl/g, 'rounded-2xl shadow-sm');
sidebarContent = sidebarContent.replace(/transition-all/g, 'transition-colors duration-150');
sidebarContent = sidebarContent.replace(/hover:translate-x-1/g, '');
fs.writeFileSync('src/components/Sidebar.tsx', sidebarContent);

// App.css or index.css
let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(/rounded-\[.*?\]/g, 'rounded-xl'); // Replace weird roundings? Leave as is to prevent breaking
// Maybe leave index.css alone.

