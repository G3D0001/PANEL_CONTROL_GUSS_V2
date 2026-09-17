import fs from 'fs';

const fixFile = (path, name) => {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(/export function \$\{compName\}/, `export function ${name}`);
  fs.writeFileSync(path, content);
};

fixFile('src/components/LogisticsSettings.tsx', 'LogisticsSettings');
fixFile('src/components/FleterosManager.tsx', 'FleterosManager');
fixFile('src/components/LogisticsDashboard.tsx', 'LogisticsDashboard');
