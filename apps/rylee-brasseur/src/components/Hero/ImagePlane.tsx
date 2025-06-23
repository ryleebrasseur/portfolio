import React, { useRef, MutableRefObject, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Color } from 'three'
import { Project } from '../../data/projects'
import { ScrollData } from '../../hooks/useCustomScroll'
import { useTheme } from '../../hooks/useTheme'
import { vertexShader, fragmentShader } from './shaders/shaders'

interface ImagePlaneProps {
  project: Project
  index: number
  totalProjects: number
  scrollData: MutableRefObject<ScrollData>
  viewport: { width: number; height: number; factor: number }
}

export const ImagePlane: React.FC<ImagePlaneProps> = ({
  project: _project,
  index,
  totalProjects,
  scrollData,
  viewport,
}) => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const { theme, colors } = useTheme()

  // Create visually appealing theme colors with careful attention to contrast
  const themeColors = useMemo(() => {
    if (theme === 'cyberpunk' || theme === 'cyber') {
      // Cyber: High contrast neon - bright cyan to deep magenta
      return {
        color1: new Color('#00ffff'), // Pure cyan
        color2: new Color('#ff00ff'), // Pure magenta
        color3: new Color('#001133'), // Deep blue-black
        intensity: 1.2,
      }
    } else if (theme === 'sunset') {
      // Sunset: Smooth warm gradient - coral to gold to purple
      return {
        color1: new Color('#ff7b9c'), // Soft coral pink
        color2: new Color('#ffd700'), // Rich gold
        color3: new Color('#4a148c'), // Deep purple
        intensity: 1.1,
      }
    } else if (theme === 'att') {
      // AT&T: Professional blue gradient - light to brand blue to navy
      return {
        color1: new Color('#7dd3ff'), // Light sky blue
        color2: new Color('#00a8e0'), // AT&T brand blue
        color3: new Color('#001f3f'), // Navy blue
        intensity: 1.2,
      }
    } else if (theme === 'msu') {
      // MSU: Clean contrast - white to spartan green with depth
      return {
        color1: new Color('#ffffff'), // Pure white
        color2: new Color('#18453b'), // Spartan green
        color3: new Color('#0a1f1a'), // Deep forest
        intensity: 1.0,
      }
    }

    // Default fallback
    return {
      color1: new Color(colors.accent),
      color2: new Color(colors.text),
      color3: new Color(colors.secondary),
      intensity: 1.0,
    }
  }, [theme, colors])

  // Update material uniforms when theme changes
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.uColor1.value = themeColors.color1
      materialRef.current.uniforms.uColor2.value = themeColors.color2
      materialRef.current.uniforms.uColor3.value = themeColors.color3
      materialRef.current.uniforms.uIntensity.value = themeColors.intensity
      materialRef.current.needsUpdate = true
    }
  }, [themeColors])

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

      // Update theme colors in real-time
      materialRef.current.uniforms.uColor1.value = themeColors.color1
      materialRef.current.uniforms.uColor2.value = themeColors.color2
      materialRef.current.uniforms.uColor3.value = themeColors.color3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, index * 2, 0]}>
      <planeGeometry
        args={[viewport.width * 0.8, viewport.height * 0.6, 32, 32]}
      />
      <shaderMaterial
        key={theme} // Force re-creation when theme changes
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uColor1: { value: themeColors.color1 },
          uColor2: { value: themeColors.color2 },
          uColor3: { value: themeColors.color3 },
          uIntensity: { value: themeColors.intensity },
        }}
        transparent
      />
    </mesh>
  )
}
