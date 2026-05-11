# Cloudflare Pages 共享查询版

这个目录是“多人共享查询”的静态网站版本，适合你们“每天更新 1~2 次”的场景。

特点：
- 不需要常开服务器
- 不要求同一 Wi-Fi
- 任何人通过网址就能查询
- 页面显示“最新更新时间”

## 目录说明

- `index.html` / `style.css` / `app.js`：查询页面
- `latest.json`：当前查询数据源（值班人员每天更新）
- `update_latest_json.py`：把后台导出的 JSON 转成 `latest.json`

## 值班人员每天更新流程

1. 在本地后台录入完快递后，进入“系统设置 -> 导出数据（JSON）”。
2. 在本目录执行：

```powershell
python update_latest_json.py --input "导出的JSON文件路径"
```

3. 把 `cloudflare-pages/latest.json` 提交到仓库（或上传到 Pages 目录）。
4. 群里通知“已更新”即可。

## 发布到 Cloudflare Pages

### 方案 A：绑定 Git（推荐）

1. 把这个项目推到 GitHub/GitLab。
2. Cloudflare Pages -> Create a project -> 连接仓库。
3. 关键配置：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `cloudflare-pages`
4. 首次部署后得到访问网址（`https://xxx.pages.dev`）。

之后值班人员只要提交 `latest.json` 变更，Pages 会自动更新。

### 方案 B：手动上传（临时）

也可使用 `wrangler pages deploy` 手动发布 `cloudflare-pages` 目录。

## 注意事项

- `latest.json` 里没有数据时，页面会显示“暂无记录”。
- 如果查询不到，先看页面顶部“最新更新时间”，确认是否已发布最新版。
- 如果页面提示“加载失败”，通常是 `latest.json` 没发布成功或格式不对。
