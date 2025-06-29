import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { CategoryId, CATEGORIES } from './shared/categoryTypes'
import styles from './CategoryNav.module.css'

interface CategoryNavProps {
  activeCategory: CategoryId
  onCategoryChange: (category: CategoryId) => void
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  const navRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Animate indicator position
  useEffect(() => {
    const activeIndex = Object.keys(CATEGORIES).indexOf(activeCategory)
    const activeItem = itemRefs.current[activeIndex]

    if (activeItem && indicatorRef.current) {
      const itemRect = activeItem.getBoundingClientRect()
      const navRect = navRef.current?.getBoundingClientRect()

      if (navRect) {
        gsap.to(indicatorRef.current, {
          x: itemRect.left - navRect.left,
          width: itemRect.width,
          duration: 0.5,
          ease: 'power2.inOut',
        })
      }
    }
  }, [activeCategory])

  // Initial animation
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { opacity: 0, y: -20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.3,
          ease: 'power2.out',
        }
      )

      // Stagger nav items
      gsap.fromTo(
        itemRefs.current,
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.5,
          ease: 'power2.out',
        }
      )
    }
  }, [])

  const handleItemHover = (index: number) => {
    const item = itemRefs.current[index]
    if (item) {
      gsap.to(item, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }

  const handleItemLeave = (index: number) => {
    const item = itemRefs.current[index]
    if (item) {
      gsap.to(item, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }

  return (
    <nav ref={navRef} className={styles.categoryNav}>
      <div className={styles.navContainer}>
        <div ref={indicatorRef} className={styles.activeIndicator} />

        {Object.entries(CATEGORIES).map(([id, category], index) => (
          <button
            key={id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`${styles.navItem} ${activeCategory === id ? styles.active : ''}`}
            onClick={() => onCategoryChange(id as CategoryId)}
            onMouseEnter={() => handleItemHover(index)}
            onMouseLeave={() => handleItemLeave(index)}
          >
            <span className={styles.navLabel}>{category.name}</span>
            {category.icon && (
              <span className={styles.navIcon}>{category.icon}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
