<script>
import { save, state } from './game/index.js'
import { loadSettings } from './game/themes.js'
import { initLayout } from './game/ui.js'
import { loadServerConfig } from './game/config.js'
import { restoreSession, autoCloudSave } from './game/account.js'

export default {
  onLaunch() {
    loadSettings()
    initLayout()
    loadServerConfig()
    restoreSession()
  },
  onHide() {
    if (state.started) {
      save()
      autoCloudSave()
    }
  }
}
</script>

<style>
/* ---------- 三套画风：每个页面根节点挂 .theme-xxx ---------- */
.theme-watercolor {
  --paper: #f6eedc;
  --paper-deep: #ecdfc4;
  --ink: #4a3b2f;
  --muted: #8c7b68;
  --card: #fffaf0;
  --accent: #e07a5f;
  --accent2: #e8a0b4;
  --ok: #7fa36b;
  --warn: #d65a4a;
  --line: #b9a586;
  --bw: 3rpx;
  --shadow: 0 6rpx 0 rgba(74, 59, 47, 0.16);
  --hud: #5b4636;
  --floor-a: #dcbf92;
  --floor-b: #d2b383;
  --wall-l: #f4e9d6;
  --wall-r: #e9dbc3;
  --font: 'Hiragino Maru Gothic ProN', 'Yuanti SC', 'PingFang SC', sans-serif;
  --title-font: 'Hannotate SC', 'HanziPen SC', 'Yuanti SC', 'PingFang SC', sans-serif;
  background-color: #f6eedc;
  background-image: radial-gradient(circle at 20% 15%, rgba(232, 160, 180, 0.12) 0, transparent 40%),
    radial-gradient(circle at 85% 60%, rgba(127, 163, 107, 0.12) 0, transparent 45%);
}
.theme-crayon {
  --paper: #fffdf4;
  --paper-deep: #ffe9a3;
  --ink: #2b2b2b;
  --muted: #6b6b6b;
  --card: #ffffff;
  --accent: #ff5a36;
  --accent2: #ff7eb6;
  --ok: #3fb950;
  --warn: #e5332a;
  --line: #2b2b2b;
  --bw: 4rpx;
  --shadow: 6rpx 6rpx 0 #2b2b2b;
  --hud: #2b5fd9;
  --floor-a: #ffd98a;
  --floor-b: #ffcb6b;
  --wall-l: #bfe3ff;
  --wall-r: #9fd2ff;
  --font: 'Chalkboard SE', 'HanziPen SC', 'Hannotate SC', 'PingFang SC', sans-serif;
  --title-font: 'HanziPen SC', 'Chalkboard SE', 'PingFang SC', sans-serif;
  background-color: #fffdf4;
  background-image: radial-gradient(rgba(43, 43, 43, 0.05) 2rpx, transparent 2rpx);
  background-size: 24rpx 24rpx;
}
.theme-wafu {
  --paper: #f3ede1;
  --paper-deep: #e4d9c3;
  --ink: #2a3346;
  --muted: #6f6a5e;
  --card: #fbf7ee;
  --accent: #c8402f;
  --accent2: #6b8e5a;
  --ok: #6b8e5a;
  --warn: #c8402f;
  --line: #2a3346;
  --bw: 2rpx;
  --shadow: 0 4rpx 0 rgba(42, 51, 70, 0.22);
  --hud: #2a3346;
  --floor-a: #d9c7a0;
  --floor-b: #cdb98f;
  --wall-l: #efe6d2;
  --wall-r: #e2d6bd;
  --font: 'Hiragino Mincho ProN', 'Songti SC', 'STSong', serif;
  --title-font: 'Hiragino Mincho ProN', 'Songti SC', 'STKaiti', serif;
  background-color: #f3ede1;
  background-image: linear-gradient(rgba(42, 51, 70, 0.035) 1rpx, transparent 1rpx);
  background-size: 100% 40rpx;
}

.theme-root {
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font);
  font-size: 28rpx;
  line-height: 1.5;
}

page {
  background: #f6eedc;
}

/* #ifdef H5 */
body {
  background: #3a2f27;
}
uni-page-body,
uni-page-wrapper {
  min-height: 100vh;
}
/* 手机布局在电脑上显示时，居中成一列手机宽度 */
.narrow {
  max-width: 480px;
  margin: 0 auto;
}
/* #endif */

/* ---------- 手绘通用组件 ---------- */
.wobble {
  border-radius: 30rpx 22rpx 34rpx 24rpx / 24rpx 34rpx 22rpx 30rpx;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 28rpx;
  border-radius: 26rpx 18rpx 28rpx 20rpx / 20rpx 28rpx 18rpx 26rpx;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 28rpx;
  border: var(--bw) solid var(--line);
  box-shadow: var(--shadow);
}
.btn.ghost {
  background: var(--card);
  color: var(--ink);
}
.btn.dark {
  background: var(--hud);
}
.btn.disabled {
  opacity: 0.45;
}
.card {
  background: var(--card);
  border: var(--bw) solid var(--line);
  border-radius: 30rpx 22rpx 34rpx 24rpx / 24rpx 34rpx 22rpx 30rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--shadow);
}
.muted {
  color: var(--muted);
  font-size: 24rpx;
}
.row {
  display: flex;
  align-items: center;
}
.between {
  justify-content: space-between;
}
.section-title {
  font-family: var(--title-font);
  font-size: 32rpx;
  font-weight: 700;
  margin: 16rpx 0 16rpx;
}
.notice {
  background: var(--paper-deep);
  border: var(--bw) dashed var(--line);
  border-radius: 20rpx 14rpx 22rpx 16rpx;
  padding: 16rpx 20rpx;
  margin: 12rpx 0;
  font-size: 26rpx;
}
.act {
  display: flex;
  align-items: center;
  background: var(--card);
  border: var(--bw) solid var(--line);
  border-radius: 26rpx 18rpx 28rpx 20rpx / 20rpx 28rpx 18rpx 26rpx;
  box-shadow: var(--shadow);
  padding: 20rpx;
  margin-bottom: 18rpx;
}
.act-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}
.act-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.act-name {
  font-weight: 700;
}
.price {
  color: var(--accent);
  font-weight: 700;
  font-size: 26rpx;
}
.tag-sm {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  border: 2rpx solid var(--line);
  background: var(--paper-deep);
  margin-left: 8rpx;
}
.block {
  display: block;
  margin-bottom: 12rpx;
}
.panel {
  margin-top: 12rpx;
}
.track {
  background: var(--paper-deep);
  border: 2rpx solid var(--line);
}
</style>
