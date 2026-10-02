// 把字体复制到 public/fonts（安装依赖后运行一次：npm run setup）
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const dst = path.join(root, 'public/fonts');
fs.mkdirSync(path.join(dst, 'misans'), {recursive: true});
const ms = path.join(root, 'node_modules/misans/lib/Normal');
for (const f of fs.readdirSync(ms)) if (f.startsWith('MiSansVF')) fs.copyFileSync(path.join(ms, f), path.join(dst, 'misans', f));
const jb = path.join(root, 'node_modules/@fontsource/jetbrains-mono/files');
for (const w of [400, 500, 600]) fs.copyFileSync(path.join(jb, `jetbrains-mono-latin-${w}-normal.woff2`), path.join(dst, `jetbrains-mono-${w}.woff2`));
console.log('fonts ready →', dst);
