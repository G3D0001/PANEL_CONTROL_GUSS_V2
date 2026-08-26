import fs from 'fs';
let c = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');

c = c.replace(/const canManage = hasPermission\(PERMISSIONS\.STOCK\.VISTA_GENERAL\.id\);/, 'const canManage = true; // Temporary bypass for simplified UI');

fs.writeFileSync('src/components/CategoriesView.tsx', c);
