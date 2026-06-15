/**
 * 从 arca.api 生成 TypeScript 客户端，接入 @/shared/api/arca-webapi。
 * 接口源：external/common-idl submodule（与 popop-fe 同源）。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = path.join(root, 'src', 'generated');

const submoduleApiFile = path.join(root, 'external', 'common-idl', 'arca', 'api', 'arca.api');
const rootApiFile = path.join(root, 'arca.api');
const apiFile = fs.existsSync(submoduleApiFile) ? submoduleApiFile : rootApiFile;

if (!fs.existsSync(apiFile)) {
  console.error(
    'gen:api 找不到 arca.api。请先执行：\n  git submodule update --init external/common-idl',
  );
  process.exit(1);
}

console.log(`gen:api 使用接口定义 → ${path.relative(root, apiFile)}`);

fs.rmSync(generatedDir, { recursive: true, force: true });
fs.mkdirSync(generatedDir, { recursive: true });

execSync(`goctl api ts --api "${apiFile}" --dir "${generatedDir}" --caller arcaWebapi`, {
  cwd: root,
  stdio: 'inherit',
});

const arcaApiPath = path.join(generatedDir, 'arca_api.ts');
let arcaApi = fs.readFileSync(arcaApiPath, 'utf8');
arcaApi = arcaApi.replace(
  'import arcaWebapi from "./gocliRequest"',
  'import arcaWebapi from "@/shared/api/arca-webapi"',
);
fs.writeFileSync(arcaApiPath, arcaApi);

const gocliPath = path.join(generatedDir, 'gocliRequest.ts');
fs.writeFileSync(
  gocliPath,
  `/** @generated 由 scripts/gen-api.mjs 写入，请勿手改；传输层见 arca-webapi.ts */\nexport { arcaWebapi as default, arcaWebapi, genUrl } from '@/shared/api/arca-webapi';\n`,
);

const indexPath = path.join(generatedDir, 'index.ts');
fs.writeFileSync(
  indexPath,
  `/** goctl 生成物统一入口（勿手改 arca_api*.ts，请改 arca.api 后执行 npm run gen:api） */\nexport * from './arca_api';\n`,
);

console.log('gen:api done → src/generated/');
