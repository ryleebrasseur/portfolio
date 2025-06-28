import { CategoryViewProps } from '../../shared/categoryTypes'
import styles from './DesignCaseStudy.module.css'

const DesignCaseStudy: React.FC<CategoryViewProps> = ({ projects }) => {
  return (
    <div className={styles.caseStudyContainer}>
      <h2>Graphic Design Case Studies</h2>
      <p>
        Coming soon: Detailed case studies with process reveals and typography
        animations
      </p>
      <div className={styles.projectList}>
        {projects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DesignCaseStudy
