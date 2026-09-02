**第五章 第三方库开发规范**

---

### 5.1 第三方库的定位与基本要求

第三方库是满月平台生态中的**连接器（适配器）**。它的唯一硬性要求是：

> 当插件调用 fmplib 定义的标准 API 时，在真实的服务端加载器上必须产生正确、符合fmplib注释描述的行为。

满月平台**不约束**第三方库的内部实现方式。你可以选择：

- 纯 JavaScript 层面对底层 API 进行转换与封装；
- 自建脚本引擎加载插件源码；
- 调用原生模块；
- 或其他任何能保证行为正确的技术路径。

LNSDK 只是当前最完整、最全面的参考实现，并非强制选项。任何人都可以编写自己的第三方库来替代或补充它。

**基本要求总结**：

1. 实现（或兼容）fmplib 定义的公开接口。
2. 遵循满月平台规定的目录结构与配置文件格式。
3. 每个支持的平台都必须提供 `platform.json`。
4. 保证 `index.ts` 导出的接口能正常工作。
5. （推荐）使用适配器模式组织不同平台的实现。

---

### 5.2 目录结构规范（满月平台格式）

第三方库必须以**文件夹**形式存在，并遵循以下结构：

```
第三方库根目录/
├── fmplib.json                 # 库的元数据（必须）
└── libs/                       # 各平台实现的存放处
    ├── <平台名1>/              # 例如 llse、levilamina、bdsx 等
    │   ├── platform.json       # 该平台的特性声明（必须）
    │   ├── lib/                # 该平台的真实实现代码
    │   │   ├── index.ts        # 统一导出入口
    │   │   ├── FeaturesIndex.ts
    │   │   └── ...             # 其他实现文件
    │   └── scripts/            # 可选：编译钩子
    │       ├── before_compile.js
    │       └── after_compile.js
    ├── <平台名2>/
    │   └── ...
    └── ...
```

**关键点**：

- 库的文件夹名必须与 `fmplib.json` 中的 `name` 一致，也必须与插件 `plugin.json` 的 `priorities` 中填写的名称一致。
- `libs/<平台名>/lib` 是真正被复制到临时编译环境中的实现代码。
- 平台名称应使用社区约定或清晰的标识（如 `llse`、`levilamina` 等）。

---

### 5.3 fmplib.json 与 platform.json

#### 5.3.1 fmplib.json（库级元数据）

示例（LNSDK）：

```json
{
    "name": "LNSDK",
    "author": "Newmoon Minecraft Studio",
    "repository": "https://github.com/231software/LNSDK"
}
```

| 字段 | 说明 |
|------|------|
| `name` | 库名，必须与文件夹名一致 |
| `author` | 作者 |
| `repository` | 仓库地址 |
| `minimum_version` | （可选）对各平台引擎的最低版本要求 |

#### 5.3.2 platform.json（平台级特性声明）

每个平台目录下**必须**包含此文件，否则该平台会被构建系统跳过。

示例（LNSDK 的 llse 平台）：

```json
{
    "isNodeJS": true,
    "unsupported_packages": [
        "sqlite3"
    ],
    "lib": "nolib",
    "features": {
        "yml": ["yaml", "^2.5.1"],
        "xml": ["xml", "^1.0.1"],
        "ws": ["ws", "8.18.0"],
        "sqlite3": ["internal", ""],
        "pluginevent": ["internal", ""]
    },
    "data_path": "plugins/<data_path>",
    "compilerOptions": {
        "target": "es2016",
        "forceConsistentCasingInFileNames": false,
        "moduleResolution": "nodenext",
        "module": "nodenext"
    }
}
```

主要字段说明：

| 字段 | 作用 |
|------|------|
| `isNodeJS` | 是否为 Node.js 环境。为 `true` 时构建系统会生成 `package.json`。 |
| `unsupported_packages` | 当前平台不支持的 npm 包列表，构建时会从插件依赖中剔除。 |
| `features` | 可选特性映射。键为特性名，值为 `[包名, 版本]` 或 `["internal", ""]`（表示平台内建，无需额外安装）。 |
| `data_path` | 数据目录模板。`<data_path>` 会被替换为插件 `plugin.json` 中的值。 |
| `compilerOptions` | 合并进该平台的 `tsconfig.json`。 |
| `require_ScriptDone` | （可选）是否需要在入口文件中调用 `ScriptDone()`。 |

---

### 5.4 index.ts 导出契约

插件源码统一通过 `import { ... } from "../lib/index.js"` 导入接口。因此第三方库的 `lib/index.ts` **必须**正确导出所有公开 API。

**最低要求**：

- 导出的名称与 fmplib 的 `index.ts` 保持一致（或至少兼容）。
- 如果当前平台不存在服务器启动完毕事件，那么必须导出 `ScriptDone`（用于通知脚本服务器已加载完毕）。

**推荐做法**：

- 尽量保持与 fmplib 相似的内部文件组织，降低维护成本。
- 即使内部文件结构有差异，只要最终通过 `index.ts` 正确重导出，编译也能通过。
- 但随意破坏内部路径并强行重导出，虽然技术上可行，但会导致同时使用了其他库与您的库合并进行编译时，其中一些库的部分代码失效或编译失败。

`FeaturesIndex.ts` 中的可选特性必须使用约定标记：

```ts
//featureName>>
export {
    // ...
} from "./Features/SomeFeature.js"
//featureName<<
```

构建系统会根据插件是否启用该特性，决定保留导出还是替换为 `undefined`。

---

### 5.5 适配器模式实现要求

第三方库应针对每个支持的平台提供独立的实现，放在对应的 `libs/<平台名>/lib` 下。

实现时需注意：

1. **行为正确性优先**：接口的最终行为必须与契约语义一致。
2. **同步 / 异步语义**：严格遵守 fmplib 对每个 API 的同步/异步定义。
3. **可选特性**：仅在平台真正支持时提供实现，并在 `platform.json` 的 `features` 中正确声明。
4. **错误处理**：对于平台无法支持的标准 API，应给出明确、可预测的失败行为，而不是静默忽略。

满月平台不检查你的实现细节，只通过最终运行时行为来判断库是否合格。

---

### 5.6 before_compile.js / after_compile.js 钩子

这两个文件是**可选的**，位于 `libs/<平台名>/scripts/` 下。

构建系统会在以下时机调用它们：

- `before_compile.js`：在执行 `tsc` **之前**。
- `after_compile.js`：在执行 `tsc` **之后**。

脚本会接收插件的完整元数据（通过 base64 编码的命令行参数传入）。

**什么情况下才应该编写这两个文件？**

只在以下需求无法通过普通实现或 `platform.json` 配置满足时，才考虑使用钩子：

| 场景 | 推荐使用的钩子 | 说明 |
|------|----------------|------|
| 需要在编译前修改 `package.json` 或其他配置文件（例如强制添加 `"type": "module"`） | `before_compile.js` | 必须在 `tsc` 运行前生效 |
| 需要为特定加载器生成额外的清单文件（如 `manifest.json`） | `after_compile.js` | 依赖编译产物已经生成 |
| 需要根据插件元数据动态调整文件内容或目录结构 | 按时机选择 | 普通静态实现无法覆盖的动态需求 |
| 需要执行平台特有的后处理（压缩、注入、校验等） | `after_compile.js` | 编译完成后的额外步骤 |

**不建议**的使用方式：

- 用钩子完成本应在 `lib` 实现代码中完成的逻辑。
- 用钩子绕过满月平台的目录与导出规范。
- 在没有明确平台差异需求时随意添加钩子，增加维护成本。

钩子是“最后的逃逸通道”，而不是常规实现手段。能通过普通适配器代码解决的问题，就不要放到钩子里。

---

### 5.7 如何正确成为“优先级库”或补丁库

构建系统支持通过 `priorities` 实现库的层叠覆盖（当前以 `default` 为主，未来会支持更完整的优先级）。

**成为完整第三方库**：

- 提供尽可能完整的平台实现。
- 在插件的 `priorities.default` 中列出你的库名。

**成为补丁 / 增强库**：

1. 只实现你需要覆盖或增强的文件。
2. 保持 `index.ts` 导出兼容。
3. 在插件的 `priorities` 中把你的库放在更高优先级的位置。
4. 构建时同名文件会被高优先级库覆盖，其余文件仍使用低优先级库（如 LNSDK）的实现。

这种机制允许社区在不 fork 整个 LNSDK 的情况下，针对特定平台或特定 API 进行修复与增强。

---

### 5.8 本章小结

编写第三方库的核心原则是：

1. **行为正确**：保证 fmplib 接口在真实平台上表现正确。
2. **结构合规**：遵循 `fmplib.json` + `libs/<平台>/platform.json` + `lib/` 的目录约定。
3. **导出兼容**：通过 `index.ts` 正确导出所有公开 API，并实现 `ScriptDone`。
4. **特性声明清晰**：在 `platform.json` 和 `FeaturesIndex.ts` 中准确描述可选特性。
5. **钩子克制使用**：仅在静态实现无法满足的特殊编译需求时才编写 `before_compile.js` / `after_compile.js`。

满足以上要求的库，即可被任何满月平台插件通过 `priorities` 引用，并参与多平台构建。

下一章将讨论兼容性策略、可选特性的使用代价以及开发中的最佳实践与常见陷阱。