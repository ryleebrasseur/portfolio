export interface FeatureCoverage {
  features: Set<string>
  routes: Set<string>
  interactions: Map<string, number>
  components: Set<string>
}

export class TestCoverageTracker {
  private features = new Set<string>()
  private routes = new Set<string>()
  private interactions = new Map<string, number>()
  private components = new Set<string>()

  trackFeature(feature: string) {
    this.features.add(feature)
  }

  trackRoute(url: string) {
    const pathname = new URL(url).pathname
    this.routes.add(pathname)
  }

  trackInteraction(type: string, selector: string) {
    const key = `${type}:${selector}`
    this.interactions.set(key, (this.interactions.get(key) || 0) + 1)
  }

  trackComponent(componentName: string) {
    this.components.add(componentName)
  }

  getCoverage(): FeatureCoverage {
    return {
      features: new Set(this.features),
      routes: new Set(this.routes),
      interactions: new Map(this.interactions),
      components: new Set(this.components),
    }
  }

  generateSummary() {
    return {
      features: {
        tested: Array.from(this.features),
        count: this.features.size,
      },
      routes: {
        visited: Array.from(this.routes),
        count: this.routes.size,
      },
      interactions: {
        summary: Object.fromEntries(this.interactions),
        totalCount: Array.from(this.interactions.values()).reduce(
          (a, b) => a + b,
          0
        ),
        uniqueCount: this.interactions.size,
      },
      components: {
        rendered: Array.from(this.components),
        count: this.components.size,
      },
    }
  }

  reset() {
    this.features.clear()
    this.routes.clear()
    this.interactions.clear()
    this.components.clear()
  }
}
