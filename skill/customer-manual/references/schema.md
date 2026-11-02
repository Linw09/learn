# JSON 数据格式参考

当使用 `scripts/generate_docx.py` 生成 .doc 手册时，把填好的模板内容整理为如下格式的 JSON。

```json
{
  "meta": {
    "systemName": "智慧港云平台",
    "moduleName": "车辆进港申请",
    "version": "V1.0",
    "date": "2026-08-10",
    "roles": "申报方（代理公司）"
  },
  "content": [
    {"type": "h1", "text": "一、车辆进港申请操作手册（申报方）"},
    {"type": "h2", "text": "1. 车辆进港申请"},
    {"type": "h3", "text": "1.1 新增"},
    {"type": "para", "text": "操作路径：进港管理 → 车辆进港申请 → 点击【添加】→ 输入车牌号（黄色选框为必填项）→ 点击【保存】。"},
    {"type": "warning", "text": "审批记录中有\"审批中\"或\"驳回\"时不可删除，需先【取消申请】。"},
    {"type": "note", "text": "每个车牌号只能申报一次。"},
    {"type": "list", "items": ["选项一", "选项二"]},
    {"type": "table", "headers": ["按钮", "说明"], "rows": [["【提交】", "发起审批"], ["【取消】", "关闭弹窗"]]},
    {"type": "image", "path": "screenshots/01_main.png", "caption": "图1：车辆进港申请列表页", "width": 5.2}
  ]
}
```

## 内容节点类型

| type | 用途 | 必填字段 |
|------|------|---------|
| `h1` | 一级标题 `一、XXX操作手册（角色）` | text |
| `h2` | 二级标题 `1. 功能名` | text |
| `h3` | 三级标题 `1.1 子功能名` | text |
| `para` | 普通正文 | text |
| `warning` | ⚠️ 硬约束（自动加粗标红） | text |
| `note` | 【注意】操作细节（自动加粗） | text |
| `list` | ⚫ 列表项 | items |
| `table` | 表格 | headers, rows |
| `image` | 居中截图+灰色斜体图注 | path, caption（可选 width） |

## 对应关系

- `h1/h2/h3` 自动生成目录
- `warning` 对应写作惯例中的 ⚠️ 硬约束
- `note` 对应写作惯例中的 【注意】
- `list` 对应写作惯例中的 ⚫ 列表
- `image` 的 path 相对当前工作目录（`screenshots/` 下）
