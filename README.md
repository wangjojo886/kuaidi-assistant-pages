# GitHub Pages + Supabase 录入/查询版

这个目录现在支持两种模式：

1. **未配置 Supabase**
   - 继续沿用 `latest.json`
   - 只能查询
   - 适合当前先上线

2. **配置好 Supabase**
   - 一个网址、两个入口
   - `我要查询`
   - `值班录入`
   - 手机浏览器可直接录入
   - 安卓 + 扫码枪（键盘模式）可连续扫件

## 当前线上网址

- https://wangjojo886.github.io/kuaidi-assistant-pages/

访问密码：

- `xw2d`

录入密码默认也是：

- `xw2d`

## 现在已经有的文件

- `index.html` / `style.css` / `app.js`
  页面源码
- `supabase-config.js`
  Supabase 配置文件（当前默认空，未启用云端录入）
- `supabase-config.example.js`
  配置示例
- `supabase-setup.sql`
  在 Supabase 里执行的数据库初始化脚本
- `latest.json`
  当前静态查询数据
- `daily_update.ps1` / `daily_update.bat`
  还没接 Supabase 前的“导出 JSON -> 发布查询数据”脚本

## 要启用手机录入，你只需要做这几步

### 第 1 步：创建 Supabase 免费项目

去 Supabase 创建一个免费项目。

你需要记下两个值：

- `Project URL`
- `anon public key`

## 第 2 步：初始化数据库

在 Supabase 后台打开 SQL Editor，执行：

- `supabase-setup.sql`

这个脚本会创建：

- `packages` 表
- `locations` 表
- `app_settings` 表
- `admin_login()` 函数
- `insert_package_with_password()` 函数

## 第 3 步：填写前端配置

把：

- `supabase-config.example.js`

复制为：

- `supabase-config.js`

然后填入你自己的：

```js
window.SUPABASE_CONFIG = {
  url: "https://你的项目.supabase.co",
  anonKey: "你的 anon public key",
};
```

## 第 4 步：把配置同步到 GitHub

同步 `supabase-config.js` 后，GitHub Pages 1~2 分钟内会自动更新。

更新后页面会自动切换成：

- 查询：实时查云端数据
- 录入：值班员手机直接录入

## 值班员怎么用

1. 手机打开网址
2. 输入访问密码：`xw2d`
3. 点 `值班录入`
4. 输入录入密码：`xw2d`
5. 扫码枪连接安卓手机
6. 保持光标停在“扫码/输入单号”输入框
7. 扫一单，回车即录入

页面会：

- 自动提示成功/失败
- 自动刷新最近录入
- 自动回到输入框，便于连续扫

## 如果暂时还没做 Supabase

当前站点不会坏。

它会继续：

- 使用 `latest.json` 查询
- 在“值班录入”入口提示“还没接入 Supabase”

## 旧的 daily_update 还有什么用

在你没启用 Supabase 之前：

- 仍然可以继续双击 `daily_update.bat`
- 继续走“本地录入 -> 导出 JSON -> 发布查询”

启用 Supabase 之后：

- 就不再需要 `daily_update` 了
- 数据会直接实时写入云端
