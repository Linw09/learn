"""
操作手册 .doc 生成器（支持截图嵌入）
用法: python generate_docx.py <data.json>
读取结构化 JSON 数据，生成格式化的 .doc 操作手册文件到桌面。
"""
import json
import os
import sys
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT


def create_manual(data):
    """根据结构化数据生成操作手册 .doc 文件"""
    doc = Document()

    # ── 页面设置 ──
    for section in doc.sections:
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(3.18)
        section.right_margin = Cm(3.18)

    style = doc.styles['Normal']
    style.font.name = '宋体'
    style.font.size = Pt(12)

    # ── 辅助函数 ──
    def add_heading_styled(text, level=1):
        h = doc.add_heading(text, level=level)
        for run in h.runs:
            run.font.name = '黑体'
        return h

    def add_table(headers, rows):
        """添加格式化表格"""
        table = doc.add_table(rows=1 + len(rows), cols=len(headers), style='Table Grid')
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, h in enumerate(headers):
            cell = table.rows[0].cells[i]
            cell.text = h
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.bold = True
                    run.font.size = Pt(10)
        for r, row in enumerate(rows):
            for c, val in enumerate(row):
                cell = table.rows[r + 1].cells[c]
                cell.text = str(val) if val is not None else ''
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.font.size = Pt(10)
        doc.add_paragraph()
        return table

    def add_img(filename, caption, width=5.2):
        """居中嵌入截图+灰色斜体图注"""
        if os.path.exists(filename):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(filename, width=Inches(width))
            cap = doc.add_paragraph()
            cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cr = cap.add_run(caption)
            cr.font.size = Pt(9)
            cr.font.color.rgb = RGBColor(100, 100, 100)
            cr.italic = True
            doc.add_paragraph()

    # ═══════════════════════════════════════
    # 封面
    # ═══════════════════════════════════════
    meta = data.get('meta', {})
    doc.add_paragraph()
    doc.add_paragraph()
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(meta.get('systemName', 'CRM 系统'))
    run.font.size = Pt(28)
    run.bold = True
    run.font.name = '黑体'

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run(f"{meta.get('moduleName', '模块')} — 操作手册")
    run.font.size = Pt(22)
    run.font.name = '黑体'

    doc.add_paragraph()
    info = doc.add_paragraph()
    info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = info.add_run(f"版本：{meta.get('version', 'V1.0')}　　日期：{meta.get('date', '')}")
    run.font.size = Pt(12)

    doc.add_page_break()

    # ═══════════════════════════════════════
    # 目录
    # ═══════════════════════════════════════
    add_heading_styled('目  录', level=1)
    toc_items = [
        '1. 模块概述',
        '2. 功能菜单与页面结构',
    ]
    pages = data.get('pages', [])
    for i, page in enumerate(pages):
        toc_items.append(f"    2.{i+1} {page.get('title', '')}（{page.get('file', '')}）")
    toc_items.append('3. 页面功能详细说明')
    for i, page in enumerate(pages):
        toc_items.append(f"    3.{i+1} {page.get('title', '')}")
    toc_items.append('4. 操作流程指南')
    flows = data.get('flows', [])
    for i, flow in enumerate(flows):
        toc_items.append(f"    4.{i+1} {flow.get('name', '')}")
    toc_items.append('5. 数据字典')
    tables = data.get('tables', [])
    for i, t in enumerate(tables):
        toc_items.append(f"    5.{i+1} {t.get('tableName', '')}（{t.get('tableCode', '')}）")
    toc_items.append('6. 后端 API 接口参考')

    for item in toc_items:
        p = doc.add_paragraph(item)
        for run in p.runs:
            run.font.size = Pt(12)
    doc.add_page_break()

    # ═══════════════════════════════════════
    # 1. 模块概述
    # ═══════════════════════════════════════
    add_heading_styled('1. 模块概述', level=1)
    doc.add_paragraph(meta.get('description', '（待补充）'))
    if meta.get('roles'):
        doc.add_paragraph(f"适用角色：{meta.get('roles')}")

    # ═══════════════════════════════════════
    # 2. 功能菜单与页面结构
    # ═══════════════════════════════════════
    add_heading_styled('2. 功能菜单与页面结构', level=1)
    doc.add_paragraph(f"本模块位于 {meta.get('templatePath', 'templates/')} 目录下，包含以下前端页面：")
    add_table(
        ['页面文件', '页面标题', '功能说明', '访问方式'],
        [[p.get('file', ''), p.get('title', ''), p.get('description', ''), p.get('access', '')] for p in pages]
    )

    # ═══════════════════════════════════════
    # 3. 页面功能详细说明
    # ═══════════════════════════════════════
    add_heading_styled('3. 页面功能详细说明', level=1)

    for i, page in enumerate(pages):
        add_heading_styled(f"3.{i+1} {page.get('title', '')}（{page.get('file', '')}）", level=2)
        doc.add_paragraph(page.get('detailDescription', page.get('description', '')))

        # 页面截图（匹配 screenshots 数据中的 page 字段）
        screenshots = data.get('screenshots', [])
        page_file = page.get('file', '')
        matched = [s for s in screenshots if s.get('page') == page_file.replace('.html', '') or s.get('page') == page_file]
        for s in matched:
            add_img(s['file'], s.get('caption', ''))

        # 页面布局
        if page.get('layout'):
            add_heading_styled('页面布局', level=3)
            for item in page['layout']:
                doc.add_paragraph(f"• {item}")

        # 工具栏按钮
        if page.get('toolbarButtons'):
            add_heading_styled('工具栏按钮', level=3)
            add_table(
                ['按钮', '功能', '说明'],
                [[b.get('name', ''), b.get('function', ''), b.get('note', '')] for b in page['toolbarButtons']]
            )

        # 列表/表单字段
        if page.get('fields'):
            add_heading_styled('字段说明', level=3)
            add_table(
                ['字段', '类型/控件', '必填', '说明'],
                [[f.get('label', ''), f.get('control', ''), f.get('required', ''), f.get('description', '')] for f in page['fields']]
            )

        # 操作按钮
        if page.get('rowActions'):
            add_heading_styled('操作按钮', level=3)
            add_table(
                ['按钮', '触发条件', '行为'],
                [[a.get('name', ''), a.get('condition', ''), a.get('action', '')] for a in page['rowActions']]
            )

        # 联动关系
        if page.get('interactions'):
            add_heading_styled('联动关系', level=3)
            for item in page['interactions']:
                doc.add_paragraph(f"• {item}")

    doc.add_page_break()

    # ═══════════════════════════════════════
    # 4. 操作流程指南
    # ═══════════════════════════════════════
    add_heading_styled('4. 操作流程指南', level=1)
    for i, flow in enumerate(flows):
        add_heading_styled(f"4.{i+1} {flow.get('name', '')}", level=2)
        for j, step in enumerate(flow.get('steps', [])):
            doc.add_paragraph(f"{j+1}. {step}")
        # 流程配图
        flow_screenshots = data.get('screenshots', [])
        flow_name = flow.get('name', '')
        matched = [s for s in flow_screenshots if s.get('flow') == flow_name]
        for s in matched:
            add_img(s['file'], s.get('caption', ''), width=4.5)

    doc.add_page_break()

    # ═══════════════════════════════════════
    # 5. 数据字典
    # ═══════════════════════════════════════
    add_heading_styled('5. 数据字典', level=1)
    for i, t in enumerate(tables):
        add_heading_styled(f"5.{i+1} {t.get('tableName', '')}（{t.get('tableCode', '')}）", level=2)
        add_table(
            ['字段名', 'Java属性', '类型', '说明'],
            [[c.get('column', ''), c.get('field', ''), c.get('type', ''), c.get('comment', '')] for c in t.get('columns', [])]
        )

    doc.add_page_break()

    # ═══════════════════════════════════════
    # 6. 后端 API 接口参考
    # ═══════════════════════════════════════
    add_heading_styled('6. 后端 API 接口参考', level=1)
    apis = data.get('apis', [])
    if apis:
        doc.add_paragraph(f"接口挂载在 {meta.get('controllerClass', 'Controller')}（{meta.get('requestMapping', '/')}）下：")
        add_table(
            ['方法', 'URL', '说明', '参数'],
            [[a.get('method', ''), a.get('url', ''), a.get('description', ''), a.get('params', '')] for a in apis]
        )

    related = data.get('relatedApis', [])
    if related:
        add_heading_styled('关联模块接口', level=2)
        add_table(
            ['Controller', 'URL前缀', '说明'],
            [[r.get('controller', ''), r.get('prefix', ''), r.get('description', '')] for r in related]
        )

    # ── 保存 ──
    desktop = os.path.join(os.environ.get('USERPROFILE', os.path.expanduser('~')), 'Desktop')
    module_name = meta.get('moduleName', '模块')
    output_path = os.path.join(desktop, f'{module_name}_操作手册.doc')
    doc.save(output_path)
    return output_path


def main():
    if len(sys.argv) < 2:
        print("用法: python generate_docx.py <data.json>")
        sys.exit(1)

    json_path = sys.argv[1]
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    output = create_manual(data)
    print(f'操作手册已生成：{output}')


if __name__ == '__main__':
    main()
