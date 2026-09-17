import fs from 'fs';
let c1 = fs.readFileSync('src/components/OrderStatusSettings.tsx', 'utf8');
c1 = c1.replace(/\\`new-\\\$\\{Date\.now\(\)\\}\\`/g, "`new-${Date.now()}`");
c1 = c1.replace(/\\`os-\\\$\\{index\\}\\`/g, "`os-${index}`");
c1 = c1.replace(/\\`/g, "`"); // Replace all remaining
c1 = c1.replace(/\\\$/g, "$");
fs.writeFileSync('src/components/OrderStatusSettings.tsx', c1);

let c2 = fs.readFileSync('src/components/StoreModerationView.tsx', 'utf8');
c2 = c2.replace(/\\`/g, "`");
c2 = c2.replace(/\\\$/g, "$");
fs.writeFileSync('src/components/StoreModerationView.tsx', c2);

