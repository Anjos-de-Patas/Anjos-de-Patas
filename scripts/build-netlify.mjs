// Monta a pasta dist apenas com os arquivos públicos da interface.
// Código interno, documentação e .env nunca entram na publicação.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'dist');
const publicos = ['index.html', 'pages', 'css', 'js', 'assets'];

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);
for (const item of publicos) {
    fs.cpSync(path.join(raiz, item), path.join(destino, item), {
        recursive: true,
        filter: origem => !path.basename(origem).startsWith('.')
    });
}
console.log(`Interface copiada para dist: ${publicos.join(', ')}`);
