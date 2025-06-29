import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryViewProps, Project } from '../../shared/categoryTypes'
import { posterAnimations, scrollAnimations } from '../../shared/transitions'
import { PosterDetail } from './PosterDetail'
import styles from './PostersGrid.module.css'

const PostersGrid: React.FC<CategoryViewProps> = ({
  projects,
  onProjectSelect,
  onBack,
}) => {
  const [selectedPoster, setSelectedPoster] = useState<Project | null>(null)
  const [gridLayout, setGridLayout] = useState<'masonry' | 'grid'>('masonry')
  const gridRef = useRef<HTMLDivElement>(null)
  const posterRefs = useRef<(HTMLDivElement | null)[]>([])
  const animationsRef = useRef<gsap.core.Tween[]>([])

  // Initialize grid animations
  useEffect(() => {
    if (!gridRef.current) return

    // Clear previous animations
    animationsRef.current.forEach((anim) => anim.kill())
    animationsRef.current = []

    // Animate grid entrance
    gsap.fromTo(
      gridRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' }
    )

    // Stagger poster animations
    posterRefs.current.forEach((poster, index) => {
      if (!poster) return

      // Initial reveal animation
      const revealAnim = gsap.fromTo(
        poster,
        {
          opacity: 0,
          scale: 0.85,
          y: 60,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1,
          ease: 'power3.out',
        }
      )

      // Breathing animation for subtle movement
      const breatheAnim = posterAnimations.breathe(poster)

      // Scroll-triggered parallax
      const parallaxAnim = scrollAnimations.parallax(poster, 0.1 * (index % 3))

      animationsRef.current.push(revealAnim, breatheAnim, parallaxAnim)
    })

    return () => {
      animationsRef.current.forEach((anim) => anim.kill())
    }
  }, [projects, gridLayout])

  const handlePosterHover = (index: number, event: React.MouseEvent) => {
    const poster = posterRefs.current[index]
    if (poster) {
      posterAnimations.parallaxHover(poster, event.nativeEvent)
    }
  }

  const handlePosterLeave = (index: number) => {
    const poster = posterRefs.current[index]
    if (poster) {
      posterAnimations.parallaxReset(poster)
    }
  }

  const handlePosterClick = (project: Project, index: number) => {
    const poster = posterRefs.current[index]
    if (!poster) return

    // Animate poster peeling off
    const targetRect = {
      left: window.innerWidth / 2 - 400,
      top: 100,
      width: 800,
      height: 600,
    } as DOMRect

    posterAnimations.peelOff(poster, targetRect).then(() => {
      setSelectedPoster(project)
      onProjectSelect(project)
    })
  }

  const handleDetailClose = () => {
    setSelectedPoster(null)
    if (onBack) onBack()
  }

  const getMasonryStyle = (index: number) => {
    // Create varied heights for masonry effect
    const heights = [300, 400, 350, 450, 380]
    const height = heights[index % heights.length]

    return {
      height: `${height}px`,
      gridRow: `span ${Math.ceil(height / 100)}`,
    }
  }

  return (
    <>
      <div className={styles.gridControls}>
        <button
          className={`${styles.layoutToggle} ${gridLayout === 'masonry' ? styles.active : ''}`}
          onClick={() => setGridLayout('masonry')}
        >
          Masonry
        </button>
        <button
          className={`${styles.layoutToggle} ${gridLayout === 'grid' ? styles.active : ''}`}
          onClick={() => setGridLayout('grid')}
        >
          Grid
        </button>
      </div>

      <div
        ref={gridRef}
        className={`${styles.postersGrid} ${styles[gridLayout]}`}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            ref={(el) => (posterRefs.current[index] = el)}
            className={styles.posterWrapper}
            style={
              gridLayout === 'masonry' ? getMasonryStyle(index) : undefined
            }
            onMouseMove={(e) => handlePosterHover(index, e)}
            onMouseLeave={() => handlePosterLeave(index)}
            onClick={() => handlePosterClick(project, index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={styles.posterContent}
              style={{ backgroundColor: project.color }}
            >
              {project.image && (
                <div className={styles.posterImage}>
                  {/* Replace with actual image when available */}
                  <div className={styles.imagePlaceholder}>
                    <span>{project.title}</span>
                  </div>
                </div>
              )}
              <div className={styles.posterOverlay}>
                <h3>{project.title}</h3>
                <p>{project.year}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPoster && (
          <PosterDetail
            project={selectedPoster}
            projects={projects}
            onClose={handleDetailClose}
            onNavigate={setSelectedPoster}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default PostersGrid
