import React, { useEffect, useRef, useState, useMemo } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { projects } from '../../data/projects'
import CategoryLauncher, { CategoryData } from '../CategoryLauncher'
import PostersView from '../CategoryViews/Posters'
import CategoryViewPlaceholder from '../CategoryViews/CategoryViewPlaceholder'
import styles from './AccordionProjects.module.css'

gsap.registerPlugin(ScrollTrigger)

export interface AccordionProjectsProps {
  className?: string
}

type Category = CategoryData

type ViewMode = 'categories' | 'projects'

const AccordionProjects: React.FC<AccordionProjectsProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const hasAnimatedRef = useRef(false)
  const [viewMode] = useState<ViewMode>('categories')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [launcherOpen, setLauncherOpen] = useState(false)
  const clickedElementRef = useRef<HTMLElement | null>(null)

  // Create categories from projects data
  const categories = useMemo<Category[]>(() => {
    const categoryMap = new Map<string, { count: number; color: string }>()

    projects.forEach((project) => {
      const existing = categoryMap.get(project.category)
      if (existing) {
        existing.count++
      } else {
        categoryMap.set(project.category, { count: 1, color: project.color })
      }
    })

    const categoryDescriptions: Record<string, string> = {
      Posters:
        'Visual storytelling through impactful poster design and data visualization',
      'Graphic Design':
        'Brand identity, visual systems, and creative direction',
      'Market Research':
        'Consumer insights, trend analysis, and strategic recommendations',
      'Video Production':
        'Documentary films, promotional content, and multimedia storytelling',
      AAF: 'National advertising competition campaigns and integrated marketing strategies',
    }

    // Define custom colors for categories if not already set
    const categoryColors: Record<string, string> = {
      Posters: '#FF6B6B',
      'Graphic Design': '#4ECDC4',
      'Market Research': '#45B7D1',
      'Video Production': '#F7DC6F',
      AAF: '#BB8FCE',
    }

    return Array.from(categoryMap.entries()).map(
      ([name, { count }], index) => ({
        id: `category-${index}`,
        name,
        count,
        color: categoryColors[name] || '#888888',
        description: categoryDescriptions[name] || '',
      })
    )
  }, [])

  // Get projects for selected category
  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return projects
    return projects.filter(
      (project) => project.category === selectedCategory.name
    )
  }, [selectedCategory])

  useEffect(() => {
    if (!containerRef.current) return

    // Refresh ScrollTrigger after a brief delay to ensure Lenis is ready
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    const showTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => setIsVisible(true),
      onLeave: () => setIsVisible(false),
      onEnterBack: () => setIsVisible(true),
      onLeaveBack: () => setIsVisible(false),
      // Mobile-specific settings
      anticipatePin: 0, // Disable anticipate pin on mobile
      fastScrollEnd: true, // Better mobile performance
      preventOverlaps: true, // Prevent animation conflicts
      refreshPriority: 0, // Lower priority for smoother scrolling
    })

    return () => {
      clearTimeout(refreshTimeout)
      showTrigger.kill()
    }
  }, [])

  useEffect(() => {
    if (!listRef.current) return

    const updateGridColumns = () => {
      const items = viewMode === 'categories' ? categories : filteredProjects
      const cols = items
        .map((_, i) => (i === activeIndex ? '10fr' : '1fr'))
        .join(' ')
      listRef.current!.style.gridTemplateColumns = cols
    }

    updateGridColumns()
  }, [activeIndex, viewMode, categories, filteredProjects])

  useGSAP(() => {
    if (!isVisible || hasAnimatedRef.current) return

    gsap.from(`.${styles.projectItem}`, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      onComplete: () => {
        hasAnimatedRef.current = true
      },
    })
  }, { scope: containerRef, dependencies: [isVisible] })

  const handleHover = (index: number) => {
    setActiveIndex(index)
  }

  const handleCategoryClick = (
    category: Category,
    event: React.MouseEvent<HTMLLIElement>
  ) => {
    // Store the clicked element
    clickedElementRef.current = event.currentTarget

    // Set the selected category and open the launcher
    setSelectedCategory(category)
    setLauncherOpen(true)
  }

  const handleLauncherClose = () => {
    setLauncherOpen(false)
    // Reset after animation completes
    setTimeout(() => {
      setSelectedCategory(null)
      clickedElementRef.current = null
    }, 800)
  }

  const renderCategoryContent = (category: Category) => {
    const categoryProjects = projects.filter(
      (p) => p.category === category.name
    )

    switch (category.name) {
      case 'Posters':
        return <PostersView projects={categoryProjects} />
      case 'Graphic Design':
      case 'Market Research':
      case 'Video Production':
      case 'AAF':
        return (
          <CategoryViewPlaceholder
            categoryName={category.name}
            projects={categoryProjects}
          />
        )
      default:
        return (
          <CategoryViewPlaceholder
            categoryName={category.name}
            projects={categoryProjects}
          />
        )
    }
  }

  const renderCategoryItem = (category: Category, index: number) => (
    <li
      key={category.id}
      className={styles.projectItem}
      data-active={index === activeIndex}
      onMouseEnter={() => handleHover(index)}
      onFocus={() => handleHover(index)}
      onClick={(e) => handleCategoryClick(category, e)}
      tabIndex={0}
      role="button"
      aria-expanded={index === activeIndex}
      aria-label={`${category.name} category with ${category.count} projects. ${index === activeIndex ? 'Expanded' : 'Collapsed'}`}
    >
      <article className={styles.article}>
        <h3>{category.name}</h3>
        <div className={styles.content}>
          <span className={styles.category}>{category.count} Projects</span>
          <p>{category.description}</p>
          <button className={styles.link}>
            <span>View Projects</span>
          </button>
        </div>
        <div
          className={styles.imageWrapper}
          style={{
            background: `linear-gradient(135deg, ${category.color}22, ${category.color}44)`,
          }}
        >
          <div className={styles.categoryPattern} />
        </div>
      </article>
    </li>
  )

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.container} ${className || ''} ${
          isVisible ? styles.visible : ''
        }`}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>Projects & Research</h1>
          <p className={styles.description}>
            Explore my work across different creative disciplines. Select a
            category to view projects.
          </p>
        </div>

        <ul ref={listRef} className={styles.projectList}>
          {categories.map((category, index) =>
            renderCategoryItem(category, index)
          )}
        </ul>
      </div>

      {selectedCategory && (
        <CategoryLauncher
          category={selectedCategory}
          isOpen={launcherOpen}
          onClose={handleLauncherClose}
          originElement={clickedElementRef.current}
        >
          {renderCategoryContent(selectedCategory)}
        </CategoryLauncher>
      )}
    </>
  )
}

export default AccordionProjects
