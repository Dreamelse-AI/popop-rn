/**
 * 临时同步：从 popop-fe 复制 generated（goctl 未安装或快速对齐 FE 时使用）。
 * 长期应使用 npm run gen:api + external/common-idl submodule。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const feGenerated = path.join(root, '..', 'popop-fe', 'packages', 'shared', 'src', 'generated');
const rnGenerated = path.join(root, 'src', 'generated');

if (!fs.existsSync(feGenerated)) {
  console.error(`找不到 FE generated：${feGenerated}`);
  process.exit(1);
}

fs.rmSync(rnGenerated, { recursive: true, force: true });
fs.cpSync(feGenerated, rnGenerated, { recursive: true });

for (const file of ['arca_api.ts', 'gocliRequest.ts']) {
  const filePath = path.join(rnGenerated, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replaceAll('@popop/shared/shared/api/arca-webapi', '@/shared/api/arca-webapi');
  fs.writeFileSync(filePath, content);
}

console.log('sync-generated-from-fe done → src/generated/');
