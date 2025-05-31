import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCustomScroll } from '../../hooks/useCustomScroll'
import { projects, Project } from '../../data/projects'
import { SceneContent } from './SceneContent'
import ProjectDetailModal from '../ProjectModal/ProjectDetailModal'
import GradientImage from '../GradientImage/GradientImage'
import styles from './HeroSection.module.css'

gsap.registerPlugin(ScrollTrigger)

const HeroSectionWebGL = () => {
  const scrollData = useCustomScroll()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  useEffect(() => {
    console.log('Modal state changed:', { isModalOpen, selectedProject })
  }, [isModalOpen, selectedProject])

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Create cinematic scroll timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          pin: false,
        }
      })
      
      // Animate overlay content based on scroll
      tl.to(`.${styles.heroTitle}`, {
        y: -300,
        opacity: 0,
        duration: 0.5
      })
      .to(`.${styles.heroSubtitle}`, {
        y: -200,
        opacity: 0,
        duration: 0.5
      }, '<0.1')
      .to(`.${styles.heroInstitution}`, {
        y: -150,
        opacity: 0,
        duration: 0.5
      }, '<0.05')
      .to(`.${styles.scrollIndicator}`, {
        opacity: 0,
        duration: 0.3
      }, '<')
      
      // Animate project previews
      projects.forEach((_, index) => {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `${index * 100}vh top`,
          end: `${(index + 1) * 100}vh top`,
          onEnter: () => {
            gsap.to(`.${styles.previewSection}:nth-child(${index + 1})`, {
              opacity: 1,
              duration: 0.8
            })
          },
          onLeaveBack: () => {
            gsap.to(`.${styles.previewSection}:nth-child(${index + 1})`, {
              opacity: 0,
              duration: 0.8
            })
          }
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div 
      ref={containerRef}
      className={styles.heroContainer}
      style={{ height: `${projects.length * 100}vh` }}
    >
      <div className={styles.canvasWrapper}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={null}>
            <SceneContent scrollData={scrollData} projects={projects} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className={styles.overlayContent}>
        <h1 className={styles.heroTitle}>Rylee Brasseur</h1>
        <p className={styles.heroSubtitle}>International Relations Student</p>
        <p className={styles.heroInstitution}>Michigan State University | James Madison College</p>
      </div>
      
      <div className={styles.scrollIndicator}>
        <span>Scroll to explore</span>
        <div className={styles.scrollLine}></div>
      </div>
      
      <div className={styles.projectPreviews}>
        {projects.map((project, index) => (
          <div 
            key={project.id} 
            className={styles.previewSection}
            style={{ 
              top: `${100 + (index * 100)}vh`,
              backgroundColor: project.color + '10'
            }}
          >
            <div className={styles.previewContent}>
              <span className={styles.previewNumber}>0{index + 1}</span>
              <h2 className={styles.previewTitle}>{project.title}</h2>
              <p className={styles.previewCategory}>{project.category}</p>
              <p className={styles.previewDesc}>{project.description}</p>
            </div>
            <div className={styles.previewImage}>
              <GradientImage gradient={project.image} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.projectNav}>
        {projects.map((project, index) => (
          <button
            key={project.id}
            className={styles.projectButton}
            onClick={() => {
              console.log('Button clicked:', project.title)
              setSelectedProject(project)
              setIsModalOpen(true)
            }}
            data-magnetic
            data-hover
          >
            <span className={styles.projectNumber}>0{index + 1}</span>
            <span className={styles.projectTitle}>{project.title}</span>
          </button>
        ))}
      </div>

      <ProjectDetailModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default HeroSectionWebGL