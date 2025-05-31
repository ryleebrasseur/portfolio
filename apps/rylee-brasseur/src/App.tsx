import HeroSectionWebGL from './components/Hero/HeroSectionWebGL'
import CustomCursor from './components/CustomCursor/CustomCursor'
import Header from './components/Header/Header'

function App() {
  return (
    <>
      <CustomCursor />
      <Header />
      <main>
        <HeroSectionWebGL />
      </main>
    </>
  )
}

export default App
