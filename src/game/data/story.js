// 剧情事件总表（按顺序判定，排在前面的先触发）与人生阶段的章节目标
import { SCHOOL_STORIES } from './story-school.js'
import { NPC_STORIES } from './story-npc.js'
import { LIFE_STORIES } from './story-life.js'

export const STORIES = [].concat(LIFE_STORIES.slice(0, 1), LIFE_STORIES.slice(-1), SCHOOL_STORIES, NPC_STORIES, LIFE_STORIES.slice(1, -1))

export const STORY_MAP = STORIES.reduce((m, s) => {
  m[s.id] = s
  return m
}, {})

// 每天最多触发几段剧情（不含上学这类日常）
export const STORY_PER_DAY = 2

// 选项标签：勇敢类给勇气，其余三类各 +5
export const TAGS = {
  brave: { name: '勇敢', courage: 10, os: 'brave' },
  crazy: { name: '发疯', courage: 5, os: 'brave' },
  lazy: { name: '摆烂', courage: 0, os: 'lazy' },
  stunt: { name: '整活', courage: 5, os: 'brave' }
}

// 章节目标：完成一个勇气 +10。key 为阶段 id（engine/calendar.js 的 stageId）
export const STAGE_GOALS = {
  elem: [
    { id: 'first_friend', text: '交到第一个好朋友（任意同学好感 ≥ 50）', check: (s) => Object.keys(s.social).some((k) => s.social[k].aff >= 50) },
    { id: 'bike', text: '学会骑自行车（攒钱去银座买，或者等生日）', check: (s) => !!(s.vehicles && s.vehicles.bike) },
    { id: 'dream', text: '在作文课上写下自己的小梦想', check: (s) => !!s.profile.dream },
    { id: 'solo_train', text: '第一次一个人坐电车去远处', check: (s) => Object.keys(s.visited).some((k) => s.visited[k] === 'train') },
    { id: 'shop', text: '下雨的晚上（20 点后）在外面走走，也许会遇到什么', check: (s) => !!s.story.flags.shop_found }
  ]
}

export const GOAL_COURAGE = 10
