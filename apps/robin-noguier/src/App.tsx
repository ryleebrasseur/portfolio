import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'

function App() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <h1>Portfolio Monorepo</h1>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
    </motion.div>
  )
}

export default App