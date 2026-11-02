# wangshimin 学习方法 skill 组

从王世民《思维力》（2017，238 页）与《学习力》（2018，319 页）蒸馏出的 9 个 skill，
面向中小学生。两个 skill 之间：前者管怎么想清楚，后者管怎么学得快。

## 迁移方式

**把整个 `wangshimin/` 目录复制到目标机器的 `~/.config/opencode/skills/` 下即可。**

不需要额外配置，不需要改任何文件路径，不需要重新注册。9 个 skill 的 ID 由叶子目录名决定，
与本分组目录无关，换机器后调用方式完全一致。

验证过：复制后 `opencode reload` 或重启即可生效。

## 三条硬约束

改这个目录前先看这三条，踩中任何一条都会出问题。

### 1. 叶子目录名必须全局唯一

OpenCode 按 skill 的**叶子目录名**（ID）注册，同一源里出现同名叶子目录会**互相覆盖**，
后注册的赢，行为不可预期。

新增 skill 时先确认 `~/.config/opencode/skills/` 下（递归，含所有分组）没有同名目录。

现有的 9 个名字：`problem-five-step`、`problem-framing`、`framework-topdown`、
`hypothesis-testing`、`visualize-content`、`purposeful-study`、`skill-three-types`、
`fast-reading`、`wangshimin-methods`。都刻意避开了通用词。

### 2. 本目录根下不能直接放 SKILL.md

如果在这里放一个 `SKILL.md`，OpenCode 会把它当成**一个名叫 `wangshimin` 的独立 skill** 注册，
凭空多出一个触发入口，而且它没有任何内容。

只放子目录。本文件 `README.md` 不会被误认（不是 `SKILL.md`，也不是源根下的裸 `.md`）。

### 3. 移动目录不改变 ID，但会改变发现顺序

分组目录对 skill 完全透明：`skills/wangshimin/purposeful-study/SKILL.md` 的 ID 仍是
`purposeful-study`。所以移动文件是安全的。

但如果**同一个 skill 同时存在于两处**（比如一份在根目录、一份在本组内），
会注册两次同 ID，触发行为取决于加载顺序。移动后要确认旧位置已无残留。

## 9 个 skill 分工

### 分析侧（问题解决）

| ID | 什么时候用 | 核心 |
|---|---|---|
| `problem-five-step` | 任何想不清的事，要走全程 | 界定问题 → 构建框架 → 明晰关键 → 执行 → 检查 |
| `problem-framing` | 只想把"问题到底是什么"弄准 | 四类界定不清 + 5W2H + 5Why + 隐含假设 |
| `framework-topdown` | 要把眼前这个问题拆开 | 选框架 → 分解 → 多维思考 → 检查（只查不重） |
| `hypothesis-testing` | 时间不够、信息不全 | 先猜再验：创建假设 → QDT 粗验 → 快速调整 |

### 表达侧

| ID | 什么时候用 | 核心 |
|---|---|---|
| `visualize-content` | 内容已想清，要画成图 | 建表达框架 → 选图表结构 → 按 5W2H 填充 |

### 学习侧

| ID | 什么时候用 | 核心 |
|---|---|---|
| `purposeful-study` | 该学哪些内容、学多少 | 选问题 → 定范围 → 实际用 → 最简应用 → 自然重复 |
| `skill-three-types` | 这类东西该怎么入门 | 三类技能各配路径 + 跨学科入门五步 |
| `fast-reading` | 怎么读完这份材料 | 整体阅读五步 + 多重阅读四步 |

### 入口

| ID | 什么时候用 |
|---|---|
| `wangshimin-methods` | 问两本书本身，或提到未单独成 skill 的主题（如"讲三点"） |

它内部带 8 张能力卡（`references/capabilities/`）和 4 个参考文件，
**这些不是独立 skill，只是这个入口的内部资料**，不能直接触发。

## 调用方式

日常直接说需求，OpenCode 自己匹配：

```
"我数学一直不好"        → problem-framing
"想学游泳怎么开始"      → skill-three-types
"明天考试，押题技巧"    → 拒绝（四条边界之一）
```

拿不准时直接报 ID：

```
"用 framework-topdown 拆：三个社团怎么选"
```

问书本身：

```
"《思维力》讲了什么"    → wangshimin-methods
```

## 四条边界（9 个 skill 通用）

遇到这四类问题，明说答不了，不硬套：

- 考试应试技巧（押题、刷题策略、答题套路）
- 记忆与遗忘管理（艾宾浩斯、间隔重复、记忆宫殿）
- 时间管理与日程安排
- 小组协作与分工

原书是职场读物，这四块确实没覆盖。宁可说答不了，也不用网上那套硬凑。

## 与费曼 skill 的关系

`ai-feynman-practice` 是**独立的既有 skill**，不属于本组。

分工：费曼管**学没学会**（验收层），本组管**怎么学得快**（习得层）。两者不抢触发。

概念理解三问的母版在费曼那边（`understanding-diagnosis` 的 E 步骤 6 与 E 步骤 7），
本组不单独成卡，避免抢同一个触发词。两者同源（源头都是 YouCore 资料库），
本组这边只作为学习侧的输入位参考。

## 改这份文件时

改动内容后同步 `BUILD_MANIFEST.json` 的 `generated_at`，并在会话里说明改了什么。
这份 README 是迁移时的说明书，和能力卡本身一样重要。
