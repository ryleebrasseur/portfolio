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
  // Posters
  {
    id: 'project-1',
    title: 'Economic Impact Study',
    category: 'Posters',
    description:
      'Visual presentation analyzing market trends and consumer behavior patterns',
    image: 'gradient-1',
    secondaryImage: 'gradient-2',
    color: '#FF6B6B',
    year: 2024,
  },
  {
    id: 'project-6',
    title: 'Climate Change Awareness',
    category: 'Posters',
    description:
      'Data visualization poster series on environmental impact and sustainability',
    image: 'gradient-11',
    secondaryImage: 'gradient-12',
    color: '#FF8C94',
    year: 2023,
  },
  {
    id: 'project-7',
    title: 'Urban Planning Infographic',
    category: 'Posters',
    description:
      'Large-scale poster mapping city development and population density patterns',
    image: 'gradient-13',
    secondaryImage: 'gradient-14',
    color: '#FF5757',
    year: 2023,
  },
  // Graphic Design
  {
    id: 'project-2',
    title: 'Brand Identity Development',
    category: 'Graphic Design',
    description:
      'Complete visual identity system for emerging sustainable fashion brand',
    image: 'gradient-3',
    secondaryImage: 'gradient-4',
    color: '#4ECDC4',
    year: 2024,
  },
  {
    id: 'project-8',
    title: 'Restaurant Rebrand',
    category: 'Graphic Design',
    description:
      'Modern identity redesign for local farm-to-table restaurant chain',
    image: 'gradient-15',
    secondaryImage: 'gradient-16',
    color: '#5DADE2',
    year: 2024,
  },
  // Market Research
  {
    id: 'project-3',
    title: 'Consumer Insights Analysis',
    category: 'Market Research',
    description:
      'Comprehensive study of Gen Z purchasing behaviors in digital marketplaces',
    image: 'gradient-5',
    secondaryImage: 'gradient-6',
    color: '#45B7D1',
    year: 2023,
  },
  {
    id: 'project-9',
    title: 'Social Media Trends Report',
    category: 'Market Research',
    description:
      'Deep dive into emerging platforms and content consumption habits',
    image: 'gradient-17',
    secondaryImage: 'gradient-18',
    color: '#5499C7',
    year: 2024,
  },
  // Video Production
  {
    id: 'project-4',
    title: 'Documentary Short',
    category: 'Video Production',
    description:
      'Profile piece exploring cross-cultural communication in international business',
    image: 'gradient-7',
    secondaryImage: 'gradient-8',
    color: '#F7DC6F',
    year: 2023,
  },
  {
    id: 'project-10',
    title: 'Brand Storytelling Series',
    category: 'Video Production',
    description:
      'Five-part video series showcasing artisan craftsmanship and heritage',
    image: 'gradient-19',
    secondaryImage: 'gradient-20',
    color: '#F4D03F',
    year: 2024,
  },
  // AAF
  {
    id: 'project-5',
    title: 'AAF Campaign Strategy',
    category: 'AAF',
    description:
      'National student advertising competition entry for Fortune 500 client',
    image: 'gradient-9',
    secondaryImage: 'gradient-10',
    color: '#BB8FCE',
    year: 2023,
  },
]
