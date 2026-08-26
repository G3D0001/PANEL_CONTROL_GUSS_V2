import fs from 'fs';
const f = 'src/components/WorkflowsView.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace("id: \\`new-\\\${Date.now()}\\`", "id: `new-${Date.now()}`");
c = c.replace("draggableId={state.id || \\`st-\\\${index}\\`}", "draggableId={state.id || `st-${index}`}");
c = c.replace("key={state.id || \\`st-\\\${index}\\`}", "key={state.id || `st-${index}`}");

fs.writeFileSync(f, c);
