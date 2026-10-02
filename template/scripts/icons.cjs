// 重新生成 src/kit/icons.ts：node scripts/icons.cjs film-slate waveform ...（在现有列表上追加）
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'src/kit/icons.ts');
const cur = fs.readFileSync(file, 'utf8');
const json = JSON.parse(cur.slice(cur.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
for (const n of process.argv.slice(2)) {
  const p = path.join(root, 'node_modules/@phosphor-icons/core/assets/regular', n + '.svg');
  if (!fs.existsSync(p)) { console.log('没有这个图标：', n, '（到 phosphoricons.com 查名字）'); continue; }
  json[n] = fs.readFileSync(p, 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
fs.writeFileSync(file, '// Phosphor Icons (regular, MIT)。新增图标：在 scripts/icons.cjs 里加名字后重新生成。\nexport const ICONS: Record<string, string> = ' + JSON.stringify(json, null, 1) + ';\n');
console.log('icons:', Object.keys(json).length);
