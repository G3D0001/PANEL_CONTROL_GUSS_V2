import fs from 'fs';
const f = 'src/components/WorkflowsView.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/\\`new-\\\$\\{Date\.now\(\)\}\\`/g, '`new-${Date.now()}`');
c = c.replace(/\\`st-\\\$\\{index\}\\`/g, '`st-${index}`');
fs.writeFileSync(f, c);
