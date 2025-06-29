import { CategoryViewProps } from '../../shared/categoryTypes'

const VideoGallery: React.FC<CategoryViewProps> = ({ projects }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Video Production Showcase</h2>
      <p>Coming soon: Cinematic previews with auto-play and theater mode</p>
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

export default VideoGallery
