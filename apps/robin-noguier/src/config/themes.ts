export interface Theme {
  id: string
  label: string
  preview: [string, string] // gradient colors
}

export const themes: Theme[] = [
  {
    id: 'sunset',
    label: 'Sunset',
    preview: ['#ff8c94', '#ffd166'],
  },
  {
    id: 'cyberpunk',
    label: 'Cyber',
    preview: ['#00ffaa', '#ff0080'],
  },
  {
    id: 'att',
    label: 'AT&T',
    preview: ['#00a8e0', '#ffffff'],
  },
  {
    id: 'msu',
    label: 'MSU',
    preview: ['#18453b', '#ffffff'],
  },
]
