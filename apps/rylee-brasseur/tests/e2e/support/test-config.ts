// Test configuration that can be used to override site config for testing
export const testConfig = {
  hero: {
    name: 'Rylee Brasseur',
    title: 'Exploring Finance & Policy',
    institution: 'Michigan State University | James Madison College',
    email: 'hello@rysdesigns.com',
    phoneNumber: '517.449.9836',
  },
  header: {
    brandName: 'rys designs ❤️',
    tagline: 'Research in Progress',
    email: 'hello@rysdesigns.com',
  },
  motionSystem: {
    sections: ['hero', 'header'],
    animationDuration: 1000,
    easing: 'expo.inOut',
    staggerDelay: 0.05,
  },
}

// Helper functions for tests
export const getExpectedHeroText = () => ({
  name: testConfig.hero.name,
  title: testConfig.hero.title,
  institution: testConfig.hero.institution,
  email: testConfig.hero.email,
})

export const getExpectedHeaderText = () => ({
  brandName: testConfig.header.brandName,
  tagline: testConfig.header.tagline,
  email: testConfig.header.email,
})

// Animation expectations
export const getAnimationConfig = () => testConfig.motionSystem
