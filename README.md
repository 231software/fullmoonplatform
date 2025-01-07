# 满月平台

满月平台是一套适用于javascript的抽象层、开发规范和相关开发工具链的集合。

随着mc社区的发展，出现越来越多的插件加载器。然而不同加载器的插件并不通用，为了一个功能，服主们必须在不同的加载器选择不同的插件。你是否想过，有没有一种方法可以一劳永逸，编写一套代码就能在所有插件加载器上运行？

满月平台的出现，就是为了实现这种看似“难以实现”的梦想。通过typescript的特性，满月平台理论上可用一套代码编译至几乎所有支持javascript语言的加载器的格式，甚至不限于基岩版或java版。通过满月平台开发的插件可以毫不费力地同时兼容各主流插件加载器，为服主和开发者们带来不止以下几点优势：

1. 服主更换服务端时，可以不更换通过满月平台开发的插件，直接将配置文件和数据库迁移至新服务端，并为玩家保留先前的操作习惯，节省了大量适应新服务端的时间和精力。
2. 当服务端的接口发生更新时，开发者无需修改原代码，只需要拉取满月平台的最新源码并进行编译，即可适配插件加载器的最新版本。服主甚至可以尝试自行适配早已停更的插件，而无需拥有任何开发经验。
3. 通过同时兼容多个插件加载器或服务端，开发者们可以收获更多的用户和支持。
4. 对于同时采用了多个服务端，甚至是同时运营基岩版和java版服务器的服务器来说，可以通过满月平台开发的插件统一各服务端游戏体验，并降低插件管理的难度。对于支持跨服数据同步的满月平台插件，甚至可以做到在基岩版和java版间同步部分游戏数据。
5. 由于满月平台甚至可以通过nodejs模拟少量mc服务端行为，开发者可以无需任何mc服务端，在任何可以安装nodejs的计算机上调试插件的部分功能。

## 使用方法

如果第一次接触满月平台，建议前往 github.com/231software/fmp_plugin_template ，根据指引创建插件。

在插件顶部引入满月平台提供的模块，开始你“一劳永逸”的编程吧。

```ts
import {
    Logger,
    Player,
    Command
    //...
} from "../lib/index.js";
```

### 了解满月平台提供的接口

打开`lib/index.ts`，你将发现这个文件将所有满月平台的模块整理到其中。也就是说，要调用任何满月平台的接口，你都需要从该文件中将对应的模块导入。

再查看各个具体的模块代码文件，例如`lib/File.ts`、`lib/Events/Process.ts`，你会发现这些文件中，大部分函数、方法等竟然都是空的。不要担心，稍后进行编译时，满月平台的构建工具会自动地将它们补充好。

而在每个类、函数和变量上几乎都有它们对应的注释，标注了它们的基本使用方法，其中不少还标注了其文档链接。要了解它们的具体用法，除了阅读这些注释之外，还建议前往注释随附的文档链接阅读文档，我们将在文档中为你提供更加详细的解释，有时还会手把手地教你使用它们。

### 满月平台插件的项目结构

- build：这是满月平台的构建工具，是一个npm包，可以通过npm build运行它。运行时，它会自动编译当前目录中的满月平台项目。如果你的文件夹中还没有这个文件，请前往 github.com/231software/fullmoonplatform/releases 下载它。
- lib：这是满月平台的**参考库**，它有三个作用：
    1. 在开发过程中给开发者提供代码补全和注释提示。
    2. 让开发者在开发过程中随时了解满月平台库的项目结构。
    3. 划定满月平台接口的最大范围。满月平台不接受将参考库定义的模块之外的任何模块作为它的一部分。
- libs：用来放置所有用于当前项目编译的第三方库。
    - LNSDK（示例）
    - <各种你希望在编译时使用的第三方库>
    ...
- node_modules：nodejs生成的**仅用于**存储**用于编译项目**的模块的文件夹。
- src：插件代码文件夹，其文件名可以通过plugin.json修改。所有的代码都必须只能位于这个文件夹里，此文件夹外的源代码不会被用于编译，引用除了参考库中代码之外其他不位于src中的代码还会导致插件无法编译。
- package.json：用nodejs管理当前项目所需的配置文件，包括编译所需依赖和编译命令等。
- plugin.json：定义插件的元数据的配置文件。

### 配置plugin.json

以下是plugin.json中各配置项的解释：
- name：插件名，不可以带有除英文字母、数字和下划线外的任何其他字符。
- main：插件入口文件的文件名，不需要带后缀名。例如如果你的插件以main.ts为入口而不是index.ts，你需要将此项修改为main。
- description：插件的描述，会显示在各插件加载器用于显示插件描述的地方，如`/plugman list <yourplugin>`或`/ll list <yourplugin>`命令中。
- build_dir：插件的构建目标文件夹。
- data_path：插件运行时存储其数据的文件夹名，影响代码中`data_path`的值。满月平台会在编译时自动将其整理为对应插件加载器常用的目录用于data_path的值。不能以斜杠`/`或反斜杠`\`开头或结尾。例如填写`fmp_plugin_example`时，插件读取到的`data_path`在LeviLamina、Endstone、Bukkit等大部分插件加载器上`data_path`的值为`plugins/fmp_plugin_example`，通过nodejs直接运行的版本为`data_path`。
- src_dir：插件代码文件夹。
- plugin_dir_name：插件本体的文件夹名。
- permissionRoot：插件的默认权限节点。
- supported_platforms：定义编译器会为插件进行的平台。
    - mode：构建工具如何处理list中定义的列表。可填写`bl`（黑名单）和`wl`（白名单）。
    - list：白名单或黑名单的平台。mode为bl时，该列表中指定的平台都不会被编译。为wl时，只有该列表中指定的平台会被编译。
- features：插件要启用的功能。
- priorities：各第三方库的优先级。构建插件时，位于第一位的库中的所有文件都将用于编译，其中没有的文件则会采用第二位的库，以此类推。

## 编写属于自己的第三方库

### 满月平台是如何构建插件的

### 第三方库是如何工作的



## 为满月平台做出贡献

<!--
Full Moon Platform is a developing toolkit that allows your plugin to run on any javascript environments as soon as there is the possibility to support the features of your software. With Full Moon Platform, you can develop large plugins easily, and you dont't need to worry about adapting your plugins, because all these works are already done by libraries developed for Full Moon Platform by community.  
只要理论能够实现，满月平台就能让你的软件在任何支持javascript的环境中运行。满月平台使大型插件的开发更方便，还不需要所以适配其他平台的问题，因为社区已经替你做完了这些适配工作。
-->