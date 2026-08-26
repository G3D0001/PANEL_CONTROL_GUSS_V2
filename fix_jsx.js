import fs from 'fs';

const fixJSX = (file) => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/\{\!insideWrapper && \(\{\/\* Header \*\/}\n/g, '{!insideWrapper && (\n');
  fs.writeFileSync(file, content);
};

fixJSX('src/components/CategoriesView.tsx');
fixJSX('src/components/WorkflowsView.tsx');
fixJSX('src/components/LogisticsDashboard.tsx');
fixJSX('src/components/FleterosManager.tsx');
fixJSX('src/components/LogisticsSettings.tsx');
