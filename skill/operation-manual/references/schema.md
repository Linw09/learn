# JSON 数据格式参考

当使用 `scripts/generate_docx.py` 生成手册时，需要准备如下格式的 JSON 数据。

```json
{
  "meta": {
    "systemName": "拖轮项目 CRM 系统",
    "moduleName": "船舶动态管理",
    "version": "V1.0",
    "date": "2026-06-24",
    "templatePath": "templates/business/scheduling/shipDynamic/",
    "controllerClass": "TShipDynamicController",
    "requestMapping": "/shipDynamicApply",
    "description": "模块描述文字...",
    "roles": "代理公司（申报方）、调度人员（受理方）",
    "baseUrl": "http://localhost:8081"
  },
  "screenshots": [
    {"file": "01_list.png", "caption": "图1：船舶动态列表页", "page": "index"},
    {"file": "02_filter.png", "caption": "图2：筛选条件下拉框展开", "page": "index"},
    {"file": "03_add.png", "caption": "图3：新增弹窗", "page": "add"},
    {"file": "04_status_confirm.png", "caption": "图4：状态切换确认弹窗", "flow": "切换状态"}
  ],
  ```
  
  > **截图字段说明**：
  > - `page`：关联到哪个 HTML 页面（不含 .html 后缀），如 `index`、`add`
  > - `flow`：关联到哪个操作流程名称，如 `切换状态`、`删除配置`
  > - 一个截图可以同时有 `page` 和 `flow`，会在对应章节都显示

  ```json
  "pages": [
    {
      "file": "index.html",
      "title": "船舶动态列表",
      "description": "主列表页，展示船舶动态数据...",
      "access": "菜单入口",
      "detailDescription": "更详细的功能描述...",
      "layout": ["上部（70%）：主表格", "下部（30%）：Tab页"],
      "toolbarButtons": [
        {"name": "查询", "function": "条件筛选", "note": "按船舶名称、港区等筛选"}
      ],
      "fields": [
        {"label": "是否受理", "control": "datagrid列", "required": "", "description": "A=未提交(红)、Y=已受理(绿)、N=待受理(蓝)、B=驳回(黄)"}
      ],
      "rowActions": [
        {"name": "提交", "condition": "预报+未提交/驳回", "action": "将受理状态改为待受理(N)"}
      ],
      "interactions": ["点击主列表行 → 下方作业明细自动加载"]
    }
  ],
  "flows": [
    {
      "name": "新增船舶动态",
      "steps": [
        "1. 进入船舶动态列表页面",
        "2. 点击工具栏新增按钮",
        "3. 填写申报信息..."
      ]
    }
  ],
  "tables": [
    {
      "tableName": "船舶动态主表",
      "tableCode": "T_SHIP_DYNAMIC",
      "columns": [
        {"column": "VESSEL_NO", "field": "vesselNo", "type": "VARCHAR(主键)", "comment": "船期编码"}
      ]
    }
  ],
  "apis": [
    {
      "method": "POST",
      "url": "/shipDynamicApply/page",
      "description": "分页查询船舶动态",
      "params": "ShipDynamic 查询参数"
    }
  ],
  "relatedApis": [
    {
      "controller": "TShipDynamicDetController",
      "prefix": "/shipDynamicDet",
      "description": "作业明细的增删改查"
    }
  ]
}
```
