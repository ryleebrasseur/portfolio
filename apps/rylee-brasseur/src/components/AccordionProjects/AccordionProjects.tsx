import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../../data/projects'
import styles from './AccordionProjects.module.css'

gsap.registerPlugin(ScrollTrigger)

export interface AccordionProjectsProps {
  className?: string
}

const AccordionProjects: React.FC<AccordionProjectsProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    const showTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => setIsVisible(true),
      onLeave: () => setIsVisible(false),
      onEnterBack: () => setIsVisible(true),
      onLeaveBack: () => setIsVisible(false),
    })

    return () => {
      showTrigger.kill()
    }
  }, [])

  useEffect(() => {
    if (!listRef.current) return

    const updateGridColumns = () => {
      const cols = projects
        .map((_, i) => (i === activeIndex ? '10fr' : '1fr'))
        .join(' ')
      listRef.current!.style.gridTemplateColumns = cols
    }

    updateGridColumns()
  }, [activeIndex])

  useEffect(() => {
    if (!containerRef.current || !isVisible || hasAnimatedRef.current) return

    const ctx = gsap.context(() => {
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
    }, containerRef)

    return () => ctx.revert()
  }, [isVisible])

  const handleHover = (index: number) => {
    setActiveIndex(index)
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''} ${
        isVisible ? styles.visible : ''
      }`}
    >
      <h1 className={styles.title}>Projects & Research</h1>
      <p className={styles.description}>
        Explore my work in international relations, policy analysis, and
        diplomatic research. Each project represents a deep dive into complex
        global challenges and innovative solutions.
      </p>

      <ul ref={listRef} className={styles.projectList}>
        {projects.map((project, index) => (
          <li
            key={project.id}
            className={styles.projectItem}
            data-active={index === activeIndex}
            onMouseEnter={() => handleHover(index)}
            onFocus={() => handleHover(index)}
            tabIndex={0}
            role="button"
            aria-expanded={index === activeIndex}
            aria-label={`${project.title}, ${project.category}. ${index === activeIndex ? 'Expanded' : 'Collapsed'}`}
          >
            <article className={styles.article}>
              <h3>{project.title}</h3>
              <div className={styles.content}>
                <span className={styles.category}>{project.category}</span>
                <p>{project.description}</p>
                <a href="#" className={styles.link}>
                  <span>Learn more</span>
                </a>
              </div>
              <div
                className={styles.imageWrapper}
                style={{
                  background: `linear-gradient(135deg, ${project.color}22, ${project.color}44)`,
                }}
              />
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AccordionProjects
