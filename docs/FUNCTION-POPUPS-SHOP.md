# 半透明功能浮层与商店发布记录

日期：2026-11-03。正式站点：https://bravelife.app
版本：632579ed-bd83-4f5e-bb17-d82e5ecccf3a，标记「浮层商店版 · 11.03」。

- 地图／家园作为底层场景；商店、生活、人物和关系二级页用锚定浮层展示。关系子页位于二级菜单上方。
- 浮层有半透明背景与模糊效果、独立滚动、关闭按钮和外部点击拦截；键盘不会在浮层打开时驱动场景。
- 家园菜单内有仓库、生活、宠物；家具选择后关闭仓库并进入家园摆放。房间和菜园共享场景。
- 原仓库主入口改为商店；四类现有商品复用原价格和效果。食物／食材／礼物进入背包，家具进入家园仓库。
- 商品第一阶段拆解稿：SHOP-DESIGN-REVIEW.md。新增种子库存、实物口粮、配方及圈子共享仍待审核和实现。

验证：shop-test 6项、garden-test 26项，smoke-test 与 life-test 全部通过；H5与微信小程序构建成功；git diff --check 通过。浏览器检查桌面1230×772、手机390×844及320×568；正式域名确认版本、人生浮层在二级菜单上方、商店不替换家园场景、背景命中拦截层、页面无整页纵向滚动。微信端本次仅构建验证，未作真机验收。

效果图：review-assets/shop-popup-online.png、life-popup-online.png、shop-mobile-online.png、popups-mobile-local.png、life-mobile-local.png。
