**第四章 插件开发指南**

---

### 4.1 项目结构规范

一个标准的满月平台插件项目应遵循以下目录结构：

```
项目根目录/
├── lib/                          # 参考契约（通常通过 git submodule 引入 fmplib）
│   └── index.ts                  # 所有公开 API 的统一导出入口
├── libs/                         # 第三方库存放处
│   └── LNSDK/                    # 示例：当前最推荐的适配器
│       ├── fmplib.json
│       └── libs/
│           ├── llse/
│           ├── levilamina/
│           └── ...
├── src/                          # 插件源码（唯一允许放置业务代码的目录）
│   └── index.ts                  # 主入口文件（文件名可在 plugin.json 中配置）
├── package.json                  # Node.js 项目配置（用于安装构建依赖）
├── plugin.json                   # 插件元数据与构建配置（核心）
├── tsconfig.json                 # 可选，开发时辅助
└── dist/                         # 构建产物输出目录（由 plugin.json 指定）
```

**关键约束**：

- 所有业务代码**必须**放在 `src`（或 `plugin.json` 中 `src_dir` 指定的目录）内。该目录外的源代码不会被编译。
- 引用除参考库（`lib`）以外、且不位于 `src` 中的代码，会导致编译失败。
- `lib` 仅用于开发时的类型提示与注释，**不会**进入最终编译产物。
- `libs` 中放置的第三方库必须符合满月平台格式规范。

推荐使用官方模板仓库 [fmp_plugin_template](https://github.com/231software/fmp_plugin_template) 快速创建项目。

---

### 4.2 plugin.json 完整配置说明

`plugin.json` 是插件的元数据与构建配置中心。以下是完整字段说明，结合官方示例：

```json
{
    "name": "Full Moon Platform plugin example",
    "main": "index",
    "description": "A plugin developed with Full Moon Platform.",
    "build_dir": "dist",
    "data_path": "fmp_plugin_example",
    "src_dir": "src",
    "plugin_dir_name": "fmp_plugin_example",
    "supported_platforms": {
        "mode": "bl",
        "list": []
    },
    "permissionRoot": "fmppluginexample",
    "features": [],
    "priorities": {
        "default": [
            "LNSDK"
        ]
    }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 插件名。只能包含英文字母、数字和下划线。 |
| `main` | string | 入口文件名（不带后缀）。例如 `"index"` 对应 `src/index.ts`。 |
| `description` | string | 插件描述，会显示在加载器的插件列表中。 |
| `build_dir` | string | 构建产物输出根目录。 |
| `data_path` | string | 插件运行时数据存储文件夹名。不能以 `/` 或 `\` 开头或结尾。构建时会根据平台特性替换为完整路径。 |
| `src_dir` | string | 源码目录名，默认为 `"src"`。 |
| `plugin_dir_name` | string | 最终插件包在输出目录中的文件夹名。 |
| `supported_platforms` | object | 控制编译哪些平台。<br>`mode`: `"bl"`（黑名单）或 `"wl"`（白名单）<br>`list`: 平台名称数组。 |
| `permissionRoot` | string | 插件默认权限节点根。 |
| `features` | string[] | 要启用的可选特性列表（对应 FeaturesIndex 中的标记）。空数组表示不启用任何可选特性。 |
| `priorities` | object | 第三方库优先级。目前主要使用 `default` 数组，列出要参与编译的库名（顺序有意义，未来支持更完整的层叠覆盖）。 |
| `dependencies` | object | （可选）需要的 npm 包。构建时会根据平台的 `unsupported_packages` 自动清洗。 |
| `files` | string[] | （可选）额外需要编译的文件列表。 |

**建议**：

- 新项目先保持 `supported_platforms.mode` 为 `"bl"` 且 `list` 为空，编译所有第三方库支持的平台。
- `features` 只添加真正需要的特性，以最大化跨平台兼容性。

---

### 4.3 开发时如何正确引用接口

**正确方式**（必须遵守）：

```ts
import {
    Logger,
    Player,
    Command,
    InitEvent,
    // ... 其他需要的接口
} from "../lib/index.js";
```

所有公开 API 都通过 `lib/index.ts` 统一导出。不要直接引用 `lib` 内部的具体文件路径（例如 `../lib/Game/Player.js`），否则在构建替换后可能失效或导致插件编译失败。

开发时 `lib` 是空壳，IDE 会提供完整的类型提示与注释。真正的实现会在构建时由第三方库注入。

---

### 4.4 入口约定与生命周期

满月平台规定插件必须提供一个入口，但**不负责**具体的加载逻辑。

- 入口文件由 `plugin.json` 的 `main` 字段指定（相对于 `src_dir`）。
- 构建时会自动生成最外层 `index.ts`，导入你的主文件，并根据平台特性决定是否调用 `ScriptDone()`。
- 常见的生命周期事件（如初始化、禁用）通过契约中的事件 API 注册，例如：

```ts
import { InitEvent, DisableEvent, Logger } from "../lib/index.js";

InitEvent.on(() => {
    Logger.info("插件已加载");
});

DisableEvent.on(() => {
    Logger.info("插件已卸载");
});
```

具体有哪些生命周期事件、如何注册，取决于当前使用的第三方库实现的契约。平台本身不定义完整的事件系统。

---

### 4.5 同步 / 异步 API 使用原则

契约中的 API 同步或异步由**其设计目的**决定，而不是统一强制：

- **同步**：需要阻塞游戏主线程以拦截事件、或本身是 CPU 密集型且异步无意义的操作。绝大多数与游戏世界直接交互的 API 属于此类。
- **异步**：文件读写、网络请求、UI 相关等 IO 操作。

开发时请留意API中各函数是否被async修饰。错误地将同步 API 当作异步使用（或反之）会导致极其隐蔽的逻辑错误，排查需花费大量时间。

---

### 4.6 数据路径、权限节点与其他运行时约定

**data_path**  
构建时会根据平台的 `platform.json` 中的 `data_path` 模板进行替换。例如模板为 `plugins/<data_path>`，而 `plugin.json` 中 `data_path` 为 `fmp_plugin_example`，则最终运行时读取到的路径以llse为例就是 `plugins/fmp_plugin_example`。

在代码中可通过契约提供的方式获取当前数据路径（具体导出名称以 `lib/index.ts` 为准）。

**permissionRoot**  
插件的默认权限节点根。具体权限检查 API 由fmplib和第三方库实现。

**其他约定**：

- 插件名称、描述等元数据会在构建时注入到 `plugin_info.ts`，供运行时读取。
- 不要依赖开发时 `lib` 中的任何运行时逻辑，它们在最终产物中不存在。

---

### 4.7 编译与多平台产物选择

1. 确保已安装构建依赖（通常通过 `package.json` 中的脚本）。
2. 将需要的第三方库（如 LNSDK）正确放置在 `libs/` 下。
3. 运行构建命令（一般为 `npm run build` 或直接执行 `build.ts`）。
4. 构建完成后，在 `build_dir`（示例中为 `dist`）下会生成按平台分类的文件夹：

```
dist/
├── llse/
│   └── fmp_plugin_example/
├── levilamina/
│   └── fmp_plugin_example/
└── ...
```

用户（服主）需要根据自己的服务端类型选择对应平台的插件包安装，就像下载软件时选择 Windows / macOS / Android 版本一样。

**兼容性提醒**：

- 仅使用标准 API → 理论上可在所有支持的平台运行。
- 启用了 `features` 中的可选特性 → 可能无法在不支持该特性的平台上运行，需自行承担兼容性风险。

---

### 4.8 本章小结

插件开发的核心流程可以简化为：

1. 使用官方模板或按规范创建项目结构。
2. 正确配置 `plugin.json`。
3. 在 `src` 中编写代码，统一从 `../lib/index.js` 导入接口。
4. 将第三方库放入 `libs`，配置好 `priorities`。
5. 运行构建，获得多平台产物。
6. 按目标服务端选择对应版本分发。

开发者只需关注业务逻辑与契约接口，平台差异、依赖清洗、特性裁剪均由构建系统自动处理。

下一章将说明如何编写符合规范的第三方库（适配器），供有需要扩展或替换 LNSDK 的开发者参考。