import React from 'react'
import { Project } from '../CategorySystem/shared/categoryTypes'

interface CategoryViewPlaceholderProps {
  categoryName: string
  projects: Project[]
}

const CategoryViewPlaceholder: React.FC<CategoryViewPlaceholderProps> = ({
  categoryName,
  projects,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '3rem',
          marginBottom: '1rem',
          opacity: 0.9,
        }}
      >
        {categoryName}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.25rem',
          opacity: 0.7,
          marginBottom: '2rem',
        }}
      >
        This view is under development
      </p>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          opacity: 0.5,
        }}
      >
        {projects.length} projects available
      </div>
    </div>
  )
}

export default CategoryViewPlaceholder
