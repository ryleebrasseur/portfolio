import React, { useRef, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color } from 'three'
import { Project } from '../../data/projects'
import { ScrollData } from '../../hooks/useCustomScroll'
import { vertexShader, fragmentShader } from './shaders/shaders'

interface ImagePlaneProps {
  project: Project
  index: number
  totalProjects: number
  scrollData: MutableRefObject<ScrollData>
  viewport: { width: number; height: number; factor: number }
}

export const ImagePlane: React.FC<ImagePlaneProps> = ({
  project,
  index,
  totalProjects,
  scrollData,
  viewport,
}) => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return

    const scroll = scrollData.current

    // Use window scroll if Lenis isn't working
    const scrollY = scroll.current || window.scrollY
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight
    const progress = totalHeight > 0 ? scrollY / totalHeight : 0

    // Calculate which project is "current" based on scroll
    const currentProject = progress * (totalProjects - 1)
    const distanceFromCurrent = currentProject - index

    // Carousel effect - arrange in circle
    const angle = (index / totalProjects) * Math.PI * 2
    const radius = 5

    // Base position in carousel
    const baseX = Math.sin(angle + distanceFromCurrent * 0.5) * radius
    const baseZ = Math.cos(angle + distanceFromCurrent * 0.5) * radius - 5

    // Move based on scroll - create depth carousel effect
    meshRef.current.position.x =
      baseX * (1 - Math.abs(distanceFromCurrent) * 0.2)
    meshRef.current.position.y = distanceFromCurrent * -2 // Move up/down based on distance
    meshRef.current.position.z = baseZ + Math.abs(distanceFromCurrent) * -5 // Depth based on distance

    // Rotation effect - face camera as we scroll
    meshRef.current.rotation.y = -angle - distanceFromCurrent * 0.3

    // Opacity based on distance - fade distant planes
    const opacity = Math.max(0, 1 - Math.abs(distanceFromCurrent) * 0.5)
    if (materialRef.current) {
      materialRef.current.opacity = opacity
    }

    // Scale for focus effect
    const scale = 1 - Math.min(Math.abs(distanceFromCurrent) * 0.2, 0.5)
    meshRef.current.scale.set(scale, scale, 1)

    // Update shader uniforms
    if (materialRef.current.uniforms) {
      materialRef.current.uniforms.uTime.value += 0.01
      materialRef.current.uniforms.uScrollProgress.value = distanceFromCurrent
    }
  })

  return (
    <mesh ref={meshRef} position={[0, index * 2, 0]}>
      <planeGeometry
        args={[viewport.width * 0.8, viewport.height * 0.6, 32, 32]}
      />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uColor: { value: new Color(project.color) },
        }}
        transparent
      />
    </mesh>
  )
}
