import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool'
import { CROPS } from '../../src/game/data/garden.js'
import { ITEMS, FURNITURE } from '../../src/game/data/world.js'

const root = '/Users/pro/Documents/MyLife'
const out = `${root}/outputs/shop-design-20261103`
const spec = JSON.parse(await fs.readFile(`${root}/docs/design-data/shop-balance-v1.json`, 'utf8'))
const report = JSON.parse(await fs.readFile(`${root}/docs/design-data/shop-balance-report-v1.json`, 'utf8'))
const wb = Workbook.create()
const names = ['概述','系统规则','商品目录','数值配置','配方配置','收益推演','UI要点','边界与异常','开放问题']
const sheets = Object.fromEntries(names.map(n => [n,wb.worksheets.add(n)]))
const colors = {ink:'#26364A',gold:'#AE8C50',pale:'#F5EFE3',input:'#FFF0CC',line:'#D6C8AF'}
function col(i){let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s}
function init(name,title,widths,sub=''){
  const s=sheets[name], end=col(widths.length-1)
  s.showGridLines=false
  s.getRange(`A1:${end}70`).format.font={name:'Arial',size:11,color:colors.ink}
  s.getRange(`A1:${end}70`).format.verticalAlignment='center'
  widths.forEach((w,i)=>s.getRange(`${col(i)}1:${col(i)}70`).format.columnWidth=w)
  s.getRange('A2').values=[[title]];s.getRange('A2').format.font={name:'Arial',size:17,bold:true,color:colors.ink}
  s.getRange(`A2:${end}2`).format.rowHeight=30
  s.getRange(`A2:${end}2`).format.borders={bottom:{style:'thin',color:colors.gold}}
  if(sub){s.getRange('A3').values=[[sub]];s.getRange('A3').format.font={name:'Arial',size:10,color:'#6E665B'}}
  return s
}
function table(s,row,headers,rows,height=48){
  const end=col(headers.length-1), last=row+rows.length
  s.getRange(`A${row}:${end}${row}`).values=[headers]
  s.getRange(`A${row}:${end}${row}`).format={fill:colors.ink,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:34,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center'}
  if(rows.length){
    s.getRange(`A${row+1}:${end}${last}`).values=rows
    s.getRange(`A${row+1}:${end}${last}`).format.wrapText=true
    s.getRange(`A${row+1}:${end}${last}`).format.rowHeight=height
    rows.forEach((r,i)=>{if(i%2===1)s.getRange(`A${row+1+i}:${end}${row+1+i}`).format.fill=colors.pale})
  }
  return last
}
function formula(s,cell,text){s.getRange(cell).formulas=[[text]]}
const states={live:'已上线基线',dev:'已确认，待开发',later:'后续扩展'}
const overview=[
 ['设计目标','经营自己的人生；圈子分享策略并共同成长，单人同样完整。','四阶段均已确认','2026-11-03 作者确认'],
 ['核心循环','采购、种植、收获、料理／出售、照料宠物，再按自己的目标安排生活。','策划初稿 v1','尚未对照新原型形成正式GDD'],
 ['当前版本','四类随身商店；家园合并房间与菜园；功能使用半透明浮层。',states.live,'正式版本 632579ed-bd83-4f5e-bb17-d82e5ecccf3a'],
 ['首轮开发','种子库存、普通口粮、三道自家料理、缺货补购与旧档兼容。',states.dev,'保留已确认价格、份量与计时规则'],
 ['成长与分享','首次自产料理留痕、主动生活目标、策略草稿和圈子手记。',states.dev,'真实发布依赖圈子成员与消息服务'],
 ['交织主线','先做一个NPC邀请样段。角色按自己的目标回应，结果解释来源。',states.dev,'不代替其他玩家选择职业、感情或支出'],
 ['真实共享','共享食材、共享仓库、多人分餐与可交易收益。',states.later,'另行设计权限、结算和数值'],
 ['两套时间','作物与口粮用现实时间；工作、料理与人物需求用个人游戏时间。','必须保留','个人暂停或跳日不推进别人的时间'],
 ['验证范围','已完成12组种植情景、3道配方算表和喂粮边界推演。','离线推演','新增功能尚未完成开发与游玩验收']
]
const rules=[
 ['种子购买','50／80／150日元购买对应种子，每份播种一格。买入不自动播种。',states.dev,'先买入再消耗，播种不再扣现金'],
 ['播种失败','地块被占、非在家、种子不足或重复请求均不扣种子。',states.dev,'同一入口完成检查与扣除'],
 ['成长与缺水','新播种自带24现实小时水分；缺水半速，成熟不腐烂。',states.live,'不因商品改造调整现有生长规则'],
 ['普通口粮','猫狗分别用粮；100日元一份，追加24现实小时，最多提前72小时。',states.dev,'只有容得下一整份才扣粮'],
 ['喂养边界','剩48小时可补一份；略超48小时不可补。饥饿从当前时间开始追加。',states.dev,'保留现有剩余时长，不覆盖、不自动喂'],
 ['领养兼容','狗3000、猫2000日元；自带首日饱腹，旧宠物到期时间保留。','沿用现有数值','库存新字段默认为空，不反复赠粮'],
 ['狗的守园','狗在菜园完全不能偷。饿后回房睡觉，且主人不在才可能偷。','作者硬性要求','不引入概率、安眠道具或体力失效门槛'],
 ['猫的陪伴','饱腹时每24现实小时首次陪伴心情＋4。喂粮和买粮不额外奖励。',states.live,'不重复领取陪伴收益'],
 ['做饭与食用','清汤、鱼汤需要在家并摆放厨房；果盘在家即可。做完当餐吃。',states.dev,'不生成成品，不可把已吃的餐再次赠送'],
 ['扣料结算','直接吃、出售和料理使用同一份收成；跨背包与收成篮一起校验。',states.dev,'缺鱼不能先扣番茄；连点不重复消费'],
 ['厨艺成长','熟食沿用厨艺加成与边际递减；果盘不发厨艺、也不享受厨艺加成。',states.dev,'熟食计一次料理与用餐；果盘只计用餐'],
 ['成长留痕','实际成功制作后记录首次自产料理。经历不再发金钱或属性。',states.dev,'未来访客材料不能冒充自产来源'],
 ['生活目标','目标由本人选择、可更换或隐藏；只生成建议，不锁材料、不代购。',states.dev,'现有全量出售按钮须明确写“全部出售”'],
 ['策略手记','包含目标、条件、步骤、预算、取舍、实践结果和规则版本。',states.dev,'复制只得到草稿；本人主动发布与执行'],
 ['隐私权限','默认不公开私产、恋爱、离线时刻、狗饥饿时刻或全量库存。',states.dev,'圈主不拥有私人主线操作权'],
 ['主线传播','影响由共同项目、认可约定、关系与共同地点传播；保存原因。',states.dev,'直接影响加一次后续回应；更长变化转新机会'],
 ['NPC样段','自产料理可打开可选对话。NPC依目标接受、改期或拒绝。',states.dev,'不自动接单、不偷偷扣料，刷新不重抽'],
 ['多人项目','异步筹备、确认、举行、回响；个人行动只推进自己的时间。','机制方向已确认','项目时长与共享资产另行数值化'],
 ['多人偷菜','每人同批一次、合计最多两份，主人保留至少八份。','本地模型已有','真人访客必须服务端校验，未上线'],
 ['多人共餐','先展示各自菜谱和经历；真正投入、分餐另立项目结算。',states.later,'不把一人份餐给无限成员发恢复或奖励']
]
const ui=[
 ['一级导航','地图、家园、商店、生活、人物、关系。',states.live,'不增加商品系统专属一级入口'],
 ['家园菜单','家园、仓库、生活、宠物；房间与菜园共享一个场景。',states.live,'仓库不再占独立一级按钮'],
 ['浮层','页面位于对应按钮或二级菜单上方，半透明，内滚动，阻止点击穿透。',states.live,'窗外点击只收起，主场景固定'],
 ['商店分类','食物、食材、礼物、家具、园艺、宠物。手机一条横向可滑栏。',states.dev,'已上线前四类；选中分类保持可见'],
 ['商品卡','插画、名称、用途、价格、拥有数量、购买；详情在卡片展开。',states.dev,'不叠第二个详情大窗'],
 ['家园仓库','家具、种子、口粮分栏。家具选中后进入摆放。',states.dev,'背包和收成篮不复制资产'],
 ['生活配方','自己做中展示材料拥有／需要、耗时、实际恢复与成长。',states.dev,'熟食“制作并吃”；果盘“切盘吃”'],
 ['缺货补购','同一个浮层切到对应商店分类，保留返回来源，不自动付款。',states.dev,'买种子后仍需本人确认播种'],
 ['宠物信息','分别显示库存、当前看园／陪伴状态和剩余饱腹。',states.dev,'预览追加后的时长，粮满不消耗'],
 ['人生与策略','经历进入人生；策略进入好友浮层的圈子分栏。',states.dev,'只给短Tips，不自动打开页面或发送消息'],
 ['视觉','水彩场景、半透明米色纸面、细金边与深色指令栏。','延续当前方向','不引入稀有度彩虹色；先用图标验证'],
 ['关键状态','空库存、资金不足、无厨房、缺材料、处理中、失败、储粮已满。',states.dev,'提示具体原因；状态不可只靠颜色区分']
]
const edges=[
 ['购买／播种连点','每笔购买与每次播种只消耗一次；失败不改变库存。','待实现验收','本地按钮禁用与共用行动校验都要覆盖'],
 ['口粮容量','48小时余粮可喂；略超48小时拒绝；无库存不修改到期时间。','待实现验收','猫狗各扣各粮，容量与仓库库存分开'],
 ['系统时间回拨','使用菜园已推进时间基准，不能刷生长或口粮时长。','待实现验收','离线与跨越饥饿边界均验证'],
 ['跨库存配方','材料全部满足才一起扣；材料不足时不预扣。','待实现验收','成功后保存消费、成长与经历来源'],
 ['满属性／无厨房','显示实际恢复；无厨房熟食不可做，果盘仍可做。','待实现验收','属性上限沿用100，溢出不储存'],
 ['旧存档迁移','金钱、在地作物、收成、家具与宠物到期时间完整保留。','待实现验收','新增库存为空；恢复不重复赠送'],
 ['保存失败','不显示成功；恢复内存变化或保存可重试的交易记录。','待实现验收','现有购买不等于已具备失败回滚'],
 ['来源缺失','旧材料保留正常用途，不伪造自产经历。','待实现验收','未来偷来／赠送／自产应可区分'],
 ['分享与退出','复制手记不扣钱；退出保留个人经历，不复制公共资产。','待多人实现验收','隐私仅按本人选择公开'],
 ['跨玩家结算','服务端检查权限、批次与唯一事件；个人云档不能覆盖公共事实。','待多人实现验收','当前个人存档接口不足以支持'],
 ['离线参与','不强制代扣、不替离线者承诺；项目按事先约定缩小或归档。','待项目实现验收','主理人离线不授予无限管理权']
]
const open=[
 ['原型与美术','本件是策划初稿；正式GDD需与后续原型逐页对应。','下一阶段工作','配方、补购、仓库分栏、状态与返回路径'],
 ['真人偷菜','目前只有本地规则，没有完整线上访客服务。',states.later,'不能把极端盗窃假设当真实发生频率'],
 ['共享资产与分餐','需另设权限、材料承诺、取消返还、受益份量与结算。',states.later,'不并入三道自食配方，不追加未核算收益'],
 ['NPC验证','先以一个邀请样段验证选择、拒绝、原因与后续机会。',states.dev,'不扩成所有人物逐秒运转的社会模拟'],
 ['低频照料','两天回访草莓可能第96小时才收，养狗未必回本。','保持当前规则','不悄改缺水倍率；显示真实剩余时间'],
 ['双时钟理解','作物与宠物按现实时间，人物行动按个人游戏时间。','需游玩验证','不得用班薪与现实日菜园收入直接比较'],
 ['圈子规模','典型3—8人但不作为永久上限；通过多项目支持更大圈子。','作者方向','项目窗口与并发需要独立验证'],
 ['确认与上线','四阶段设计均已确认；设计批准不代表新增代码已完成。','当前状态','本次只交付策划与表格，不部署游戏变更']
]

table(init('概述','勇敢人生 商品与生活经营策划初稿',[22,64,24,53],'v1　2026-11-03　已确认设计，新增玩法待开发'),5,['模块','内容','状态','说明'],overview,62)
table(init('系统规则','系统规则与机制联动',[20,67,25,53],'依据：四阶段作者确认；现有代码与发布记录（2026-11-03）'),5,['机制','规则','实现状态','边界'],rules,66)
table(init('UI要点','界面与操作路径',[20,65,25,51],'沿用已上线半透明浮层；新增入口在现有导航内部扩展'),5,['位置','展示与操作','状态','约束'],ui,60)
table(init('边界与异常','边界处理与后续验收',[22,64,26,54],'以下为待开发项的验收要求，不代表已通过实现测试'),5,['情景','预期行为','验证阶段','注意事项'],edges,62)
table(init('开放问题','后续范围与开放问题',[22,66,27,51],'第四阶段已确认；共享资产与多人分餐仍需单独方案'),5,['主题','说明','范围','下一步'],open,62)
for(const n of ['系统规则','UI要点','边界与异常','开放问题'])sheets[n].freezePanes.freezeRows(5)
sheets['概述'].tabColor=colors.ink

const n=init('数值配置','商品与基础数值',[23,21,18,19,18,18,18,21],'淡黄为输入基线；公式结果在后续页。修改表格不修改线上游戏。')
table(n,5,['作物ID','名称','种子单价／円','生长／现实小时','标准收成／份','最多被偷／份','收成售价／円','生食饱腹'],Object.entries(CROPS).map(([id,c])=>[id,c.name,spec.seeds[id].price,c.hours,10,2,c.price,c.hunger]),30)
n.getRange('C6:H8').format.fill=colors.input
n.getRange('A10').values=[['种子、生长、产量来源：garden.js、garden-model.js（2026-11-03），沿用现有数值']]
n.getRange('A10').format.font={size:10,color:'#6E665B'}
table(n,11,['宠物ID','名称','口粮单价／円','追加／现实小时','提前上限／小时','领养费／円','赠粮／小时','每日陪伴心情'],[['dog','小狗',spec.feed.dog.price,24,72,3000,24,0],['cat','小猫',spec.feed.cat.price,24,72,2000,24,4]],30)
n.getRange('C12:H13').format.fill=colors.input
n.getRange('A15').values=[['口粮价、追加量、上限为已确认新值；领养与陪伴沿用garden.js；均按现实时间']]
n.getRange('A15').format.font={size:10,color:'#6E665B'}
const globals=[['地块数量',4,'格','garden-model.js'],['浇水覆盖',24,'现实小时','garden.js'],['缺水成长倍率',0.5,'倍','garden-model.js'],['成年饱腹消耗',3,'点／游戏小时','time.js'],['成年精力消耗',2.5,'点／游戏小时','time.js'],['成年心情消耗',0.6,'点／游戏小时','time.js'],['熟食厨艺饱腹系数',0.2,'点／厨艺','actions.js'],['厨艺递减分母',125,'点','core.js'],['最低成长倍率',0.25,'倍','core.js'],['卡式炉等级',1,'倍','world.js'],['系统厨房等级',2,'倍','world.js'],['技能／属性上限',100,'点','core.js'],['狗睡眠体力消耗',0.02,'点／现实小时','garden-model.js'],['鲜鱼单价',ITEMS.fish.price,'日元','world.js'],['卡式炉单价',FURNITURE.stove.price,'日元','world.js'],['系统厨房单价',FURNITURE.kitchen.price,'日元','world.js']]
table(n,17,['基础参数','数值','单位','来源'],globals,30)
 n.getRange('B18:B33').format.fill=colors.input;n.getRange('B18:B33').setNumberFormat('0.00')
for(const r of [18,19,21,25,27,28,29,31,32,33])n.getRange(`B${r}`).setNumberFormat('#,##0')
n.freezePanes.freezeRows(5)

const statNames={hunger:'饱腹',energy:'精力',mood:'心情',health:'健康',int:'知识',cha:'魅力',fit:'体能',cre:'创意',cook:'厨艺'}
const effects=x=>Object.entries(x||{}).map(([k,v])=>(statNames[k]||k)+(v>0?'+':'')+v).join('，')
const catalogue=[], catalogueRows={}
for(const [id,g] of Object.entries(ITEMS)){
 const cat={food:'食物',ingredient:'食材',gift:'礼物',ring:'礼物'}[g.kind]
 const use=g.kind==='ingredient'?`料理基础：${effects(g.cook)}，厨艺+${g.cookGain}`:g.kind==='ring'?'求婚使用；仍需满足关系条件':g.kind==='gift'?'用于关系互动':effects(g.effects)
 catalogueRows[id]=6+catalogue.length;catalogue.push([id,cat,g.name,g.price,use,'背包',states.live])
}
for(const [id,g] of Object.entries(FURNITURE)){
 if(g.courage||id==='cat')continue
 const parts=[]
 if(g.bed)parts.push(`睡眠质量×${g.bed}`)
 if(g.kitchen)parts.push(`厨房等级${g.kitchen}`)
 if(g.decor)parts.push(`装饰+${g.decor}`)
 if(g.cleaner)parts.push(`整洁衰减×${g.cleaner}`)
 if(g.use)parts.push(`${g.use.name}，${g.use.hours}游戏小时；${effects(g.use.effects)}${g.use.skills?'；'+effects(g.use.skills):''}`)
 catalogueRows[id]=6+catalogue.length;catalogue.push([id,'家具',g.name,g.price,parts.join('；'),'家园家具仓库',states.live])
}
for(const [i,id] of Object.keys(spec.seeds).entries())catalogue.push([`seed_${id}`,'园艺',CROPS[id].name+'种子',null,'一份播种一格；不再额外扣现金','家园种子库存',states.dev])
for(const id of ['dog','cat'])catalogue.push([`feed_${id}`,'宠物',id==='dog'?'普通狗粮':'普通猫粮',null,'主动喂养；追加24现实小时，上限72小时','家园口粮库存',states.dev])
const cat=init('商品目录','商品目录与用途',[26,13,22,16,69,22,25],'来源：world.js（2026-11-03）；新增种子和口粮引用已确认配置。')
table(cat,5,['商品ID','分类','名称','单价／日元','用途或效果','购买后去向','实现状态'],catalogue,48)
cat.getRange('D6:D41').setNumberFormat('#,##0')
for(let i=0;i<3;i++)formula(cat,`D${37+i}`,`='数值配置'!C${6+i}`)
formula(cat,'D40',"='数值配置'!C12");formula(cat,'D41',"='数值配置'!C13")
formula(n,'B31',`='商品目录'!D${catalogueRows.fish}`)
formula(n,'B32',`='商品目录'!D${catalogueRows.stove}`)
formula(n,'B33',`='商品目录'!D${catalogueRows.kitchen}`)
n.getRange('B31:B33').format.fill=colors.pale
cat.freezePanes.freezeRows(5)

const p=init('配方配置','三道自家料理',[25,22,29,15,15,13,13,15,15,14,14],'新值来源：已确认第三阶段。基础效果为厨艺0；浅黄为输入。')
const rdata=Object.entries(spec.recipes).map(([id,r])=>[id,r.name,Object.entries(r.produce).map(([k,v])=>CROPS[k].name+'×'+v).concat(Object.entries(r.items).map(([k,v])=>ITEMS[k].name+'×'+v)).join('、'),r.hours,r.effects.hunger,r.effects.health,r.effects.mood,r.cookGain,r.kitchen,Object.values(r.produce)[0],r.items.fish||0])
table(p,5,['配方ID','料理','材料说明','耗时／游戏小时','基础饱腹','健康','心情','基础厨艺','厨房要求0／1','蔬果数量','鲜鱼数量'],rdata,42)
p.getRange('D6:K8').format.fill=colors.input;p.getRange('D6:H8').setNumberFormat('0.00');p.getRange('E6:G8').setNumberFormat('0')
formula(p,'C6','="萝卜×"&J6');formula(p,'C7','="番茄×"&J7&"、鲜鱼×"&K7');formula(p,'C8','="草莓×"&J8')
p.getRange('A10').values=[['做完当餐吃；熟食需在家并摆放厨房，果盘无需厨房且无厨艺成长。']]
table(p,12,['料理','蔬果单价／円','放弃售价／円','采购现金／円','机会成本／円','理论净饱腹','基础厨艺／小时'],rdata.map(r=>[r[1],null,null,null,null,null,null]),34)
for(let i=0;i<3;i++){
 const a=6+i,b=13+i,c=6+i
 formula(p,`B${b}`,`='数值配置'!G${c}`);formula(p,`C${b}`,`=B${b}*J${a}`)
 formula(p,`D${b}`,`=K${a}*'数值配置'!$B$31`);formula(p,`E${b}`,`=SUM(C${b}:D${b})`)
 formula(p,`F${b}`,`=E${a}-D${a}*'数值配置'!$B$21`);formula(p,`G${b}`,`=H${a}/D${a}`)
}
p.getRange('B13:G15').setNumberFormat('0.00')
p.getRange('B13:E15').setNumberFormat('#,##0')
p.getRange('A17').values=[['机会成本不重复加种子费；净饱腹按成年消耗理论估算，不含跨日、事件与属性触顶。']]
table(p,19,['当前厨艺','萝卜汤饱腹','鱼汤饱腹','萝卜汤／炉具','萝卜汤／厨房','鱼汤／炉具','鱼汤／厨房'],[0,50,80].map(x=>[x,null,null,null,null,null,null]),32)
for(let r=20;r<=22;r++){
 formula(p,`B${r}`,`=ROUND($E$6+A${r}*'数值配置'!$B$24,0)`);formula(p,`C${r}`,`=ROUND($E$7+A${r}*'数值配置'!$B$24,0)`)
 for(const [c,base,k] of [['D',6,27],['E',6,28],['F',7,27],['G',7,28]])formula(p,`${c}${r}`,`=$H$${base}*'数值配置'!$B$${k}*MAX('数值配置'!$B$26,1-A${r}/'数值配置'!$B$25)`)
}
p.getRange('D20:G22').setNumberFormat('0.00')
p.getRange('A24').values=[['成长表为取整前理论值；实际能力总值保留一位小数且上限100。果盘无技能加成。']]

const y=init('收益推演','照料频率与经营收益',[18,22,19,20,20,20,20,21],'每现实日净收入；四格同作物，扣种子；有狗另扣粮费。未计领养、厨房与人物时间。')
table(y,5,['回访／现实小时','作物','收获周期／小时','每日收获批数','无盗窃净收入','每批偷满净收入','有狗净收入','狗边际收益'],report.scenarios.map(s=>[s.visitHours,CROPS[s.crop].name,s.cycleHours,null,null,null,null,null]),34)
const cr={radish:6,tomato:7,strawberry:8}
report.scenarios.forEach((s,i)=>{
 const r=6+i,c=cr[s.crop]
 formula(y,`D${r}`,`=24/C${r}`)
 formula(y,`E${r}`,`=('数值配置'!E${c}*'数值配置'!G${c}-'数值配置'!C${c})*'数值配置'!$B$18*D${r}`)
 formula(y,`F${r}`,`=(('数值配置'!E${c}-'数值配置'!F${c})*'数值配置'!G${c}-'数值配置'!C${c})*'数值配置'!$B$18*D${r}`)
 formula(y,`G${r}`,`=E${r}-'数值配置'!$C$12*24/'数值配置'!$D$12`)
 formula(y,`H${r}`,`=G${r}-F${r}`)
})
y.getRange('D6:H17').setNumberFormat('0.00')
y.getRange('H6:H17').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FBE4DE',font:{color:'#A63727'}}})
y.getRange('A19').values=[['收获周期为现有生长模型的固定回访模拟快照；改成长或浇水规则须重跑模拟，再更新C列。']]
y.getRange('A20').values=[['“偷满”为未来极端情景，非真人统计；没人偷菜时，狗只有粮费支出，不保证回本。']]
y.getRange('A21').values=[['来源：garden-model.js模拟；shop-balance-report-v1.json（2026-11-03）。成本随配置公式更新。']]
table(y,23,['宠物','每日粮费／円','7现实日／円','28现实日／円'],[['小狗',null,null,null],['小猫',null,null,null]],32)
for(let i=0;i<2;i++){const r=24+i,c=12+i;formula(y,`B${r}`,`='数值配置'!C${c}*24/'数值配置'!D${c}`);formula(y,`C${r}`,`=B${r}*7`);formula(y,`D${r}`,`=B${r}*28`)}
y.getRange('A27').values=[['口粮表为持续照料稳态成本；不含领养赠送首日及最初领养费。']]
y.freezePanes.freezeRows(5)

// Verify dependent formulas, including temporary input changes, before restoring final values.
wb.recalculate()
const value=(s,c)=>sheets[s].getRange(c).values[0][0]
const near=(v,w)=>assert.ok(Math.abs(Number(v)-w)<0.00001,`${v} != ${w}`)
near(value('配方配置','F13'),23.5);near(value('配方配置','E14'),1560);near(value('配方配置','F14'),62.75)
near(value('配方配置','D22'),.18);near(value('收益推演','H7'),60);near(value('收益推演','H13'),-20)
n.getRange('C12').values=[[120]];wb.recalculate();near(value('收益推演','H7'),40);near(value('收益推演','C24'),840)
n.getRange('C12').values=[[100]]
p.getRange('J6').values=[[6]];wb.recalculate();near(value('配方配置','E13'),90)
p.getRange('J6').values=[[5]];wb.recalculate();near(value('配方配置','E13'),75)
for(let i=0;i<report.scenarios.length;i++){
 const s=report.scenarios[i],r=6+i
 assert.ok(Math.abs(value('收益推演',`E${r}`)-s.fourPlotsNoTheftNetPerRealDay)<.006)
 assert.ok(Math.abs(value('收益推演',`H${r}`)-s.dogAdvantageOverMaxTheft)<.006)
}
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'final formula error scan'})
console.log(errors.ndjson)
console.log((await wb.inspect({kind:'table',range:'配方配置!A12:G15',include:'values,formulas',tableMaxRows:4,tableMaxCols:7,maxChars:1600})).ndjson)
for(const [name,range] of [['概述','A1:D14'],['系统规则','A1:D25'],['商品目录','A1:G41'],['数值配置','A1:H33'],['配方配置','A1:K24'],['收益推演','A1:H27'],['UI要点','A1:D17'],['边界与异常','A1:D16'],['开放问题','A1:D13']]){
 const exists=await fs.access(`${out}/preview-${name}.png`).then(()=>true,()=>false)
 if(exists&&!['数值配置','配方配置'].includes(name))continue
 const blob=await wb.render({sheetName:name,range,scale:1.5,format:'png'})
 await fs.writeFile(`${out}/preview-${name}.png`,new Uint8Array(await blob.arrayBuffer()))
}
await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/勇敢人生-商品与生活经营策划初稿.xlsx`)
console.log('Exported 9 sheets, 36 goods; verified formulas, 12 scenarios and restored input changes.')
