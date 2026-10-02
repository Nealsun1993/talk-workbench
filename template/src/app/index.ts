// 方案 C 的 App 页面模板。镜头里写 "template": "app.xxx"。
import {AppTemplate} from './types';
import {Modules} from './pages/Modules';
import {Browser} from './pages/Browser';
import {Toggles} from './pages/Toggles';
import {Timeline} from './pages/Timeline';
import {Export} from './pages/Export';
import {Tts} from './pages/Tts';
import {Gallery} from './pages/Gallery';
import {Character} from './pages/Character';
import {Draft} from './pages/Draft';

export const APP_TEMPLATES: Record<string, AppTemplate> = {
  'app.modules': Modules,   // 模块清单：点「添加」一行行加入，点「连接」统一编排
  'app.browser': Browser,   // 内置浏览器：真实页面 + 聚光 + 相机推近
  'app.toggles': Toggles,   // 能力开关 / 检查项：说到哪项开哪项，结尾通知
  'app.timeline': Timeline, // 时间轴：拖入文件 → 按说话时间对齐（真实数据）
  'app.export': Export,     // 合成导出：进度（示意）+ 真实成片预览 + 完成通知
  'app.tts': Tts,           // 文字转配音：文案 → 生成 → 真实波形；切换参考音色
  'app.gallery': Gallery,   // 生成结果 / 样例画廊：分类标签选中 + 相机推近
  'app.character': Character, // 固定角色：参考图 + 规则勾选 + 不同场景
  'app.draft': Draft,       // 下期预告 / 待办：新建草稿卡
};
