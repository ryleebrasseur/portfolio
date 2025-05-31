import React, { MutableRefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { ImagePlane } from './ImagePlane'
import { Project } from '../../data/projects'
import { ScrollData } from '../../hooks/useCustomScroll'

interface SceneContentProps {
  scrollData: MutableRefObject<ScrollData>
  projects: Project[]
}

export const SceneContent: React.FC<SceneContentProps> = ({
  scrollData,
  projects,
}) => {
  const { viewport } = useThree()

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {projects.map((project, index) => (
        <ImagePlane
          key={project.id}
          project={project}
          index={index}
          totalProjects={projects.length}
          scrollData={scrollData}
          viewport={viewport}
        />
      ))}
    </>
  )
}
