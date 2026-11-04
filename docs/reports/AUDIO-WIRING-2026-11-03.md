# 音效接线报告（2026-11-03，Codex 补充）

## 成了什么

本次只修改本地接线与最小音效开关，未提交、未推送、未发布。audio.js、音频文件、映射与授权结论未改；未改引擎、玩法、数值、存档结构或云端代码。

开始检查时分支为 main，跟踪 origin/main，存在 12 个已修改文件以及多项未跟踪文件。按附件暂停后，用户明确授权保留这些改动继续。本轮未 stash、reset 或覆盖这些工作。最终检查时原先那些改动已经不再显示为未提交；本轮没有执行任何提交操作。

先阅读管理器、映射与授权，再扫描组件和引擎。只在组件同步操作中播放，不在引擎、watch、时钟、启动、存档同步和角色走路完成回调中播放。地图 open 事件也会由走路请求监听触发，因此声音放在地图的 tap 上，而不是父级 onOpen 中。

同一行动只选择一个最贴切的结果音：稀有关系/晋升节点 → 任务完成 → 勇气实际增加 → 好感实际增加 → 行动默认音。不是把同一次操作的所有奖励音叠加。

## 事件 → 已核实入口

| 事件 | 代码入口 | 条件 |
| --- | --- | --- |
| click | phone-view.vue / onWear | 已拥有称号的佩戴/摘下 |
| openPanel | game.vue / navigationAudio、openHomeTool、openPhone；city-map.vue / 地点 tap；people-panel.vue / toggleGift | 目标面板/菜单打开；地图仅手势入口发声 |
| closePanel | game.vue / closePopupByUser、closeSheetByUser、restorePopup；story-modal.vue / close；people-panel.vue / toggleGift | 明确关闭/返回；生命周期与根容器清理静默 |
| tabSwitch | action-audio.js / switchAudio；phone-view.vue / openApp；game.vue / openPhone、navigationAudio | 只在值实际变化时调用 playTabSwitch；商店、家园子页签、好友/策略均接入 |
| toggle | save-panel.vue / changeSound；game.vue / togglePause | 静音后不播反馈；恢复声音时播 toggle |
| dialogue | story-modal.vue / nextScene、pick；people-panel.vue / socialAction；courage-panel.vue / petCat | 手势推进新气泡/对话，逐字与剧情监听不播；奖励音优先 |
| question | garden-view.vue / confirmAdopt；shop-view.vue / purchase；phone-view.vue / onRestart；job-panel.vue / onQuit | 确认提示实际出现 |
| error | garden-view.vue / act；shop-view.vue / purchase；people-panel.vue / socialAction；job-panel.vue / 应聘/工作；courage-panel.vue / 购买/接课题/摸猫 | 已核实引擎 false 分支提供可见 toast/提示；busy 防连点在声音包装外 |
| confirm | 商店购买、菜园日常操作、领养、事件选择、应聘/工作、勇气商店；phone-view.vue / onSave | 同步操作成功；更具体的结果音优先 |
| taskComplete | action-audio.js / actionAudio，以上包装入口 | 勇气课题完成次数、新手任务步骤或章节目标数量实际增加 |
| plant | garden-view.vue / onPlotTap → act → sow | 播种成功 |
| harvest | garden-view.vue / 收获按钮 → act → reap | 成熟数大于 0 且操作成功；禁用/无成熟作物不播收获音 |
| courage | action-audio.js / actionAudio，社交、剧情选择、事件、工作等包装入口 | 操作后勇气值确实大于操作前 |
| affection | action-audio.js / actionAudio，社交/剧情等包装入口 | 某位 NPC 好感实际增加 |
| keyMoment | people-panel.vue / 表白、求婚；job-panel.vue / 工作 | 关系实际变为 dating/married，或同职业职级实际提升；失败、普通应聘不播 |
| petFeed | garden-view.vue / 喂食按钮 → act → feed | 库存消耗与喂食操作成功 |

## 改动文件清单（相对仓库根目录）

| 文件 | 本次改动 |
| --- | --- |
| src/game/action-audio.js | 新增同步操作结果判断与页签防重复包装，不修改引擎。 |
| src/components/city-map/city-map.vue | 地点手势打开音，与延迟到达/监听入口分开。 |
| src/pages/game/game.vue | 主导航、显式关闭/返回、暂停开关接线；内部清理保持静默。 |
| src/components/home-view/home-view.vue | 家园已有子页签在实际变化时轮换切换音。 |
| src/components/phone-view/phone-view.vue | 手机页签、好友/策略、称号点击、本机保存和重开提示接线。 |
| src/components/save-panel/save-panel.vue | 现有面板新增一个游戏音效开关，独立使用管理器静音键。 |
| src/components/garden-view/garden-view.vue | 播种、收获、喂食、领养及失败反馈接线；阻止冒泡清除拒绝提示。 |
| src/components/shop-view.vue | 分类切换、昂贵商品确认提示及购买结果接线。 |
| src/components/story-modal/story-modal.vue | 手势推进气泡、选择结果及关闭接线，监听保持静默。 |
| src/components/event-modal/event-modal.vue | 随机事件只在用户选择时判断结果音。 |
| src/components/location-sheet/people-panel.vue | 社交结果、实际好感/勇气增长及成功告白/求婚接线。 |
| src/components/location-sheet/job-panel.vue | 应聘、工作、实际晋升及辞职疑问提示接线。 |
| src/components/location-sheet/courage-panel.vue | 勇气商店购买、接课题及摸猫的用户操作接线。 |
| scripts/audio-wiring-test.mjs | 可重复运行的结果门槛、轮换、静音与音量检查；模拟音频输出，不冒充真实试听。 |
| docs/reports/AUDIO-WIRING-2026-11-03.md | 独立记录入口、验证结果和未覆盖范围，不覆盖定稿文档。 |

## 验证结果

- H5 构建：npm run build:h5，退出码 0；检查完整日志，无 error/failed/exception 行。
- git diff --check：通过。
- node scripts/audio-wiring-test.mjs：通过。覆盖成功/失败、静默拒绝、勇气与好感增减、成功关系节点与无变化、任务完成优先级、一次行动一次播放、重复页签静默、六种变体循环、报错音量 0.5、静音持久化和所有 TBD 静默。
- 浏览器：ego-browser 首次创建会话后，后续命令出现会话不存在/CLI 不可用，改用 Chrome 本地 H5 页面（127.0.0.1:5175）。新建该端口专用测试人生，未操作线上存档或账号。

### H5 手动操作清单

“界面通过”只代表实际点击和可见结果核对，不代表已听辨声音。自动检查使用管理器和包装器真实源代码、模拟音频上下文，不能代替端到端试听。

| 项目 | 结果 |
| --- | --- |
| 打开面板、关闭/返回 | 界面通过：人物面板、关系菜单、我的、商店、宠物、返回原功能均可用；真实听感未测。 |
| 页签多次切换 | 界面通过：商店分类连续切换 7 次；六种文件轮换由自动检查确认；真实听感未测。 |
| 普通 click | 称号佩戴入口已接；当前测试角色没有可佩戴称号，端到端未测。 |
| 开关 | 界面通过：暂停/继续和音效开关；开关状态能正确改变。 |
| 静音刷新后保持、重新打开 | 界面通过：关闭后保存并刷新，重新进入我的仍关闭；重新打开显示开启；短音拦截由自动检查确认。 |
| 疑问提示、日常确认 | 界面通过：小狗领养先出现确认说明，再确认领养成功；购买种子和狗粮成功。 |
| 报错 | 界面通过：种子不足，提示“种子不足，去商店园艺区补货吧”；修复冒泡后提示保留；0.5 音量由自动检查确认，明显更轻的听感未测。 |
| 播种 | 界面通过：萝卜种子 1→0，空地变幼苗，显示约 12 小时。 |
| 宠物喂食 | 界面通过：狗粮 1→0，剩余口粮约 24→48 小时。 |
| 收获 | 自动结果门槛通过；新测试菜园尚未成熟，需要现实约 12 小时，端到端未测，未改时间或数值造出成熟状态。 |
| 对话气泡 | 手势推进代码已接；当前测试路线未触发可推进剧情，端到端未测。 |
| 任务完成、勇气增加、好感提升 | 自动变化门槛通过；当前手动路线未完成相应成长/社交任务，端到端未测。 |
| 关键节点 | 关系变化门槛自动检查通过；告白/晋升等稀有节点在本轮测试人生不可即达，端到端未测。 |
| 挖土、上菜 | 无独立入口，不适用。 |

结论：构建和结果门槛检查通过，主要界面路径可用；真实试听、长时菜园和稀有剧情尚未全量验收，不能宣称全部 ACCEPTANCE 已通过。

## 没接什么及原因

- dig、serve：扫描未找到挖土/翻土或上菜独立操作，不把播种、做饭、吃饭或普通打工冒充它们。
- 传承交接、登台：未为稀有分支建立确定且同步的组件手势结果判定；keyMoment 仅覆盖已核实的关系成功和晋升。
- 自动出现的第一条剧情气泡、时钟自动完成的课题/奖励：遵守只在用户手势发声，保持静默。
- 延迟走到家具后的睡觉/做饭/使用、自动到达地点：不从延迟回调发声。
- 账号登录、云存档、同步与恢复回调：不在本次范围，原逻辑未动。
- 浇水、切菜、煎炒、动物叫声、电车、天气与所有环境循环：未定稿，保持静默，不借用其他音效。
- 未全量覆盖所有旧按钮、快捷键、配方/策略等组件以及 requestFunction 的程序化面板切换：本次只覆盖已核实的同步入口，没有全局拦截点击或给后台状态监听加声音。

## 卡住什么

没有需要重新决定映射或玩法的事项。剩余限制是实际试听以及长时/稀有路径验收，不能由本轮自动检查替代。

## 下一步建议

优先按本报告的 H5 清单做一轮真实扬声器/耳机试听，确认首声、双响、变体与音量；完成前不提交、不推送、不发布。

## 2026-11-04 恢复验收补充（实际浏览器播放）

本轮恢复专用本地测试人生，用临时 HTMLMediaElement.play 诊断记录原生 play/playing/ended 事件。该诊断原样调用浏览器播放器，不模拟音频，也不修改管理器和音频文件。检查后已完整移除；index.html 无差异，未留下诊断脚本。

| 项目 | 浏览器实际结果 |
| --- | --- |
| 启动静默、首声 | 页面加载记录为空；首次点击商店产生一次 maximize_008 的 play 和 playing，随后 ended，无拒绝。 |
| 页签变体和重复点击 | 七次有效切换的 play 文件顺序为 switch_002、003、004、005、006、007、002；再次点击当前页签未增加 play。各变体观察到 playing 和 ended。 |
| 关闭、打开 | 对应 minimize_006、maximize_008，观察到实际 playing/ended。 |
| 静音 | 关闭音效后点击本机保存，play 次数保持 11→11。 |
| 刷新持久化 | 刷新后开关仍为关闭；打开关系菜单及我的页面，播放记录保持为空。 |
| 恢复声音 | 打开音效开关，toggle_001 产生一次 play、playing、ended，音量 1，muted=false。 |
| 可见拒绝 | 点击无种子的空地显示种子不足提示；error_006 产生一次 play/playing/ended，实际播放器 volume=0.5。 |
| 自然成熟收获 | 上轮萝卜已经自然成熟，点击收获后显示“收获了 10 份，放进菜园收成篮”；pluck_001 产生一次 play/playing/ended，volume=1。未改时间、存档或游戏数值。 |
| 购买确认 | 购买一份萝卜种子，confirmation_001 产生一次 play/playing/ended，volume=1。 |
| 播种 | 种子 1→0，空地变幼苗；drop_003 产生一次 play/playing，volume=1。 |
| 防连点 | 种子不足后立即点击收获处于操作冷却，未增加播放；冷却结束后重试成功，只增加一次收获音。 |

以上升级为真实浏览器播放验证，取代初次报告中相应项目仅有模拟/界面验证的状态。没有将原生 playing/ended 等同于扬声器已出声或人耳确认。

仍未确认：人耳听辨音色、主观音量和双响听感；普通称号点击、剧情推进、任务完成、勇气/好感增加、稀有节点的真实路径播放；宠物喂食的真实播放（此前仅验证界面及模拟结果）。未达到全部 ACCEPTANCE，不标为全量验收通过。下一步只需优先对已验证路径做一次人耳听辨。

本轮只新增验收记录，接线代码未继续修改，未提交、推送、发布。

## 2026-11-04 发布授权

用户已明确要求“推送和发布吧”，授权提交本次音效接线并推送 GitHub、发布 bravelife.app，取代此前不提交/不发布的限制。上述未测项目仍如实保留。发布只包含本次音效文件、结果检查脚本和报告，不包含同期字体/移动端排版改动；从提交快照构建。部署结果及提交/Cloudflare 版本标识在聊天最终回报。
