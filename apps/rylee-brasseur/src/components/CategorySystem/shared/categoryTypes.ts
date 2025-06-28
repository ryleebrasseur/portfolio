export type CategoryId =
  | 'posters'
  | 'graphic-design'
  | 'market-research'
  | 'video'
  | 'aaf'

export interface Category {
  id: CategoryId
  name: string
  title: string
  description: string
  theme: string
  icon?: string
}

export interface CategoryViewProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  onBack?: () => void
}

export interface Project {
  id: string
  title: string
  category: string
  description: string
  image: string
  secondaryImage?: string
  videoPreview?: string
  color: string
  year: number
  // Extended properties for rich content
  images?: string[]
  process?: ProcessStep[]
  credits?: Credit[]
  link?: string
  tags?: string[]
}

export interface ProcessStep {
  title: string
  description: string
  image?: string
}

export interface Credit {
  role: string
  name: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  posters: {
    id: 'posters',
    name: 'Posters',
    title: 'Gallery Wall',
    description: 'A collection of visual storytelling through poster design',
    theme: 'poster-theme',
  },
  'graphic-design': {
    id: 'graphic-design',
    name: 'Graphic Design',
    title: 'Design Case Studies',
    description: 'Deep dives into brand identity and visual systems',
    theme: 'design-theme',
  },
  'market-research': {
    id: 'market-research',
    name: 'Market Research',
    title: 'Data Stories',
    description: 'Insights and analysis brought to life through visualization',
    theme: 'research-theme',
  },
  video: {
    id: 'video',
    name: 'Video Production',
    title: 'Cinematic Works',
    description: 'Motion picture storytelling and documentary work',
    theme: 'video-theme',
  },
  aaf: {
    id: 'aaf',
    name: 'AAF',
    title: 'Campaign Presentations',
    description: 'Strategic advertising campaigns for national competitions',
    theme: 'aaf-theme',
  },
}
