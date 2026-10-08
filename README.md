# 灵茶の试炼 · 每日一题

网站：https://code92007.github.io/lingcha-daily/

参考 [yawn-sean-daily-cf](https://github.com/Code92007/yawn-sean-daily-cf) 的静态架构，为[灵茶の试炼](https://docs.qq.com/sheet/DWGFoRGVZRmxNaXFz?tab=BB08J2) 独立建立的每日档案。读取“🎈算法趣题”完整公开表格，不止首屏。支持每日 / 全部题目、日期 / 平台 / 完成状态 / 难度 / 标签筛选、题号或 URL 搜索、同题多日期、题目和整日 AC 标绿。算法标签默认折叠避免剧透；题解链接回原表，不复制解题代码。

## 完成统计

- **Codeforces**：输入 handle，分页读取官方 user.status；OK 才算通过，失败保留缓存，请求间隔至少 2.2 秒。
- **AtCoder**：输入用户名，分页读取 AtCoder Problems 的公开 submissions；AC 才算通过，间隔 1.2 秒，按时间增量同步并重叠最后一秒。该接口是社区服务，可能延迟或不可用。
- **洛谷**：GitHub Pages 不能直接跨域读取洛谷个人练习页。填写数字 UID，再粘贴个人练习页的**已通过题目**列表。不要粘贴“尝试过”列表。也可运行下面的公开数据辅助脚本，自动提取 `data.passed`，再导入结果。无需密码或 Cookie；隐私 / 反爬 / 结构变更会失败并保留原记录。不会承诺未经验证的浏览器直连自动同步。
- **手动补记**：适用于私有 Gym、隐藏提交、数字 AT 镜像等；可撤销，和远端 AC 取并集，无法误撤销自动 AC。
- **跨平台去重**：CF1196B 和洛谷 CF1196B 对应 `cf:1196:B`；AtCoder abc250_e 和洛谷 AT_abc250_e 对应 `atcoder:abc250_e`。任何一个来源通过即完成。洛谷 P/B/U/SP/UVA 原生编号单独统计，数字 AT 编号不猜映射。CF 的等价不同比赛编号、AtCoder 共用题的其他任务 ID 尚不自动推断。
- 总统计按 canonical key 去重；每日记录保留每次出现。筛选后的统计单独显示。未查到 AC 标为“未确认”，不声称未做过。
- 每个平台按账号分别缓存；解除绑定不删除缓存。手动补记为当前浏览器的个人记录，不跟随平台账号切换。支持 JSON 进度备份与合并恢复；没有数据库、访客数据不会写入 GitHub。

```sh
python3 scripts/luogu_passed.py 你的UID --output luogu-passed.txt
# 若网络无法读取，保存公开练习页 HTML 后离线解析：
python3 scripts/luogu_passed.py 你的UID --html practice.html
```

## 运行和测试

```sh
python3 -m http.server 4174 --directory site
python3 -m unittest discover -s tests
npm test
python3 scripts/build.py
```

Python 只用标准库，前端无第三方包；Node 22+ 用于测试。腾讯公开表格使用匿名 Cookie 会话获取 snapshot，并解码 zlib/protobuf compact 数据。匿名会话只存在内存，原始请求上下文不提交到仓库。解析校验失败或数据明显不完整时停止更新、保留线上版本。非官方数据入口可能变化，需维护解码器。

## 历史保护和发布

北京时间 08/09/10/11/12/16/20/21/22/23/24 点同步，凌晨 00 点之后到 08 点之前不安排运行。工作流先测试，再获取完整快照；当前日期允许追加和补充，题目消失也保留；过去日期每日记录逐字段保留，包括旧行号。上游插入新行只导致行号平移，不生成历史差异。完整快照的历史比较比只回看两天更全面；保留上次同步的原表版本号作为审计游标。腾讯公开接口未提供匿名提交历史，因此不虚构 Git 提交比较。

历史变更进入网站“历史变更”通知，不自动合并，查看通知不批准。维护者在 Actions → Sync Lingcha and deploy Pages → Run workflow 的 `approve_change` 填入精确差异 ID，可应用对应日期的快照；不匹配或过期 ID 阻止发布。原表无题目链接的日期展示在数据 `skipped` 中，不编造题目。

Settings → Pages → Source: GitHub Actions。工作流提交增量数据后部署 `site/`；并发串行避免覆盖，任一更新或测试失败都不部署。

数据来源于灵茶山艾府的公开题单，版权归原作者和对应 OJ。本站为第三方练习进度索引，与腾讯文档、洛谷、Codeforces、AtCoder 无隶属关系。
