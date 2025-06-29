import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CategoryNav } from './CategoryNav'
import { CategoryId, CATEGORIES, Project } from './shared/categoryTypes'
import { pageTransition } from './shared/transitions'
import styles from './CategoryRouter.module.css'
import { projects as projectData } from '../../data/projects'

// Lazy load category components
const PostersCategory = lazy(
  () => import('./categories/PostersCategory/PostersGrid')
)
const GraphicDesignCategory = lazy(
  () => import('./categories/GraphicDesignCategory/DesignCaseStudy')
)
const MarketResearchCategory = lazy(
  () => import('./categories/MarketResearchCategory/DataStory')
)
const VideoCategory = lazy(
  () => import('./categories/VideoCategory/VideoGallery')
)
const AAFCategory = lazy(
  () => import('./categories/AAFCategory/CampaignPresentation')
)

const categoryComponents = {
  posters: PostersCategory,
  'graphic-design': GraphicDesignCategory,
  'market-research': MarketResearchCategory,
  video: VideoCategory,
  aaf: AAFCategory,
}

interface CategoryRouterProps {
  initialCategory?: CategoryId
}

export const CategoryRouter: React.FC<CategoryRouterProps> = ({
  initialCategory = 'posters',
}) => {
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>(initialCategory)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter projects by active category
  const categoryProjects = projectData.filter(
    (project) =>
      project.category.toLowerCase().replace(' ', '-') === activeCategory
  )

  // Apply theme when category changes
  useEffect(() => {
    const category = CATEGORIES[activeCategory]
    if (category.theme) {
      document.documentElement.setAttribute('data-theme', category.theme)
    }
  }, [activeCategory])

  const handleCategoryChange = (categoryId: CategoryId) => {
    if (categoryId === activeCategory) return

    // Animate transition
    if (containerRef.current) {
      pageTransition.fadeOut(containerRef.current, () => {
        setActiveCategory(categoryId)
        setSelectedProject(null)
      })
    } else {
      setActiveCategory(categoryId)
      setSelectedProject(null)
    }
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
  }

  const handleBack = () => {
    setSelectedProject(null)
  }

  const CategoryComponent = categoryComponents[activeCategory]
  const category = CATEGORIES[activeCategory]

  return (
    <div className={styles.categoryRouter}>
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className={styles.categoryHeader}>
        <motion.h1
          key={category.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {category.title}
        </motion.h1>
        <motion.p
          key={category.description}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {category.description}
        </motion.p>
      </div>

      <div ref={containerRef} className={styles.categoryContent}>
        <AnimatePresence mode="wait">
          <Suspense
            fallback={
              <motion.div
                className={styles.loading}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.loadingSpinner} />
              </motion.div>
            }
          >
            <CategoryComponent
              projects={categoryProjects}
              onProjectSelect={handleProjectSelect}
              onBack={selectedProject ? handleBack : undefined}
            />
          </Suspense>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CategoryRouter
