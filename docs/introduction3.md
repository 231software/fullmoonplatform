**第三章 构建系统深度解析（build.ts）**

---

### 3.1 构建系统的设计目标

`build.ts` 是满月平台的核心构建脚本，由 `fullmoonplatform` 提供。它的设计目标可以概括为四点：

1. **编译期依赖注入**：开发时使用空壳契约（fmplib），编译时物理替换为真实实现。
2. **多平台并行构建**：一次构建同时产出多个目标平台的插件包。
3. **特性裁剪与依赖清洗**：根据 `plugin.json` 的配置，移除未启用的可选特性，并清理目标平台不支持的 npm 包。
4. **目录结构即契约**：通过约定的文件夹布局与配置文件（`platform.json`、`fmplib.json`）驱动整个流程，尽量减少硬编码。

它不依赖复杂的外部打包工具，而是利用 Node.js 的文件操作能力，在临时目录中重组项目后直接调用 `tsc`。

---

### 3.2 完整构建流水线

构建过程分为四个阶段。

#### 3.2.1 准备阶段

1. 读取项目根目录的 `plugin.json`，获取插件元数据、构建目标、优先级、特性列表等。
2. 创建最终输出目录（`plugin_conf.build_dir`）。
3. 创建临时工作区 `temp/`，并在其中建立 `temp/libs` 与 `temp/build`。

#### 3.2.2 库整合阶段（层叠覆盖 / 优先级机制）

这是“偷梁换柱”的筹备步骤。

1. 检查 `plugin.json` 中的 `priorities.default`。若未配置，则发出警告，且不会有任何库参与编译。
2. 遍历 `priorities.default` 中列出的第三方库名称（例如 `["LNSDK"]`）。
3. 对每个库：
   - 检查 `libs/<库名>/` 是否存在。
   - 读取该库下的 `libs/` 子目录，得到它支持的所有平台列表。
   - 将这些平台的实现**合并**复制到 `temp/libs/`（使用 `merge: true, skipSameNameFiles: true`）。
4. 根据 `supported_platforms` 的黑名单（`bl`）或白名单（`wl`）模式，过滤最终需要编译的平台集合。

**当前实现**：主要处理 `priorities.default`。  
**设计预期**（未来完整优先级）：按优先级从高到低依次放入库，同名文件跳过，从而实现层叠覆盖。高优先级库可以只提供需要修改的文件，作为补丁覆盖低优先级库的实现。

#### 3.2.3 单平台编译阶段

对每个最终确定的平台，启动一个独立的编译任务（`compile_specified_platform`），流程如下：

1. **环境隔离**  
   在 `temp/build/<platform>/` 创建独立工作目录。

2. **源码与实现注入**  
   - 复制插件源码 `src` → `temp/build/<platform>/src`
   - 复制该平台的真实实现 `temp/libs/<platform>/lib` → `temp/build/<platform>/lib`

3. **配置文件生成**
   - 根据 `platform.json` 的 `compilerOptions` 生成 `tsconfig.json`
   - 写入 `plugin_info.ts`（注入插件元数据、`data_path`、当前平台名）
   - 对 Node.js 类平台动态生成 `package.json`（见 3.3.5）
   - 处理 `FeaturesIndex.ts`（见 3.3.3）
   - 强制覆盖 `lib/index.ts`（目前以 LNSDK 的对应版本为准，作为临时方案）

4. **入口文件生成**  
   动态生成最外层 `index.ts`，导入插件主文件，并根据平台特性决定是否调用 `ScriptDone()`。

5. **钩子执行**  
   - 若存在 `temp/libs/<platform>/scripts/before_compile.js`，则运行它。
   - 调用 `tsc` 进行编译。
   - 若存在 `after_compile.js`，则运行它。

6. **并行**  
   多个平台的编译任务以 Promise 形式并行执行，互不阻塞。

#### 3.2.4 收尾与产物分发

1. 等待所有平台编译任务完成。
2. 将 `temp/build/<platform>/js` 中的编译产物移动到最终输出目录 `build_dir/<platform>/<plugin_dir_name>/`。
3. 清理整个 `temp` 临时目录。
4. 输出“构建完成”日志。

---

### 3.3 关键机制详解

#### 3.3.1 “偷梁换柱”的实际路径与实现

开发时项目结构示意：

```
项目根目录/
├── lib/                  ← fmplib（空壳，仅用于开发时类型提示）
├── libs/
│   └── LNSDK/
│       └── libs/
│           ├── llse/
│           │   ├── platform.json
│           │   └── lib/          ← 真实实现
│           ├── levilamina/
│           │   └── ...
│           └── ...
├── src/                  ← 插件源码
└── plugin.json
```

构建时的关键操作（以某个平台为例）：

```ts
// 把真实实现复制到临时编译环境的 lib 位置
await File.copy(
  "temp/libs/" + platform + "/lib",
  "temp/build/" + platform + "/lib"
);
```

在临时目录中，源码里的：

```ts
import { Player, Logger } from "../lib/index.js";
```

实际解析到的已经是第三方库提供的实现，而不是开发时的空壳。

**要点**：开发用的 `lib` 文件夹本身**不会**进入编译流程。编译只看 `libs` 下第三方库提供的实现。

#### 3.3.2 platform.json 的作用

每个平台目录下必须包含 `platform.json`，它是该平台的“身份证”和特性声明。示例（llse）：

```json
{
    "isNodeJS": true,
    "unsupported_packages": ["sqlite3"],
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
        "target": "es2015",
        "forceConsistentCasingInFileNames": false,
        "moduleResolution": "nodenext",
        "module": "nodenext"
    }
}
```

主要字段含义：

| 字段 | 作用 |
|------|------|
| `isNodeJS` | 是否需要生成 `package.json` |
| `unsupported_packages` | 当前平台不支持的 npm 包，构建时会从依赖中剔除 |
| `features` | 可选特性到 npm 包（或 internal）的映射 |
| `data_path` | 插件数据目录模板，`<data_path>` 会被替换为 `plugin.json` 中的值 |
| `compilerOptions` | 合并进该平台的 `tsconfig.json` |
| `require_ScriptDone` | （部分平台）是否需要在入口调用 `ScriptDone()` |

缺少 `platform.json` 的平台会被直接跳过，不会参与编译。

#### 3.3.3 FeaturesIndex.ts 与可选特性裁剪

第三方库的 `FeaturesIndex.ts` 使用特殊注释标记可选特性区块，例如：

```ts
//sqlite3>>
export {
    FMPSQLite3 as SQLite3,
    // ...
} from "./Features/SQLite3.js"
//sqlite3<<

//yml>>
export {
    YMLFile
} from "./Features/YMLFile.js"
//yml<<
```

构建时的处理逻辑（`writeFeaturesIndex`）：

1. 用正则匹配所有 `//featureName>> ... //featureName<<` 区块。
2. 检查 `plugin.json` 的 `features` 数组是否包含该特性名。
3. 若**未包含**，则将该区块的导出替换undefined，例如：

```ts
export const SQLite3 = undefined
export const SQLDataTypeEnum = undefined
// ...
```

效果：

- 开发时类型定义仍然完整（体验好）。
- 未启用的特性在编译后的代码中变为 `undefined`，避免插件加载时因依赖不全直接报错崩溃，甚至源码无法通过编译。
- 若插件源码强行调用了未启用的特性，运行时会得到明确的错误，而不是静默失败。

#### 3.3.4 动态生成入口文件（index.ts）

构建脚本会为每个平台生成最外层入口：

```ts
import "./${plugin_conf.src_dir}/${plugin_conf.main}.js";
import {ScriptDone} from "./lib/index.js";
${platform_features.require_ScriptDone === true ? "ScriptDone();" : ""}
export function main(){
    ScriptDone();
}
```

这体现了满月平台的职责边界：

- 平台只规定“插件必须有一个入口”。
- 如何通知加载器“脚本已加载完毕”（`ScriptDone`），由第三方库实现。
- 部分平台的开服事件不走普通事件系统，需要显式调用 `ScriptDone()`。

#### 3.3.5 package.json 的依赖清洗

仅当 `platform.json` 中 `isNodeJS: true` 时才会生成。

处理流程：

1. 以 `plugin.json` 的 `dependencies` 为基础。
2. 删除 `unsupported_packages` 中列出的包。
3. 根据 `plugin.json` 的 `features` 与 `platform.json` 的 `features` 映射，自动添加需要的 npm 包（若值为 `internal` 则跳过）。
4. 将结果写入临时目录的 `package.json`（供 `tsc` 识别）以及最终产物目录。

这保证了每个平台的产物只携带它真正需要且支持的依赖。

---

### 3.4 priorities.default 与未来的优先级扩展

**当前行为**：

- 只处理 `priorities.default` 中列出的库。
- 将这些库支持的所有平台实现合并进 `temp/libs`。

<!--

这部分目前还没实现，所以注释掉了

**设计预期的完整优先级逻辑**：

假设配置为：

```json
"priorities": {
  "default": ["LNSDK"]
}
```

构建时会：

1. 先放入高优先级库（`my-patch-lib`）。
2. 再放入 default 库（`LNSDK`），同名文件跳过。

效果是高优先级库可以只包含需要覆盖的文件，作为“补丁”无缝替换 LNSDK 的部分实现，而无需 fork 整个 SDK。这为社区提供了极高的扩展灵活性。

---
-->

### 3.5 本章小结

`build.ts` 是一个**配置驱动的、支持多目标平台的编译流水线编排器**。它的核心能力可以总结为：

- 在临时文件系统中完成库的层叠合并与物理替换（偷梁换柱）。
- 根据 `platform.json` 为每个平台定制编译选项、依赖与数据路径。
- 通过正则处理 `FeaturesIndex.ts`，实现编译期的可选特性裁剪。
- 动态生成入口文件与 `package.json`，保证产物干净、可直接被目标加载器使用。
- 支持并行编译与编译前后钩子，兼顾效率与扩展性。

理解了构建系统的运作方式后，第四章将进入实际的插件开发流程，说明如何正确组织项目、配置 `plugin.json` 以及编写符合规范的代码。