// 设计用预算模型；不运行游戏引擎，不代表真实玩家行为。
import { writeFileSync } from 'node:fs'
const living = { foodPerDay: 1200, transitPerDay: 600, days: 7 }
const scenarios = [
  { id: 'normal-current-store', label: '普通家庭·当前便利店', cash: 800000, rent: 35000, pay: 7200, shifts: 5 },
  { id: 'self-current-store', label: '白手起家·当前便利店', cash: 150000, rent: 15000, pay: 8280, shifts: 5 },
  { id: 'normal-current-office', label: '普通家庭·商社新人', cash: 800000, rent: 35000, pay: 12000, shifts: 5 },
  { id: 'normal-candidate-store', label: '普通家庭·候选便利店', cash: 800000, rent: 35000, pay: 10800, shifts: 5 },
  { id: 'self-candidate-store', label: '白手起家·候选便利店', cash: 150000, rent: 15000, pay: 12420, shifts: 5 },
  { id: 'self-unemployed', label: '白手起家·无业观察', cash: 150000, rent: 15000, pay: 0, shifts: 0 }
].map(s => {
  const expenses = s.rent + (living.foodPerDay + living.transitPerDay) * living.days
  const net = s.pay * s.shifts - expenses
  return { ...s, expenses, weeklyNet: net, weeklyNetWithRental: net - 2000,
    endingCashWithRental: s.cash + net - 2000 }
})
const day = { sleep: 8, work: 6, transit: 1, foodAndCare: 1, preparation: 1.5 }
const time = { ...day, free: 24 - Object.values(day).reduce((a,b)=>a+b,0),
 energyLoss: (24-day.sleep)*2.5 + day.work + 6 + 3,
 sleepRecovery: day.sleep * 11 }
const rewards = { stageAttempt:20, contextChoice:8, reflection:5, alternativeCancellation:8, alternativeRepair:5 }
const result = { assumptions: { ...living, rentPayments:1, includesTutorialRewards:false, includesPromotion:false, includesRandomEvents:false }, scenarios, time,
 rewards: { ...rewards, performanceRouteMax:33, cancellationRouteMax:13, repeatedNodeGain:0 },
 note:'一周预算按一次房租计；精力估算基于普通床铺、非饥饿、无额外疾病；非引擎集成测试。' }
writeFileSync(new URL('./gameplay-balance.json', import.meta.url), JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
