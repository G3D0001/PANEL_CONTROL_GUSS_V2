import fs from 'fs';
let c = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
c = c.replace(
  /const \[systemConfig, setSystemConfig\] = useState\(\{ dias_validez_link: 15 \}\);/,
  "const [systemConfig, setSystemConfig] = useState<any>({ dias_validez_link: 15 });"
);
c = c.replace(
  /setSystemConfig\(\{ dias_validez_link: data\.dias_validez_link \|\| 15 \}\);/,
  "setSystemConfig(data || { dias_validez_link: 15 });"
);
fs.writeFileSync('src/components/SettingsView.tsx', c);
