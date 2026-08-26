import fs from 'fs';

const files = [
  'src/components/LogisticsDashboard.tsx',
  'src/components/FleterosManager.tsx',
  'src/components/LogisticsSettings.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Extract component name correctly
  const funcMatch = content.match(/export function ([A-Za-z0-9_]+)\(\) \{/);
  if (funcMatch) {
     const compName = funcMatch[1];
     content = content.replace(funcMatch[0], `export function \${compName}({ insideWrapper }: { insideWrapper?: boolean }) {`);
     
     // Optionally conditionally hide header
     const hRegex = /\{\/\* Header \*\/\}\n\s*<header[\s\S]*?<\/header>/m;
     const hMatch = content.match(hRegex);
     if (hMatch) {
       content = content.replace(hRegex, '{!insideWrapper && (' + hMatch[0] + ')}');
     }
     
     fs.writeFileSync(file, content);
  }
});
