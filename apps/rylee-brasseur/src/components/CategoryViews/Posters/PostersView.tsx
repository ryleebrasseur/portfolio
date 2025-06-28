import React from 'react'
import { Project } from '../../CategorySystem/shared/categoryTypes'
import styles from './PostersView.module.css'

interface PostersViewProps {
  projects: Project[]
}

const PostersView: React.FC<PostersViewProps> = ({ projects }) => {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {projects.map((project) => (
          <div key={project.id} className={styles.posterCard}>
            <div className={styles.posterImage}>
              <div
                className={styles.posterGradient}
                style={{
                  background: `linear-gradient(135deg, ${project.color}88, ${project.color}ff)`,
                }}
              />
            </div>
            <div className={styles.posterInfo}>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <span className={styles.year}>{project.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PostersView
