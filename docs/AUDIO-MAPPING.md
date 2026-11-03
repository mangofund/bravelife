# BraveLife 音效映射（2026-11-03 定稿）

管理器：src/game/audio.js，调用 play(event) 或 playTabSwitch()。
规则：每个事件一个主音，除 petFeed 外不跨系统复用；报错音进游戏时压低音量（0.5）。

## UI

- click 普通按钮点击：ui/select_008.mp3
- openPanel 打开 / 展开面板：ui/maximize_008.mp3
- closePanel 返回 / 收起面板：ui/minimize_006.mp3
- tabSwitch 页签切换：ui/switch_002.mp3 为主，switch_003-007 只在页签系统里轮换
- toggle 开关：ui/toggle_001.mp3
- dialogue 对话气泡弹出：ui/tick_001.mp3
- question 疑问 / 提示出现：ui/question_002.mp3
- error 报错 / 条件不足：ui/error_006.mp3，音量 0.5
- confirm 日常确认 / 提交：ui/confirmation_001.mp3
- taskComplete 任务完成：ui/confirmation_002.mp3

## 菜园（抽象反馈，不是真实土声 / 水声）

- plant 播种 / 放入：garden/drop_003.mp3
- dig 挖土 / 翻土：garden/scratch_003.mp3
- harvest 收获摘取：garden/pluck_001.mp3

## 厨房 / 打工（抽象反馈，真实切菜 / 煎炒声后补）

- serve 上菜铃：kitchen/glass_001.mp3

## 关系 / 剧情

- courage 勇气获得：story/pluck_002.mp3
- affection 好感提升：story/confirmation_003.mp3
- keyMoment 关键节点（告白 / 登台 / 晋升 / 传承交接）：story/glass_004.mp3，只用于稀有节点

## 宠物

- petFeed 喂食放入：garden/drop_003.mp3，与 plant 共用，是用户批准的唯一跨系统复用。

## 暂留空、等真实录音

water 浇水、chop 切菜、fry 煎炒、dogBark 狗叫、catMeow 猫叫、purr 呼噜、train 电车、rain 雨、cicada 蝉鸣、shrineBell 神社铃、ambientHome / ambientCafe 环境循环。play() 对这些事件静默返回 false。

## 接线说明（尚未接线到各事件）

本批只落了文件目录、管理器、授权与映射文档，没有改任何页面、没有在启动时自动播音。
下一步接线时，在用户操作的回调里调用 play(event)，不要在 onLaunch 里调用；
静音开关调用 setMuted / toggleMuted，状态存在 bravelife_sound_muted_v1；
环境循环单独走 playAmbient / stopAmbient，不要和短音抢同一实例。
