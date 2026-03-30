# QMD 使用指南

## ✅ 安装完成

**@tobilu/qmd** 已成功安装并配置，支持中文搜索！

---

## 📦 已安装组件

| 组件 | 模型 | 大小 | 状态 |
|------|------|------|------|
| **嵌入模型** | Qwen3-Embedding-0.6B-Q8_0 | 639MB | ✅ 已下载 |
| **重排序模型** | Qwen3-Reranker-0.6B-Q8_0 | 640MB | ✅ 已下载 |
| **查询扩展** | qmd-query-expansion-1.7B-Q4_K_M | 1.28GB | ✅ 已下载 |

---

## 📚 已索引集合

| 集合 | 路径 | 文件数 | 状态 |
|------|------|--------|------|
| **workspace** | `~/.openclaw/workspace` | 25 个 | ✅ 已索引 |
| **memory** | `~/.openclaw/workspace/memory` | 0 个 | ⏳ 待创建 |

---

## 🔍 搜索命令

### 基础搜索（关键词）

```bash
# 搜索关键词
qmd search "配置" -c workspace -n 5

# 搜索并显示完整内容
qmd search "OpenClaw" --full

# 输出 JSON 格式
qmd search "模型" --json
```

### 语义搜索（向量）

```bash
# 语义搜索（理解意图）
qmd vsearch "如何切换模型" -c workspace

# 语义搜索 + 输出文件列表
qmd vsearch "心跳配置" --files
```

### 混合搜索（最佳质量）

```bash
# ⚠️ 注意：query 命令在 M1 上可能崩溃，建议使用 search 或 vsearch
qmd query "OpenClaw 配置" -c workspace -n 5
```

---

## 📝 常用场景

### 1. 搜索工作空间文档

```bash
# 搜索所有 Markdown 文件
qmd search "SSH" -c workspace

# 搜索特定主题
qmd search "网络配置" -c workspace
```

### 2. 搜索记忆文件

```bash
# 搜索历史对话（当 memory 目录有文件时）
qmd search "模型切换" -c memory

# 搜索特定日期的记忆
qmd multi-get "memory/2026-03*.md"
```

### 3. 获取具体文档

```bash
# 通过路径获取
qmd get "workspace/tools.md" --full

# 通过 docid 获取（从搜索结果中获取 #xxxxxx）
qmd get "#58b7a9" --full

# 获取特定行范围
qmd get "workspace/tools.md:46" -l 20
```

### 4. 批量获取文档

```bash
# 通过通配符获取多个文件
qmd multi-get "workspace/*.md" --json

# 限制文件大小
qmd multi-get "workspace/**/*.md" --max-bytes 20480
```

---

## 🎯 在 OpenClaw 中使用

我（贾维斯）现在可以直接使用 QMD 搜索你的文档：

**你可以这样问我：**

- "帮我搜索一下关于 SSH 配置的文档"
- "找找之前关于模型切换的讨论"
- "搜索工作空间里所有关于心跳的内容"
- "帮我找到 TOOLS.md 里的 NAS 配置"

**我会使用：**

```bash
qmd search "<你的关键词>" -c workspace -n 5
qmd vsearch "<你的问题>" -c workspace
qmd get "<文件路径>" --full
```

---

## 🔄 更新索引

当工作空间文件变更时，需要更新索引：

```bash
# 重新扫描文件
qmd update

# 重新生成向量嵌入
qmd embed

# 强制重新嵌入所有文件
qmd embed -f
```

---

## ⚙️ 配置选项

### 环境变量

```bash
# 使用不同的嵌入模型（默认已配置中文模型）
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"

# 禁用 GPU 加速（如果遇到兼容性问题）
export QMD_NO_METAL=1
```

### 数据位置

| 类型 | 路径 |
|------|------|
| **索引数据库** | `~/.cache/qmd/index.sqlite` |
| **模型缓存** | `~/.cache/qmd/models/` |
| **配置文件** | `~/.config/qmd/config.yml` |

---

## ⚠️ 注意事项

### M1 兼容性

- `qmd search` 和 `qmd vsearch` 工作正常 ✅
- `qmd query`（混合搜索）在 M1 上可能崩溃 ⚠️
- 建议优先使用 `search`（关键词）或 `vsearch`（语义）

### 性能优化

- 首次搜索需要加载模型（约 5-10 秒）
- 后续搜索会复用已加载的模型
- 可以使用 HTTP 模式运行 MCP Server 避免重复加载：

```bash
# 后台运行 MCP Server
qmd mcp --http --daemon

# 停止服务
qmd mcp stop
```

---

## 📖 更多信息

- **官方文档**: https://github.com/tobi/qmd
- **NPM 包**: https://www.npmjs.com/package/@tobilu/qmd
- **本地状态**: `qmd status`

---

**最后更新**: 2026-03-21
**版本**: qmd 2.0.1
