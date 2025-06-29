import { CategoryViewProps } from '../../shared/categoryTypes'

const DataStory: React.FC<CategoryViewProps> = ({ projects }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Market Research Data Stories</h2>
      <p>Coming soon: Interactive data visualizations and animated insights</p>
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

export default DataStory
