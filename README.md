# 北辰青年 AI 实习第四期 · 招募网站

## 项目简介
基于需求说明书开发的静态网站，包含两大模块（兴趣吸引 + 信息确认）和三大主题（认识AI / 使用AI / 共创AI）。

## 技术栈
- 纯 HTML + CSS + JavaScript
- 无构建工具，无需依赖，直接打开即可运行

## 页面结构
```
beichen-ai-website/
├── index.html              # 首页（三主题轮播 + 需求卡片）
├── discover.html           # 认识 AI
├── create.html             # 使用 AI
├── collab.html             # 共创 AI
├── gallery.html            # 共享成果库（筛选 + 空状态）
├── about-program.html      # 活动介绍（流程 + FAQ）
├── about-us.html           # 关于北辰
├── apply.html              # 报名
├── assets/
│   ├── css/
│   │   ├── base.css        # 变量、重置、基础排版
│   │   ├── layout.css      # 导航、页脚、布局
│   │   └── components.css  # 轮播、卡片、FAQ、时间线等
│   └── js/
│       ├── main.js         # 导航、滚动动画
│       ├── carousel.js     # 首页轮播
│       ├── faq.js          # FAQ折叠
│       └── filter.js       # 成果库筛选
```

## 本地运行
直接用浏览器打开 `index.html` 即可。

或启动本地服务器：
```bash
# Python
python -m http.server 8000

# 或 Node
npx serve
```
然后访问 http://localhost:8000

## 已实现功能
- [x] 固定全局导航（桌面 + 移动端折叠）
- [x] 首页三主题轮播（4秒自动切换、手动控制、触摸滑动、键盘控制）
- [x] 6个需求方向卡片
- [x] 三大主题页（同结构不同文案配色）
- [x] 成果库筛选标签 + 空状态
- [x] 活动介绍（4步流程时间线 + 8条FAQ折叠）
- [x] 关于北辰页
- [x] 报名页（占位结构）
- [x] 响应式布局（桌面/平板/手机）
- [x] 滚动显现动画

## 待填充内容（占位中）
- [ ] 官方报名链接/二维码
- [ ] 真实学员作品（成果库）
- [ ] 品牌 LOGO
- [ ] 活动具体时间、截止日期
- [ ] 官方渠道链接
- [ ] 往期项目详细资料

## 视觉风格
- 主风格：青年创意社群 + 实验性编辑设计
- 三主题色：认识AI（探索蓝）/ 使用AI（创造橙）/ 共创AI（协作绿）
- 参考：CAPPEN（首页排版）+ Neal.fun（成果卡片）+ Altra（FAQ布局）
