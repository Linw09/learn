---
name: wangshimin-methods
description: |
  当用户询问《思维力》《学习力》这两本书本身（书名/作者/章节/概念），或涉及书中未晋级为独立 Skill 的主题时调用：
  系统思维、界定问题四类型、构建框架、明晰关键、假设思考、形象化表达、功利性学习、三层次技能、整体阅读与多重阅读。
  以下意图优先使用同包独立 Skill，每条附反例关键词：
  problem-five-step（想不清的事按五步走；只要深挖"问题到底是什么"时转 problem-framing）；
  problem-framing（动手前界定问题；已有现成框架可直接套时转 framework-topdown）；
  framework-topdown（用现成框架拆解问题；连问题都没界定清楚时转 problem-framing）；
  hypothesis-testing（时间信息不足时先猜再验；时间充足要走完整流程时转 problem-five-step）；
  visualize-content（把想清楚的内容画成图；内容还没想清楚时先转 problem-five-step）；
  purposeful-study（决定学什么范围；问"用哪条路径学"时转 skill-three-types）；
  skill-three-types（判断学的属于哪类技能；问"该不该学、学多少"时转 purposeful-study）；
  fast-reading（限定时间从一本书里取所需；问"学什么内容"时转 purposeful-study）。
  Triggers: 思维力/学习力/王世民/系统思维/界定问题/框架/假设思考/学习策略/怎么学/阅读方法/思维导图
metadata:
  cangjie.generated-by: cangjie-tools v2.5.0
  cangjie.variant: router
  cangjie.bundle-id: bundle.wangshimin
  cangjie.capability-count: 8
  cangjie.entrypoint-count: 8
---
<!-- 路由入口 | bundle: bundle.wangshimin | 面向中小学生 -->

# 王世民《思维力》《学习力》 — 来源路由入口（compact pack）

## 触发与不触发

**适用**：与这两本书能力域相关的提问与任务，见下方路由表意图列。
**不适用**：
- 考试与应试技巧：押题、刷题策略、答题套路。
- 记忆与遗忘管理：艾宾浩斯、间隔重复、记忆宫殿。
- 时间管理与日程安排。
- 小组协作与分工。
- 纯事实查询：书名、作者、章节 → 用 overview.md 回答后即停。

## 核心原则（常驻速览，概览类问题读到这里即可回答）

1. 想不清的事先界定问题，别急着给方案。
2. 万物皆系统，框架是对系统构成与联系的简化。
3. 时间信息充足走五步法，不足改用假设思考。
4. 学什么由真实问题定，用哪条路径由技能类型定。
5. 读一本书先定目的，只取所需，不必从头顺读。
6. 内容想清楚才画得出图，画出来又帮你想得更清。

## 能力路由（先读本表，按意图加载 1 张能力卡）

| 用户意图 | 先读 | 补读 | 已晋级提示 |
|---|---|---|---|
| 想不清一件事、不知从哪下手；值日乱、班费对不上、选题太宽、实验做不成、招新没人来 | references/capabilities/problem-five-step.md | references/capabilities/problem-framing.md | 已晋级为独立 Skill `problem-five-step`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 只想把"问题到底是什么"弄准；"我数学不好"这类模糊说法 | references/capabilities/problem-framing.md | references/capabilities/problem-five-step.md | 已晋级为独立 Skill `problem-framing`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 有现成框架可用、想快速拆解；一张表/一张图理清一件事 | references/capabilities/framework-topdown.md | references/capabilities/problem-framing.md | 已晋级为独立 Skill `framework-topdown`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 时间不够、信息不全，想先猜一个答案再验证 | references/capabilities/hypothesis-testing.md | references/capabilities/problem-five-step.md | 已晋级为独立 Skill `hypothesis-testing`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 把想清楚的内容画成图；作业展示、读书笔记、实验报告配图 | references/capabilities/visualize-content.md | references/capabilities/framework-topdown.md | 已晋级为独立 Skill `visualize-content`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 学什么、学多少、从哪切；不按章节从头顺 | references/capabilities/purposeful-study.md | references/capabilities/skill-three-types.md | 已晋级为独立 Skill `purposeful-study`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 判断自己学的属于哪类技能、选哪条入门路径 | references/capabilities/skill-three-types.md | references/capabilities/purposeful-study.md | 已晋级为独立 Skill `skill-three-types`（已安装时优先直接使用；本卡仅作原文与背景补充） |
| 限定时间内从一本书里拿到自己要的那部分 | references/capabilities/fast-reading.md | references/capabilities/purposeful-study.md | 已晋级为独立 Skill `fast-reading`（已安装时优先直接使用；本卡仅作原文与背景补充） |

**非能力类查询**：
- 书名/作者/章节/整书概览 → references/overview.md
- 术语解释 → references/glossary.md
- 规则速查（不需要原文依据时） → references/cheatsheet.md
- 本表未覆盖的意图 → references/capability-index.md

## 加载规则

- 每次任务先读本文件，再按路由表加载 1 张能力卡；跨域时最多加载 2 张。
- 概览/书名类问题不加载能力卡，用核心原则与 overview.md 回答。
- 路由表与 capability-index.md 都命不中的意图，明确告知超出本书范围，不硬套。

## 边界（四条共识，8 个 Skill 全部适用）

这套方法来自原书，答不了四类学生场景。遇到要明说"这套方法解决不了你的问题"，不要硬套：
- 考试应试技巧：押题、刷题策略、答题套路。
- 记忆与遗忘管理：艾宾浩斯、间隔重复、记忆宫殿。
- 时间管理与日程安排。
- 小组协作与分工。

## 不做什么

- 不提供应试技巧，不倒推考试重点。
- 不做记忆规划，不排复习日程。
- 不做时间管理，不排学习计划表。
- 不做小组分工与协作设计。
- 不做纯事实查询以外的人生建议延伸。
