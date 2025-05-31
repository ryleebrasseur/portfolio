import HeroSectionWebGL from './components/Hero/HeroSectionWebGL'
import CustomCursor from './components/CustomCursor/CustomCursor'
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher'

function App() {
  return (
    <>
      <CustomCursor />
      <ThemeSwitcher />
      <main>
        <HeroSectionWebGL />
      </main>
    </>
  )
}

export default App
