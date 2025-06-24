import { FullConfig } from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('[Coverage Teardown] Starting global teardown')
  
  const coverageDir = path.join(process.cwd(), 'coverage-temp')
  const finalCoverageDir = path.join(process.cwd(), 'coverage')
  
  try {
    // Create final coverage directory
    await fs.mkdir(finalCoverageDir, { recursive: true })
    
    // Read all coverage files from temp directory
    const files = await fs.readdir(coverageDir)
    const coverageFiles = files.filter(f => f.endsWith('.json'))
    
    console.log(`[Coverage Teardown] Found ${coverageFiles.length} coverage files`)
    
    // Merge all coverage data
    const allCoverage: any[] = []
    for (const file of coverageFiles) {
      const content = await fs.readFile(path.join(coverageDir, file), 'utf-8')
      const coverage = JSON.parse(content)
      allCoverage.push(...coverage)
    }
    
    // Save merged coverage
    await fs.writeFile(
      path.join(finalCoverageDir, 'coverage-final.json'),
      JSON.stringify(allCoverage, null, 2)
    )
    
    console.log(`[Coverage Teardown] Merged ${allCoverage.length} coverage entries`)
    console.log(`[Coverage Teardown] Final coverage saved to ${finalCoverageDir}`)
    
    // Generate summary
    let totalBytes = 0
    let coveredBytes = 0
    
    for (const entry of allCoverage) {
      if (!entry.text) continue
      totalBytes += entry.text.length
      
      for (const range of entry.ranges || []) {
        coveredBytes += range.end - range.start
      }
    }
    
    const percentage = totalBytes > 0 ? (coveredBytes / totalBytes * 100).toFixed(2) : 0
    console.log(`[Coverage Teardown] Overall coverage: ${percentage}% (${coveredBytes}/${totalBytes} bytes)`)
    
  } catch (error) {
    console.error('[Coverage Teardown] Error processing coverage:', error)
  }
}

export default globalTeardown