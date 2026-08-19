import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const CN_DIGITS = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

function cnToNum(str) {
  if (/^十$/.test(str)) return 10
  const m = str.match(/^(零|一|二|三|四|五|六|七|八|九)?十(零|一|二|三|四|五|六|七|八|九)?$/)
  if (m) {
    const tens = m[1] ? CN_DIGITS[m[1]] : 1
    const ones = m[2] ? CN_DIGITS[m[2]] : 0
    return tens * 10 + ones
  }
  return CN_DIGITS[str] ?? 0
}

function chineseNumber(str) {
  const m = str.match(/第([零一二三四五六七八九十百]+)[章卷]/)
  return m ? cnToNum(m[1]) : Number.MAX_SAFE_INTEGER
}

function firstHeading(filePath, fallback) {
  try {
    const line = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)[0]?.trim()
    if (line && line.startsWith('# ')) return line.replace(/^#\s+/, '').trim()
  } catch {}
  return fallback
}

function outlineFileName() {
  return fs
    .readdirSync(rootDir)
    .find((f) => f.endsWith('.md') && f.includes('大纲'))
}

function buildSidebar() {
  const volumes = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^第[零一二三四五六七八九十百]+卷/.test(d.name))
    .sort((a, b) => chineseNumber(a.name) - chineseNumber(b.name))

  const sidebar = []

  const outlineFile = outlineFileName()
  if (outlineFile) {
    sidebar.push({
      text: '完整写作大纲',
      link: '/' + outlineFile.replace(/\.md$/, ''),
    })
  }

  volumes.forEach((vol, i) => {
    const volPath = path.join(rootDir, vol.name)
    const chapters = fs
      .readdirSync(volPath)
      .filter((f) => f.endsWith('.md'))
      .sort((a, b) => chineseNumber(a) - chineseNumber(b))
      .map((f) => ({
        text: firstHeading(path.join(volPath, f), f.replace(/\.md$/, '')),
        link: `/${vol.name}/${f.replace(/\.md$/, '')}`,
      }))
    sidebar.push({ text: vol.name, collapsed: i !== 0, items: chapters })
  })

  return sidebar
}

const outlineLink = outlineFileName()
  ? '/' + outlineFileName().replace(/\.md$/, '')
  : '/'

export default {
  lang: 'zh-CN',
  title: '凡人修仙传·玄骨外传',
  description:
    '凡人修仙传正传正统衍生外传。天纵奇才、元婴枭雄，半生风光、千年隐忍，遭最亲之人背刺，从星海巨擘沦为阴地残魂。',
  cleanUrls: true,
  srcExclude: ['**/.zcode/**'],
  head: [['link', { rel: 'stylesheet', href: '/custom.css' }]],
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '写作大纲', link: outlineLink },
    ],
    sidebar: buildSidebar(),
    outline: { label: '本章目录', level: [2, 3] },
    docFooter: { prev: '上一章', next: '下一章' },
    lastUpdated: { text: '最近更新', formatOptions: { dateStyle: 'medium', timeStyle: 'short' } },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索章节', buttonAriaLabel: '搜索章节' },
          modal: {
            noResultsText: '未找到相关内容',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '语言',
    footer: {
      message: '凡人修仙传·玄骨外传 —— 仅供个人阅读收藏',
      copyright: '故事为爱好者创作的同人作品',
    },
  },
}