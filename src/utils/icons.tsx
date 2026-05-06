import { type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
  FaRocket,
  FaCogs,
  FaMobileAlt,
  FaCloud,
  FaLock,
  FaDatabase,
  FaChartLine,
  FaPaintBrush,
  FaGlobe,
  FaFolderOpen,
  FaCode,
  FaCheckCircle,
  FaClock,
} from 'react-icons/fa'

const EMOJI_ICON_KEY_MAP: Record<string, string> = {
  '🚀': 'rocket',
  '⚙️': 'cogs',
  '📱': 'mobile',
  '☁️': 'cloud',
  '🔒': 'lock',
  '🗄️': 'database',
  '📊': 'chart',
  '🎨': 'design',
  '🌍': 'globe',
}

const PROJECT_ICON_COMPONENTS: Record<string, IconType> = {
  rocket: FaRocket,
  cogs: FaCogs,
  mobile: FaMobileAlt,
  cloud: FaCloud,
  lock: FaLock,
  database: FaDatabase,
  chart: FaChartLine,
  design: FaPaintBrush,
  globe: FaGlobe,
}

export { PROJECT_ICON_COMPONENTS }

export function normalizeProjectIconInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return EMOJI_ICON_KEY_MAP[trimmed] || trimmed
}

export function renderProjectIcon(value: string): ReactNode {
  const trimmed = value?.trim() || ''
  if (!trimmed) return <FaFolderOpen />

  const Icon = PROJECT_ICON_COMPONENTS[trimmed.toLowerCase()]
  if (Icon) return <Icon />

  return trimmed
}

export function renderStageIcon(value: string): ReactNode {
  const trimmed = value?.trim() || ''
  if (!trimmed) return <FaCode />

  if (trimmed === 'check') return <FaCheckCircle />
  if (trimmed === 'dot') return <FaClock />
  if (/^\d+$/.test(trimmed)) return trimmed

  return trimmed.length <= 2 ? trimmed : <FaCode />
}