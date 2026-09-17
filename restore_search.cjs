const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function restore() {
  const logPath = '/.aistudio/artifacts/brain/797fd38f-6da6-4d83-b8c6-facb4756d4f4/.system_generated/logs/transcript.jsonl';
  if (!fs.existsSync(logPath)) {
    console.log("LOG NOT FOUND IN", logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let originalContent = '';
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      // Busquemos cualquier mención a MisProductosView.tsx con un tamaño de bytes grande o que parezca el archivo completo
      if (obj.output && obj.output.includes('File Path: `/src/components/MisProductosView.tsx`')) {
         // Extraigamos las líneas del output si está completo o parcialmente completo
         originalContent = obj.output;
      }
    } catch (e) {
      // ignore
    }
  }

  if (originalContent) {
     console.log("FOUND INSTANCE OF FILE IN TRANSCRIPT!");
     fs.writeFileSync('/restore_dump.txt', originalContent, 'utf8');
  } else {
     console.log("No complete dump found in transcript.");
  }
}

restore();
