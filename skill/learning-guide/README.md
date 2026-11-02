# 学习向导 · id 清单

## 这是什么

本文件是学习类 skill 的 id 索引。

用途有两个：

1. 用户要手动触发某个 skill 时，查 id。
2. 向导拿不准 id 是否存在时，查这里。

**本文件不写任何 skill 的步骤。** 步骤以各自的 `SKILL.md` 为准。

## 主路径

| id | 管什么 | 什么时候用 | 当前状态 |
|---|---|---|---|
| `self-taught-learning` | 系统学一门有教材、有依赖链的课 | 数学、物理、考证；要规划、找书、写讲义、坚持不下去 | 隐藏 |
| `self-learning-youcore` | 学透一个概念或说法 | 要讲清、判断真假、写文章 | 隐藏 |
| `skill-three-types` | 判断技能类别并给入门路径 | 口语、乐器、编程实操、运动 | 自动 |
| `teach` | 长期课程 workspace | 数月学一个领域，要可回看的 HTML 课程 | 隐藏 |

> `self-learning` 的 id 是 `self-learning-youcore`。id 由目录名决定，frontmatter 的 `name` 只是显示名。

## 配件

| id | 管什么 | 什么时候用 | 当前状态 |
|---|---|---|---|
| `purposeful-study` | 定学习范围 | 不知道该学多少、学哪些 | 自动 |
| `fast-reading` | 快速读材料 | 材料太多、读不完 | 自动 |
| `reconstruct` | 概念为什么被发明 | 想从起源理解一个概念 | 自动 |

## 常驻自动

这两个不隐藏。模型自己会选中，向导不转。

| id | 管什么 |
|---|---|
| `ai-feynman-practice` | 练习与验收。三档陪练、盲区清单、独立度判定 |
| `ai-feynman-trigger` | 主动检验。用户没自觉时插一句 |

`ai-feynman-trigger` 必须保持自动。隐藏后它的作用消失。

## 相邻（不参与学习路由）

| id | 说明 |
|---|---|
| `eli5` | 通俗解释风格。只需要一段解释时用 |
| `eli5-claude` | 同上。它的 frontmatter `name` 也是 `eli5`，但 id 不同 |

## 手动触发写法

**方式一（官方）**

```
@self-taught-learning 帮我规划实分析
```

**方式二（稳，已实测）**

```
用 self-taught-learning 帮我规划实分析
```

**注意**：隐藏后模型看不到 skill 的 description。必须写出 id，否则模型不知道有这个 skill。

## 状态说明

"隐藏"指 frontmatter 里有：

```yaml
metadata:
  opencode/autoinvoke: false
```

"自动"指没有这一行。

**状态以各 `SKILL.md` 的 frontmatter 为准。** 本表可能滞后。

## 回滚

删掉对应文件里的这两行，立即生效，不用重启：

```yaml
metadata:
  opencode/autoinvoke: false
```

删掉整个 `learning-guide/` 目录，向导本身也一并移除。

## 维护

改 id 时同步三处：

1. 目录名
2. 本文件
3. `SKILL.md` 的路由表
