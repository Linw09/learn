"""
客户手册 .doc 生成器（模板A-F产物渲染）
用法: python generate_docx.py <data.json>
读取流式内容 JSON，渲染为智慧港云平台风格的操作手册 .doc 到桌面。
内容节点类型: h1/h2/h3/para/warning/note/list/table/image
"""
import json
import os
import sys
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT


def create_manual(data):
    """根据流式内容生成操作手册 .doc 文件"""
    doc = Document()
    meta = data.get('meta', {})

    # ── 页面设置与默认字体 ──
    for section in doc.sections:
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(3.18)
        section.right_margin = Cm(3.18)
    style = doc.styles['Normal']
    style.font.name = '宋体'
    style.font.size = Pt(12)

    # ── 辅助函数 ──
    def heading(text, level):
        h = doc.add_heading(text, level=level)
        for run in h.runs:
            run.font.name = '黑体'
        return h

    def para(text, bold=False, size=12, color=None, align=None):
        p = doc.add_paragraph()
        if align:
            p.alignment = align
        run = p.add_run(text)
        run.bold = bold
        run.font.size = Pt(size)
        if color:
            run.font.color.rgb = color
        return p

    def add_table(headers, rows):
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

    def add_img(path, caption, width=5.2):
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

    # ═══════════════════════════════════════
    # 封面
    # ═══════════════════════════════════════
    doc.add_paragraph()
    doc.add_paragraph()
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(meta.get('systemName', '系统'))
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
    run = info.add_run(
        f"适用角色：{meta.get('roles', '')}\n"
        f"版本：{meta.get('version', 'V1.0')}　日期：{meta.get('date', '')}"
    )
    run.font.size = Pt(12)
    doc.add_page_break()

    # ═══════════════════════════════════════
    # 目录（自动收集标题节点）
    # ═══════════════════════════════════════
    content = data.get('content', [])
    heading_nodes = [n for n in content if n.get('type') in ('h1', 'h2', 'h3')]
    if heading_nodes:
        heading('目  录', level=1)
        for n in heading_nodes:
            indent = {1: '', 2: '    ', 3: '        '}.get({'h1': 1, 'h2': 2, 'h3': 3}[n['type']], '')
            p = doc.add_paragraph(f"{indent}{n['text']}")
            for run in p.runs:
                run.font.size = Pt(12)
        doc.add_page_break()

    # ═══════════════════════════════════════
    # 内容节点渲染
    # ═══════════════════════════════════════
    for n in content:
        t = n.get('type')
        if t == 'h1':
            heading(n.get('text', ''), level=1)
        elif t == 'h2':
            heading(n.get('text', ''), level=2)
        elif t == 'h3':
            heading(n.get('text', ''), level=3)
        elif t == 'para':
            para(n.get('text', ''))
        elif t == 'warning':
            # ⚠️ 硬约束：加粗标红，保持醒目
            para(f"⚠️ {n.get('text', '')}", bold=True, color=RGBColor(200, 30, 30))
        elif t == 'note':
            # 【注意】：操作细节，加粗
            para(f"【注意】：{n.get('text', '')}", bold=True)
        elif t == 'list':
            for item in n.get('items', []):
                p = doc.add_paragraph(item)
                for run in p.runs:
                    run.font.size = Pt(12)
        elif t == 'table':
            add_table(n.get('headers', []), n.get('rows', []))
        elif t == 'image':
            add_img(n.get('path', ''), n.get('caption', ''), width=n.get('width', 5.2))

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

    with open(sys.argv[1], 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    output = create_manual(data)
    print(f'操作手册已生成：{output}')


if __name__ == '__main__':
    main()
