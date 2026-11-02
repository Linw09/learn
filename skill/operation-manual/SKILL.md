---
name: operation-manual
description: >
  根据前端页面文件夹和后端代码自动生成 .doc 格式的操作手册。
  当用户提到"操作手册"、"用户手册"、"使用说明"、"操作指南"、
  "写一份手册"、"生成文档"、"做个操作说明"、"出个手册"、
   "给 XX 模块写文档"、"生成 .doc 手册"等请求时触发。
   不要等用户明确说"用 operation-manual skill"——只要他们想要
   把某个功能模块写成结构化操作文档，就直接使用本 skill。
   若用户只给功能描述、想要快速生成文字版手册（智慧港云平台风格），用 customer-manual。
---

# 操作手册生成器

根据前端页面文件夹（组成一个功能菜单）和相关后端代码，自动生成结构化的 `.doc` 操作手册，保存到用户桌面。

## 核心流程

### 第一步：确定目标模块

询问或推断用户要生成哪个模块的手册：
- 如果用户指定了文件夹路径，直接使用
- 如果用户只说了模块名，在 `src/main/resources/templates/` 下搜索匹配的目录
- 前端页面通常在 `src/main/resources/templates/business/<模块名>/` 下

### 第二步：扫描前端页面

读取目标文件夹下 **所有** `.html` 文件，逐文件分析：

1. **页面标题**：从 `<title>`、Tab 标题、或 `.grid-section-title` 中提取
2. **页面功能**：理解每个页面做什么（列表、编辑、详情、审核、导入等）
3. **表单字段**：列出所有 `<input>`/`<select>` 控件，记录 label、类型、必填状态
4. **表格列**：列出 datagrid columns 定义，记录 field、title、formatter（特别注意状态映射逻辑）
5. **操作按钮**：列出工具栏和行操作按钮，理解触发条件和行为
6. **联动关系**：页面间跳转、弹窗调用、Tab 切换、下拉框级联

重点关注：
- EasyUI 的 `datagrid` columns 配置
- `combobox`/`combotree`/`combogrid` 的 `data-options`（label、url、required、readonly）
- 按钮的 `onclick` 事件和 JS 函数
- `<:layout>` 标签的页面继承关系

### 第三步：扫描后端代码

根据前端 AJAX 请求 URL 定位后端代码：

1. **定位 Controller**：如 `/shipDynamicApply/page` → 搜索 `@RequestMapping` 匹配的 Controller
2. **列出所有接口**：`@GetMapping`、`@PostMapping` 的 URL、功能、参数
3. **定位 Entity**：找到实体类，读取 `@TableName`（表名）和所有 `@TableField`（字段和注释）
4. **理解业务流程**：从 Service 实现中提取状态流转、校验规则

### 第四步：自动截图（核心新增）

扫描完前后端代码后，通过 Playwright 浏览器工具自动访问运行中的应用，截取每个页面的关键操作界面。

#### 4.1 前置确认

截图前必须向用户确认：
- **应用访问地址**（如 `http://localhost:8081`）
- **登录账号和密码**
- 如果用户没有提供，主动提问

#### 4.2 截图工作流

按以下顺序执行：

1. **调整浏览器窗口**（必须在截图前执行）：
   ```
   browser_resize(1920, 1080)
   ```
   ⚠️ 不 resize 会导致宽弹窗被裁切。

2. **登录**：
   - 导航到应用地址 → 自动跳转到登录页
   - 填写用户名、密码
   - **处理验证码**：用 `browser_take_screenshot` 截取验证码图片，展示给用户并提问"请输入验证码"
   - 填入验证码后点击登录按钮

3. **按页面逐个截图**（从主页面到弹窗，从外到内）：
   - 先截主列表/主页面（全屏）
   - 展开筛选下拉框，截图（如"是否有效"下拉选项）
   - 打开新增弹窗，截图
   - 展开弹窗内下拉框/树形选择器，截图（如港区树）
   - 打开选择弹窗/子弹窗，截图
   - 打开编辑弹窗，截图
   - 触发行操作的确认弹窗（如失效/删除确认），截图

4. **截图命名规范**（按编号前缀，便于生成脚本引用）：
   ```
   screenshots/01_list.png              主列表页
   screenshots/02_list_filter.png        列表页筛选条件展开
   screenshots/03_add_with_tree.png      新增弹窗 + 下拉树展开
   screenshots/04_user_select.png        人员选择子弹窗
   screenshots/05_edit.png               编辑弹窗
   screenshots/06_status_confirm.png     状态切换确认弹窗
   screenshots/07_delete_confirm.png     删除确认弹窗
   ```

#### 4.3 EasyUI 控件兼容处理

| 问题 | 处理方式 |
|------|---------|
| combobox/combotree 下拉箭头点击失效 | 用 `browser_evaluate` 执行 `$('#portCode').combotree('showPanel')` 强制展开 |
| 弹窗关闭后遮罩残留（`window-mask`） | 用 `browser_evaluate` 执行 `$('.window-mask').remove(); $('.panel.window').remove()` 清理 |
| 元素 ref 过期 | 交互操作前重新 `browser_snapshot` 获取最新 ref |

#### 4.4 截图保存

所有截图保存到当前工作目录下的 `screenshots/` 文件夹，生成 .doc 时通过绝对路径引用。

---

### 第五步：生成 .doc 文件（含截图）

采用 **动态生成 Python 脚本** 的方式。具体步骤：

1. **确保依赖**：
   ```bash
   pip install python-docx Pillow 2>&1
   ```
   如网络慢，使用清华镜像：
   ```bash
   pip install python-docx Pillow -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn
   ```

2. **编写生成脚本**：根据扫描结果+截图列表，用 Write 工具创建一个 Python 脚本（如 `.scratch/gen_manual.py`），使用 `python-docx` 库生成 .doc 文件。

   > 如果模块结构标准且数据量大，可改用 `scripts/generate_docx.py`（需先将数据整理为 JSON，格式参考 `references/schema.md`）。大多数情况下动态编写脚本更灵活。

3. **图片嵌入方式**（脚本中使用）：
   ```python
   from docx.shared import Inches
   # 居中嵌入截图
   p = doc.add_paragraph()
   p.alignment = WD_ALIGN_PARAGRAPH.CENTER
   run = p.add_run()
   run.add_picture('screenshots/01_list.png', width=Inches(5.2))
   # 图注（灰色斜体）
   cap = doc.add_paragraph()
   cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
   cr = cap.add_run('图1：调度港区配置列表页')
   cr.font.size = Pt(9)
   cr.font.color.rgb = RGBColor(100, 100, 100)
   cr.italic = True
   ```

4. **运行脚本**：
   ```bash
   python .scratch/gen_manual.py
   ```

5. **保存位置**：脚本内部设置输出路径为 `os.path.join(os.environ['USERPROFILE'], 'Desktop', '<模块名>_操作手册.doc')`

### 第六步：验证并报告

- 确认文件已生成到桌面
- 告知用户文件路径和文件大小
- 简要列出手册包含的章节、截图数量

## 手册结构规范

生成的 .doc 必须包含以下完整章节：

1. **封面** — 系统名称 + 模块名称 + 版本 + 日期
2. **目录** — 所有章节的层级列表
3. **模块概述** — 定位、适用角色、业务背景
4. **页面结构与功能菜单** — 表格：页面文件 | 标题 | 功能说明 | 触发方式
5. **页面功能详细说明**（每页配截图，截图居中对齐，下方加灰色斜体图注）：
   - 页面截图（展示完整界面）
   - 布局描述
   - 筛选条件/工具栏按钮表格
   - 字段说明表格
   - 操作按钮表格
   - 联动关系列表
   - 业务校验规则
6. **操作流程指南** — 每个核心操作的分步骤详解（关键确认弹窗配截图）
7. **数据字典** — 数据表字段表格（字段名 | Java属性 | 类型 | 说明），非数据库展示字段单独标注来源
8. **后端 API 接口参考** — 接口表格（方法 | URL | 说明），分"页面路由"和"数据接口"两个子表，关联模块接口单独列出

## 代码扫描深广度要求

- **前端**：文件夹下每个 .html 都要读，不要只看 index
- **后端**：Controller → Service → ServiceImpl → Mapper → Entity 五层全部覆盖
- **字段**：明确标注"必填/非必填/只读"
- **状态值**：枚举映射要完整（如 A=未提交, Y=已受理 等）
- **联动**：参数传递、级联加载、Tab切换都要记录
- **操作流程**：涉及状态变迁的操作要画出完整路径（A→提交→N→受理→Y→申请修改→…）
- **关联接口**：页面引用的外部 API（如 `/user/page`、`/baseDistrict/treeList`）也要记录到 API 章节
- **非数据库字段**：Entity 中 `@TableField(exist = false)` 的展示字段要标注数据来源

## 截图深广度要求

- **主页面**：至少截 1 张全屏
- **筛选条件**：下拉框展开状态必须截
- **弹窗**：每个弹窗（新增/编辑/选择/确认）各截 1 张
- **交互控件**：弹窗内的下拉树/级联选择器要展开后截
- **确认弹窗**：删除确认、状态切换确认等二次确认弹窗也要截
- **截图数量**：一个标准 CRUD 模块通常需要 5-8 张截图

## Python 脚本编写要点

使用 `python-docx` 库，参考模板：

```python
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

SCREENSHOT_DIR = 'screenshots'

def add_img(doc, filename, caption, width=5.2):
    """居中嵌入截图+灰色斜体图注"""
    path = os.path.join(SCREENSHOT_DIR, filename)
    if os.path.exists(path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(path, width=Inches(width))
        cap = doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cr = cap.add_run(caption)
        cr.font.size = Pt(9)
        cr.font.color.rgb = RGBColor(100, 100, 100)
        cr.italic = True
    doc.add_paragraph()

doc = Document()
# 页面设置
for section in doc.sections:
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(3.18)
    section.right_margin = Cm(3.18)
# 设置默认字体
style = doc.styles['Normal']
style.font.name = '宋体'
style.font.size = Pt(12)

# 标题统一用黑体
def H(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for r in h.runs: r.font.name = '黑体'

# 添加封面...
# 添加目录（每项字体 Pt(12)）...
# 逐章节添加内容 + 截图...

# 保存到桌面
desktop = os.path.join(os.environ['USERPROFILE'], 'Desktop')
doc.save(os.path.join(desktop, '模块名_操作手册.doc'))
```

`add_table` 辅助：使用 `doc.add_table(rows, cols, style='Table Grid')`，表头加粗居中，数据行用 Pt(10) 字体。每个表格后加一个空段落。

## 注意事项

- 所有文字使用简体中文
- 技术术语保留英文，附带中文解释
- 生成的 .doc 文件名格式：`<模块中文名>_操作手册.doc`
- 如果 python-docx 或 Pillow 未安装，先用 pip 安装（网络慢时换清华源：`-i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn`）
- 脚本执行完成后告知用户文件路径和文件大小
- 截图前务必先 `browser_resize(1920, 1080)`，否则宽弹窗会被裁切
- 验证码环节需要用户配合，主动截图验证码图片并向用户提问"请输入验证码"
- EasyUI 弹窗关闭后如有遮罩残留，用 `browser_evaluate` 清理
