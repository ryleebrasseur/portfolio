import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Project } from '../../shared/categoryTypes'
import styles from './PosterDetail.module.css'

interface PosterDetailProps {
  project: Project
  projects: Project[]
  onClose: () => void
  onNavigate: (project: Project) => void
}

export const PosterDetail: React.FC<PosterDetailProps> = ({
  project,
  projects,
  onClose,
  onNavigate,
}) => {
  const detailRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Find current index and adjacent projects
  const currentIndex = projects.findIndex((p) => p.id === project.id)
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null
  const nextProject =
    currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null

  const handleNavigate = useCallback(
    (newProject: Project) => {
      // Animate transition
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 0,
          x: newProject.id > project.id ? -50 : 50,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onNavigate(newProject)
            gsap.fromTo(
              contentRef.current,
              { opacity: 0, x: newProject.id > project.id ? 50 : -50 },
              { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            )
          },
        })
      }
    },
    [project.id, onNavigate]
  )

  useEffect(() => {
    if (detailRef.current && contentRef.current) {
      // Animate entrance
      gsap.fromTo(
        detailRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      )

      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          delay: 0.1,
          ease: 'power3.out',
        }
      )
    }

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && prevProject) {
        handleNavigate(prevProject)
      } else if (e.key === 'ArrowRight' && nextProject) {
        handleNavigate(nextProject)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, prevProject, nextProject, onClose, handleNavigate])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && nextProject) {
      handleNavigate(nextProject)
    } else if (direction === 'right' && prevProject) {
      handleNavigate(prevProject)
    }
  }

  return (
    <motion.div
      ref={detailRef}
      className={styles.posterDetail}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className={styles.detailContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className={styles.navigation}>
          <button
            className={styles.navButton}
            onClick={() => prevProject && handleNavigate(prevProject)}
            disabled={!prevProject}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 15L7 10L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className={styles.counter}>
            {currentIndex + 1} / {projects.length}
          </span>

          <button
            className={styles.navButton}
            onClick={() => nextProject && handleNavigate(nextProject)}
            disabled={!nextProject}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M8 5L13 10L8 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <motion.div
          className={styles.posterDisplay}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) {
              handleSwipe('right')
            } else if (info.offset.x < -100) {
              handleSwipe('left')
            }
          }}
        >
          <div
            className={styles.posterFrame}
            style={{ backgroundColor: project.color }}
          >
            <div className={styles.posterImageLarge}>
              <span>{project.title}</span>
            </div>
          </div>
        </motion.div>

        <div className={styles.posterInfo}>
          <h2>{project.title}</h2>
          <p className={styles.year}>{project.year}</p>
          <p className={styles.description}>{project.description}</p>

          {project.tags && (
            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
