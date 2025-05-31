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
}

export const projects: Project[] = [
  {
    id: 'project-1',
    title: 'UN Security Council Reform',
    category: 'Policy Analysis',
    description:
      'Comprehensive analysis of proposed reforms to the UN Security Council structure and voting mechanisms',
    image: 'gradient-1',
    secondaryImage: 'gradient-2',
    color: '#FF6B6B',
    year: 2024,
  },
  {
    id: 'project-2',
    title: 'Climate Diplomacy in the Pacific',
    category: 'Research Paper',
    description:
      'Examining multilateral climate negotiations and small island developing states advocacy',
    image: 'gradient-3',
    secondaryImage: 'gradient-4',
    color: '#4ECDC4',
    year: 2024,
  },
  {
    id: 'project-3',
    title: 'NATO-EU Relations Study',
    category: 'Strategic Analysis',
    description:
      'Analysis of transatlantic security cooperation and defense integration challenges',
    image: 'gradient-5',
    secondaryImage: 'gradient-6',
    color: '#45B7D1',
    year: 2023,
  },
  {
    id: 'project-4',
    title: 'Model UN Leadership',
    category: 'Leadership Experience',
    description:
      'Head Delegate representing Germany in Security Council simulation on nuclear non-proliferation',
    image: 'gradient-7',
    secondaryImage: 'gradient-8',
    color: '#F7DC6F',
    year: 2023,
  },
  {
    id: 'project-5',
    title: 'Refugee Policy Research',
    category: 'Field Research',
    description:
      'Field study on refugee integration policies in European Union member states',
    image: 'gradient-9',
    secondaryImage: 'gradient-10',
    color: '#BB8FCE',
    year: 2023,
  },
]
