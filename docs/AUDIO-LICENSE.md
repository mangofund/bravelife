# BraveLife 音效授权说明

## 本批音效（2026-11-03 定稿）

- 来源：Kenney Interface Sounds（kenney.nl）
- 授权：CC0 1.0，可商用，免署名。
- 文件：见 docs/AUDIO-MAPPING.md，全部为 mp3（128 kbps），原包为 ogg，已转 mp3 以兼容 iOS / 微信小程序。
- 数量：用户选定 18 个 + 完整包补充 4 个，共 22 个文件。
  - 选定 18 个：drop_003、error_006、glass_004、maximize_008、minimize_006、pluck_001、pluck_002、question_002、scratch_003、select_008、switch_002、switch_003、switch_004、switch_005、switch_006、switch_007、tick_001、toggle_001。
  - 补充 4 个：confirmation_001、confirmation_002、confirmation_003、glass_001。

## 宠物叫声（2026-11-04）

- `pets/meow.mp3` 来自 George Miquilena 的猫叫录音，CC0 1.0，转为单声道 MP3。[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Maullido_de_gata_hembra_joven.ogg)
- `pets/bark.mp3` 来自 Edo.pt2 的狗叫录音，CC0 1.0，转为单声道 MP3。[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ladrido_perro.ogg)

## 尚未使用的音效

- Spaceyyy Cozy Cafe：用户 2026-11-03 决定暂缓，本次不用，不买。
- 浇水、切菜、煎炒、呼噜、电车、雨、蝉鸣、神社铃、环境循环：暂未定，不拿 Kenney UI 音冒充。后续如走 Freesound，必须逐文件核授权页：只取 CC0，CC-BY 要留作者 + 链接，CC-BY-NC 一律排除；BBC 档案仅个人 / 教育 / 研究，不能发正式版；Pixabay 原文件禁止单独再分发，公开仓库不要直接 commit 原文件。

## 存放位置

- 短音：src/static/audio/ui/、garden/、kitchen/、story/、pets/。city/、ambient/ 目前只有说明。
- 管理器：src/game/audio.js。
- 本文件只记来源与授权，不记游戏内事件映射，映射见 docs/AUDIO-MAPPING.md。
