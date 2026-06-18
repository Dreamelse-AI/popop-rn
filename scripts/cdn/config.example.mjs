// 复制此文件为 config.mjs，填入真实的 AccessKey
// config.mjs 已被 .gitignore 忽略，不会提交到 git
export default {
  oss: {
    region: 'oss-ap-northeast-1',
    accessKeyId: '向管理员获取',
    accessKeySecret: '向管理员获取',
    bucket: 'bucket-popop-i18n-prod',
  },
  cdnDomain: 'https://cdn-prod-i18n-public.popop.ai',
  ossPrefix: 'popop-fe/',
  localAssetDirs: [
    {
      dir: '../../src/shared/assets',
      ossPath: 'assets/',
    },
  ],
  imageExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
};
