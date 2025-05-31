import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { Project } from '../../data/projects'
import GradientImage from '../GradientImage/GradientImage'
import styles from './ProjectDetailModal.module.css'

interface ProjectDetailModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  console.log('ProjectDetailModal render:', { project, isOpen })
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!modalRef.current || !overlayRef.current || !contentRef.current) return

    const tl = gsap.timeline({ paused: true })

    tl.set(modalRef.current, { display: 'block' })
      .fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      .fromTo(
        contentRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' },
        '-=0.1'
      )

    timelineRef.current = tl

    return () => {
      tl.kill()
    }
  }, [])

  useEffect(() => {
    console.log('Modal isOpen changed:', isOpen, 'project:', project?.title)

    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'

      // Hide custom cursor
      document.body.setAttribute('data-modal-open', 'true')

      if (timelineRef.current) {
        timelineRef.current.play()
      }
    } else {
      // Restore background scrolling
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''

      // Show custom cursor
      document.body.removeAttribute('data-modal-open')

      if (timelineRef.current) {
        timelineRef.current.reverse().then(() => {
          if (modalRef.current) {
            modalRef.current.style.display = 'none'
          }
        })
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen, project?.title])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Always render something to debug
  if (!isOpen) return null

  const modalContent = (
    <div
      ref={modalRef}
      className={styles.modalContainer}
      style={{ display: isOpen ? 'block' : 'none' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={overlayRef}
        className={styles.overlay}
        onClick={onClose}
        aria-label="Close modal"
      />

      <div ref={contentRef} className={styles.content}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className={styles.hero}>
          <GradientImage gradient={project?.image || 'gradient-1'} />
          <div className={styles.heroContent}>
            <span className={styles.category}>{project?.category}</span>
            <h1 id="modal-title" className={styles.title}>
              {project?.title}
            </h1>
            <p className={styles.year}>{project?.year}</p>
          </div>
        </div>

        <div className={styles.body} onWheel={(e) => e.stopPropagation()}>
          <section className={styles.section}>
            <h2>Overview</h2>
            <p>{project?.description}</p>
          </section>

          <section className={styles.section}>
            <h2>Process</h2>
            <p>
              This project involved extensive research and iteration to achieve
              the final result. The challenge was to create something that not
              only looked beautiful but also served its intended purpose
              effectively.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Results</h2>
            <p>
              The project was successfully launched and received positive
              feedback from both users and stakeholders. Key metrics showed
              significant improvement in user engagement and satisfaction.
            </p>
          </section>

          <div className={styles.imageGrid}>
            <div className={styles.projectImage}>
              <GradientImage gradient={project?.image || 'gradient-1'} />
            </div>
            {project?.secondaryImage && (
              <div className={styles.projectImage}>
                <GradientImage gradient={project.secondaryImage} />
              </div>
            )}
          </div>

          {project?.videoPreview && (
            <section className={styles.section}>
              <h2>Video Preview</h2>
              <video
                className={styles.projectVideo}
                controls
                loop
                muted
                playsInline
              >
                <source src={project.videoPreview} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </section>
          )}

          {/* Add more content to test scrolling */}
          <section className={styles.section}>
            <h2>Technical Details</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Challenges</h2>
            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Conclusion</h2>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur.
            </p>
          </section>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ProjectDetailModal
