# GitHub Pages 共享查询版

这个目录是你们“十几个人共享查询”的静态网站版本。

特点：
- 不需要常开服务器
- 不要求同一 Wi-Fi
- 任何人通过网址都能查询
- 页面显示“最新更新时间”
- 页面加了一个简单访问密码：`xw2d`

## 当前线上地址

- GitHub Pages: `https://wangjojo886.github.io/kuaidi-assistant-pages/`

## 文件说明

- `index.html` / `style.css` / `app.js`
  查询页面源码
- `latest.json`
  当前查询数据
- `update_latest_json.py`
  把后台导出的 JSON 转成 `latest.json`
- `daily_update.ps1`
  命令行一键更新脚本
- `daily_update.bat`
  双击执行的一键更新批处理

## 值班人员每天怎么更新

### 方法 1：双击最简单

直接双击：

```text
daily_update.bat
```

它会自动弹出文件选择框，你只需要选中后台导出的 JSON 文件。

然后脚本会自动：
1. 生成最新 `latest.json`
2. 提交到 GitHub
3. 触发 GitHub Pages 自动更新

### 方法 2：命令行

```powershell
.\daily_update.ps1 -ExportJsonPath "导出的JSON文件路径"
```

## 用户如何访问

1. 打开网址：`https://wangjojo886.github.io/kuaidi-assistant-pages/`
2. 输入访问密码：`xw2d`
3. 查询单号

## 注意

- 这个“访问密码”只是轻量门禁，不是强安全方案。
- 如果值班人员更新完后页面没立刻变化，等 1~2 分钟刷新即可。
- 页面顶部会显示“最新更新时间”，方便确认是不是最新数据。
