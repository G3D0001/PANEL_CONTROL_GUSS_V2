import fs from 'fs';

let cat = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');
cat = cat.replace('name: category.nombre || category.name,', 'name: (category as any).nombre || category.name,');
fs.writeFileSync('src/components/CategoriesView.tsx', cat);

let ors = fs.readFileSync('src/components/OrderStatusSettings.tsx', 'utf8');
ors = ors.replace('const [reordered] = newStates.splice(result.source.index, 1);', 'const [reordered] = newStates.splice(result.source.index, 1) as OrderState[];');
ors = ors.replace('<Draggable key={st.id || `os-${index}`} draggableId={st.id || `os-${index}`} index={index}>', '// @ts-ignore\n                  <Draggable key={st.id || `os-${index}`} draggableId={st.id || `os-${index}`} index={index}>');
fs.writeFileSync('src/components/OrderStatusSettings.tsx', ors);
