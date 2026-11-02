---
name: ai-feynman-practice
description: |
  当用户想验证/提高自己对某个概念的理解，或提到费曼学习法、AI 陪练、反馈断点时调用。核心场景：
  判断真懂假懂(我以为我懂了但讲不清/被追问就卡壳)、费曼四步练习、用 AI 当听众/学生/评审来检验输出、
  盲区复盘(事实错误/逻辑跳跃/术语空转/缺边界)、学习验收(什么时候才算真会了)、大脑打圆场自欺。
  方法主张: 看懂≠能讲清楚，讲不清就是没懂；费曼法最难的不是开口讲，而是获得能把你拽回真实理解的反馈；
  AI 能低成本补上这个反馈角色，但必须加三条护栏（锚定上一句/没讲清不许解释/外部事实只标待查证）；
  练习分三档递进（温和→苏格拉底追问→毒舌验收），用盲区清单清零+间隔复测+30秒讲清+扛两个追问验收。
  不适用于: 需要专业教学辅导的从头学新领域、备课/写讲义/编排讲授顺序（归 self-taught-learning）、事实查证本身、AI 工具操作教程。
  事前备课、写讲义、讲稿自查、编排讲授顺序 → 归 self-taught-learning；本 skill 只管"讲出去之后"的练习、追问、验收，以及讲砸后的事后复盘归因。
  Triggers: 费曼/费曼学习法/真懂/假懂/我是不是真的懂了/讲不清/盲区/反馈断点/把概念讲清楚/AI陪练/feynman/explain to check understanding
metadata:
  cangjie.generated-by: cangjie-tools v2.5.0
  cangjie.variant: single
  cangjie.bundle-id: bundle.feynman-practice
  cangjie.capability-count: 12
  cangjie.entrypoint-count: 1
---
# 《费曼学习法最难的一步，被AI解决了》(B 站短视频) — 全书能力入口

## 触发与不触发

**适用**：与本书能力域相关的咨询与任务（见下方路由表的意图列）。
**不适用**：
- 从零系统学习一个新领域（本方法检验已有理解，不做知识传授）
- 把 AI 当权威知识源查证事实（护栏要求外部事实人工查证）
- 机构引流内容（SOP 模板、加微信导流）

## 核心原则（常驻速览，概览类问题读到这里即可回答）

1. 看懂、听懂、能点头都不等于能讲清楚；能无空转地讲清才是理解的判据（清晰度＞存储量）。
2. 费曼法的价值不在"讲"这个动作，而在讲完之后能否穿过反馈断点（愿听的听众 + 敢指错的反馈同时在场）。
3. 自我感觉型检测必然被大脑"打圆场"污染（"我只是没组织好语言"），必须引入外部质询。
4. AI 能补上反馈断点：无限耐心听众 + 敢追问学生 + 零羞耻练习场；但 AI 不是真理机，使用前必须加三条护栏。
5. 练习分三档递进：一档温和求流畅、二档苏格拉底挖盲区、三档毒舌做压力验收；产出物是盲区清单。
6. "真的懂了"有可操作判据：盲区清单清零 + 隔 10 分钟复测仍空 + 30 秒讲清核心 + 扛住两个追问 + **独立度达标**（核心节点不是被 AI 代答的）。这是经验判据而非科学测量：复杂概念可放宽时限；"清零"须由 AI 反向探测兜底（见 `mastery-acceptance`），防"问不到真盲区→假清零"；独立度防"被 AI 扶着通过→记成学会"。

## 能力路由（先读本表，按意图加载 1 张能力卡）

| 用户意图 | 先读 | 补读/备注 |
|---|---|---|
| 判断自己是不是真的懂了某概念；怎么验证学习效果而不是凭感觉；我以为我懂了，但讲不清楚；check if I truly understand a concept | references/capabilities/understanding-diagnosis.md | references/capabilities/clarity-vs-storage.md、references/capabilities/anti-rationalization.md、references/capabilities/mastery-acceptance.md |
| 为什么我看了很多却用不出来/学不会；学习/练习卡在某一步转不动；复盘某个流程为什么没进展；why my learning loop is stuck | references/capabilities/feedback-gap-model.md | references/capabilities/role-decomposition.md、references/capabilities/anti-rationalization.md、references/capabilities/three-tier-drill.md |
| 我怎么知道自己不是在自欺；自我感觉"会了"可不可信；复盘时总给自己找借口；am I fooling myself about understanding | references/capabilities/anti-rationalization.md | references/capabilities/understanding-diagnosis.md、references/capabilities/mastery-acceptance.md |
| 为什么同样学过差距这么大；学习应该往哪使劲；判断两个人谁掌握得更深；where does the learning gap come from | references/capabilities/clarity-vs-storage.md | references/capabilities/understanding-diagnosis.md、references/capabilities/three-tier-drill.md |
| 想练口语/面试/演讲但没有合适的真人搭子；怎么用 AI 模拟一个练习对象；缺反馈资源怎么办；practice partner alternatives | references/capabilities/role-decomposition.md | references/capabilities/feedback-gap-model.md、references/capabilities/ai-guardrails.md、references/capabilities/tool-boundary.md |
| 用 AI 当老师/评审/面试官怎么防止它瞎说或附和；怎么让 AI 给真实反馈而不是客套；防止 AI 幻觉污染我的判断；trustworthy AI feedback | references/capabilities/ai-guardrails.md | references/capabilities/role-decomposition.md、references/capabilities/three-tier-drill.md、references/capabilities/tool-boundary.md |
| 用 AI 把一个概念练到能讲清楚；费曼学习法实操；准备汇报/讲课/面试前用 AI 演练；practice explaining a concept with AI | references/capabilities/three-tier-drill.md | references/capabilities/understanding-diagnosis.md、references/capabilities/ai-guardrails.md、references/capabilities/blind-spot-taxonomy.md、references/capabilities/mastery-acceptance.md、references/capabilities/pit-value-reframe.md、references/capabilities/clarity-vs-storage.md |
| 练习挖出盲区后怎么补上；AI 不许解释那谁来教我；补完怎么确认真补上了；how to fill the gaps my practice exposed | references/capabilities/gap-filling.md | references/capabilities/three-tier-drill.md、references/capabilities/blind-spot-taxonomy.md、references/capabilities/ai-guardrails.md |
| 复盘一次讲砸的分享/汇报/面试；把"讲不清"具体归因；整理学习中的理解漏洞；categorize what went wrong in my explanation | references/capabilities/blind-spot-taxonomy.md | references/capabilities/three-tier-drill.md、references/capabilities/mastery-acceptance.md |
| 怎么才算真的学会了；学习到什么程度可以停/过关；验收学习成果的标准；definition of done for learning | references/capabilities/mastery-acceptance.md | references/capabilities/three-tier-drill.md、references/capabilities/understanding-diagnosis.md、references/capabilities/anti-rationalization.md |
| 判断某个 AI 学习工具是在帮我还是在替我学；用 AI 学习的正确姿势；AI 时代怎么避免外包理解；is this AI tool helping or replacing my learning | references/capabilities/tool-boundary.md | references/capabilities/ai-guardrails.md、references/capabilities/three-tier-drill.md、references/capabilities/role-decomposition.md |
| 练习/考试被问倒很挫败怎么办；怎么看待练习中暴露的错误；心态调整；how to feel about making mistakes in practice | references/capabilities/pit-value-reframe.md | references/capabilities/three-tier-drill.md、references/capabilities/understanding-diagnosis.md |

**非能力类查询**：
- 书名/作者/章节/整书概览 → references/overview.md
- 术语解释 → references/glossary.md
- 决策规则速查（不需要原文依据时） → references/cheatsheet.md
- 完整意图与关键词索引（本表未覆盖的意图先查这里） → references/capability-index.md
- 练习/验收后的记录与存档模板 → references/templates/learning-record.md

## 加载规则

- 每次任务先读本文件，再按路由表加载 **1** 张能力卡；任务明确跨域时最多加载 2 张。
- **先判任务型态再装载**：单轮咨询（问原理/归因/求建议，如"为什么学不会"）→ 加载对应卡，回答即可收尾；陪练执行（"帮我练/考我/验收我"）→ 以 `three-tier-drill` 为主跑完整个会话（含选题→分档→清单→验收），本文件与其他卡只作规则参照，**不要用"讲道理"替代"开练"**。
- **陪练会话的状态管理**：有**两个**贯穿全流程的状态，须在会话内持续累积、每档产出后明示给用户——①**盲区清单**（哪里有洞）；②**独立度标签**（每个关键节点是"独立达成／提示后达成／被代答"，即洞是谁填的）。会话结束时把清单与独立度一并交给用户（建议其存档，可用 `references/templates/learning-record.md` 的记录模板固定下来）；跨会话续练时，先让用户带回上次清单再决定从哪档恢复，不默认为从零开始。
- 概览/书名类问题不加载能力卡，用「核心原则」与 overview.md 回答。
- 路由表与 capability-index.md 都无法命中的意图，明确告知超出本书范围，不要硬套。

## 边界与判停

- 用户要**备课 / 写讲义 / 编排讲授顺序 / 讲稿事前自查**（内容尚未讲出去）→ 转 `self-taught-learning`；本 skill 从"讲出去之后"接手（练习、追问、验收、讲砸归因）。
- 用户要的是"学新东西"而非"检验已有理解" → 不套本方法，转常规学习路径。
- 外部事实类盲区未人工查证 → 不得判定"已清零/已通过"。
- 用户情绪危机或需专业辅导 → 不硬套学习方法论。
