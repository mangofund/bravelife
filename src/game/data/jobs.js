// 职业：每个职业绑定一个地点，有上班时间窗口和若干职级
// req 为该职级的能力/声望门槛；升职还需要在当前职级完成 promoteShifts 次班次

export const PROMOTE_SHIFTS = 5

export const CAREERS = {
  konbini: {
    name: '便利店店员',
    icon: '🏪',
    location: 'konbini',
    window: [0, 24],
    hours: 6,
    gain: { int: 0.5, cha: 0.5 },
    levels: [
      { title: '兼职店员', pay: 7200, req: {} },
      { title: '副店长', pay: 10800, req: { int: 15 } },
      { title: '店长', pay: 16200, req: { int: 30, cha: 20 } }
    ]
  },
  office: {
    name: '商社职员',
    icon: '🏢',
    location: 'marunouchi',
    window: [7, 10],
    hours: 8,
    gain: { int: 1, cha: 1 },
    levels: [
      { title: '新人职员', pay: 12000, req: { int: 10 } },
      { title: '主任', pay: 18000, req: { int: 20, cha: 10 } },
      { title: '课长', pay: 30000, req: { int: 40, cha: 25 } },
      { title: '部长', pay: 55000, req: { int: 60, cha: 45 } },
      { title: '社长', pay: 90000, req: { int: 85, cha: 75, rep: 30 } }
    ]
  },
  tech: {
    name: '程序员',
    icon: '💻',
    location: 'shibuya_tech',
    window: [9, 12],
    hours: 8,
    gain: { int: 1, cre: 1 },
    levels: [
      { title: '实习生', pay: 10000, req: { int: 10 } },
      { title: '工程师', pay: 25000, req: { int: 25, cre: 15 } },
      { title: '高级工程师', pay: 45000, req: { int: 50, cre: 35 } },
      { title: '技术总监', pay: 75000, req: { int: 75, cre: 55 } },
      { title: 'CTO', pay: 100000, req: { int: 90, cre: 75 } }
    ]
  },
  chef: {
    name: '厨师',
    icon: '🔪',
    location: 'tsukiji',
    window: [5, 9],
    hours: 7,
    gain: { cook: 2 },
    levels: [
      { title: '学徒', pay: 9000, req: {} },
      { title: '帮厨', pay: 15000, req: { cook: 20 } },
      { title: '料理长', pay: 30000, req: { cook: 50, cre: 30 } },
      { title: '名店主厨', pay: 60000, req: { cook: 80, cre: 60 } }
    ]
  },
  idol: {
    name: '艺人',
    icon: '🎤',
    location: 'livehouse',
    window: [16, 20],
    hours: 5,
    gain: { cha: 1, cre: 1 },
    rep: 1,
    levels: [
      { title: '练习生', pay: 6000, req: { cha: 10 } },
      { title: '地下偶像', pay: 14000, req: { cha: 25, cre: 15 } },
      { title: '人气艺人', pay: 40000, req: { cha: 60, cre: 45 } },
      { title: '国民巨星', pay: 120000, req: { cha: 90, cre: 80, rep: 70 } }
    ]
  },
  doctor: {
    name: '医护',
    icon: '🩺',
    location: 'hospital',
    window: [7, 10],
    hours: 9,
    gain: { int: 1 },
    levels: [
      { title: '护工', pay: 11000, req: {} },
      { title: '护士', pay: 20000, req: { int: 30 } },
      { title: '住院医生', pay: 40000, req: { int: 60 } },
      { title: '主任医师', pay: 80000, req: { int: 85, fit: 30 } }
    ]
  },
  police: {
    name: '警察',
    icon: '👮',
    location: 'police',
    window: [6, 9],
    hours: 8,
    gain: { fit: 1, int: 0.5 },
    rep: 0.5,
    levels: [
      { title: '巡查', pay: 13000, req: { fit: 15 } },
      { title: '巡查部长', pay: 20000, req: { fit: 30, int: 15 } },
      { title: '警部', pay: 32000, req: { fit: 50, int: 35 } },
      { title: '警视总监', pay: 70000, req: { fit: 70, int: 60, rep: 40 } }
    ]
  }
}
