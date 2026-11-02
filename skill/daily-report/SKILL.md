---
name: daily-report
description: >-
  用当天真实的 git/svn 提交、代码改动和 OpenCode 会话记录生成工作日报；没有真实产出时，按项目里真实存在的模块补写过程性工作并标 [补]。
  适用范围：写日报、生成日报、补写某天的日报、daily report、standup。
  不适用：要精确工时统计、要汇总他人工作、要输出 Word/PDF。
argument-hint: "[日期 YYYY-MM-DD] [项目路径]"
---

# 生成每日工作日报

素材真实，表述落到真实符号。先取证，再写。

## 1. 取素材

```powershell
node --no-warnings "C:\Users\linwen\.config\opencode\skills\daily-report\scripts\collect.mjs" `
  --date 2026-11-02 `
  --out "$env:TEMP\daily.json"
```

跑完 `read` 这个文件。始终带 `--out`——PowerShell 管道会把中文弄乱。

参数：

- `--date` 省略取今天；补写传日期。
- `--project` 省略则自动推断：当前目录是工作副本 → 当天会话的落点 → 当天有提交的项目。
- 用户在对话里给了路径（"用 E:\btos 写日报"），直接用作 `--project`，不再推断。

读这几个字段：

| 字段 | 用途 |
|---|---|
| `project.vcs` | git / svn / both，决定后面看哪块 |
| `git.commits[].isMine` | 你的提交才算"今日完成" |
| `commits[].hunks` / `addedKeys` / `numstat` | 方法签名、接口路径、改动量，写深度用 |
| `git.uncommitted` / `svn.uncommitted` | 进行中的证据 |
| `sessions[].userPrompts` | 今天在琢磨什么 |
| `history[]` | 最近 7 天，避免撞车 |
| `stats.myCommitCount` / `mySvnCommitCount` | 定档依据 |

`project` 为 null 或明显选错时，问用户要路径。

## 2. 定档

| 档 | 判据 | 写法 |
|---|---|---|
| A 有产出 | `myCommitCount + mySvnCommitCount > 0` | 提交为主体，会话补充 |
| B 有动作 | 无本人提交，但有同项目会话 / 未提交改动 | 还原在做什么，可补 1–2 条 |
| C 摸鱼 | 三者皆无 | 全篇补写，最多 3 条，全标 `[补]` |

## 3. 选材

**进日报**：

- `isMine === true` 的提交，`subject` 稍作书面化
- `modules` 里的真实模块名（`tos-vessel`、`tos-billing`）
- 未提交改动，写成"进行中 / 调整中"
- `directory` 在项目下的会话，用 `userPrompts` 判断在做什么

**不进日报**：

- `isMine === false` 的提交（可以写成"配合 / 评审"）
- 生活、健康、历史、新闻类提问
- Merge 提交，以及只改 `rebel.xml`、`.d.ts`、`AGENTS.md` 的提交
- 重复 subject，只写一条

## 4. 写

### 落到真实符号

`hunks`、`addedKeys` 是索引。挑 1–3 个文件，`read` 改动附近 60–120 行或用 `grep` 确认，再写具体符号。优先 `hunks` 有方法签名的、`addedKeys` 有接口路径的、`numstat` 改动最大的。

| 浅（只有动作） | 深（对象 + 结论） |
|---|---|
| 复核 truckAppointment 列表的查询条件，梳理参数对应关系。 | 复核 truckAppointment 列表查询，前端多传了 `companyId`，与后端 `TruckAppointmentQuery` 的过滤条件重复。 |
| 更新语言包文案，保持中英文一致。 | 补齐 `web-admin-ui-svc/.../en-US.json` 散货模块缺失的 12 个 key。 |
| 梳理船期状态流转，标注待确认分支。 | 确认 `VesScheduleService` 里 `UNMOOR → DEPARTED` 两处状态判断缺少 `null` 分支。 |

每条至少出现一个可 grep 的符号：类名、方法名、字段名、接口路径、状态枚举。

裸动词（梳理 / 对比 / 整理 / 跟进 / 复核 / 处理 / 优化）后面跟具体对象和结论；写不出结论，说明还没读代码。

### 补写

补写的都是过程性工作：读链路、核字段、定位分支、联调排查、补注释、自测边界。每条同样落到真实符号——读一遍真实代码，写一句技术事实，即使今天没做，被问也答得上。例如"确认 `ChargingInOutBillService` 里出库单和入库单共用同一套查询，公司维度靠 `crmId` 区分"。

成果性表述（上线、交付、修复线上 bug、新增功能、量化指标）只来自 commit 原文。

### 格式

```
今日完成
1. ……

进展与问题
……

明日计划
……

其他
……
```

- 第一人称，每条 30–60 字，全篇 3–6 条，不写工时。
- 空段写"无"，段标题保留。
- 补写的条目行尾标 `[补]`，其余不加标记。
- 与 `history` 最近 7 天不重复；同一件事写成"继续 / 推进"。

## 5. 交付

代码块输出正文，块外紧跟一句：

> 正文里 `[补]` 是补写标记，粘贴到钉钉前删掉。

然后写入 `config.json` 的 `historyDir`，文件名 `YYYY-MM.md`（当前 `C:\Users\linwen\Desktop\openCodeTest\history\`）：`read` 当月文件 → 末尾接新段落 → `write` 回写。不要用管道追加。

```markdown
## 2026-11-02

**今日完成**
1. ……
```

## 边界情况

| 情况 | 处理 |
|---|---|
| 项目推断不出 | 问用户 |
| 周末 / 节假日 | 值班、维护、需求跟进类，不编加班 |
| 指定日期补写 | 传 `--date`，历史按日期顺序插入 |
| 会话库不存在 | `sessions` 为空，用 git/svn |
| `svn.available=false` | 用 `recentFiles` 写"在改哪块"，不编提交；提醒装 svn CLI |
| `vcs="both"` | 两边都采，按 `isMine` 合并去重 |
| 用户要本周汇总 | 一次只做一天，读 `history` 后自行汇总 |

## 配置

`config.json`：

```json
{
  "historyDir": "C:/Users/linwen/Desktop/openCodeTest/history",
  "gitAuthors": ["Linw09"],
  "gitEmails": ["52514902+Linw09@users.noreply.github.com"],
  "svnAuthors": ["lw"]
}
```

git 按 name 或 email 任一匹配，svn 按作者名。没配置时 `isMine` 为 `null`。换仓库或机器后核对 `git config user.name` / `user.email`。

SVN 需要 `svn` 命令行；TortoiseSVN 默认不装，此时脚本返回 `svn.available=false` 和 `recentFiles`。

## 交付前三问

1. 每条能在代码里指到具体符号吗？
2. 和最近 7 天撞车吗？
3. `[补]` 标对了吗，块外提醒写了吗？
