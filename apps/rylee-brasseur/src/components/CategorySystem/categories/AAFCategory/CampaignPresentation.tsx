import { CategoryViewProps } from '../../shared/categoryTypes'

const CampaignPresentation: React.FC<CategoryViewProps> = ({ projects }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>AAF Campaign Presentations</h2>
      <p>Coming soon: Step-through campaign elements with presentation mode</p>
      <div style={{ marginTop: '2rem' }}>
        {projects.map((project) => (
          <div key={project.id} style={{ marginBottom: '1rem' }}>
            <h3>{project.title}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CampaignPresentation
