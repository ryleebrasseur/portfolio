#!/usr/bin/env node

/* eslint-env node */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const pidFile = path.join(projectRoot, '.dev-server.pid')

class DevServerManager {
  constructor() {
    this.defaultPort = 5173
  }

  async checkPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`)
      return stdout.trim() ? parseInt(stdout.trim()) : null
    } catch {
      return null // Port is free
    }
  }

  async healthCheck(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, (res) => {
        // Just check if we get a 200 response (Vite serves HTML)
        resolve(res.statusCode === 200)
      })
      
      req.on('error', () => resolve(false))
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
    })
  }


  async readPidFile() {
    try {
      const content = await fs.readFile(pidFile, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  async writePidFile(data) {
    await fs.writeFile(pidFile, JSON.stringify(data, null, 2))
  }

  async removePidFile() {
    try {
      await fs.unlink(pidFile)
    } catch {
      // File doesn't exist, that's fine
    }
  }

  async isProcessRunning(pid) {
    try {
      process.kill(pid, 0) // Signal 0 just checks if process exists
      return true
    } catch {
      return false
    }
  }

  async killProcess(pid, signal = 'SIGTERM') {
    try {
      process.kill(pid, signal)
      
      // Wait for process to actually die
      for (let i = 0; i < 30; i++) { // Wait up to 3 seconds
        if (!await this.isProcessRunning(pid)) {
          return true
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Force kill if still running
      if (await this.isProcessRunning(pid)) {
        process.kill(pid, 'SIGKILL')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      return !await this.isProcessRunning(pid)
    } catch {
      return false
    }
  }

  async status() {
    const pidData = await this.readPidFile()
    
    if (!pidData) {
      return { running: false, message: 'No PID file found' }
    }

    const { pid, port, startTime } = pidData
    const processRunning = await this.isProcessRunning(pid)
    
    if (!processRunning) {
      await this.removePidFile() // Clean up stale PID file
      return { running: false, message: 'Process not running (cleaned up stale PID file)' }
    }

    const portInUse = await this.checkPort(port)
    if (portInUse !== pid) {
      return { running: false, message: `Port ${port} not owned by tracked process` }
    }

    const healthy = await this.healthCheck(port)
    if (!healthy) {
      return { running: false, message: `Server on port ${port} failed health check` }
    }

    const uptime = Math.round((Date.now() - startTime) / 1000)
    return { 
      running: true, 
      pid, 
      port, 
      uptime: `${uptime}s`,
      message: `Dev server running on port ${port} (PID: ${pid}, uptime: ${uptime}s)` 
    }
  }

  async stop() {
    const pidData = await this.readPidFile()
    
    if (!pidData) {
      console.log('No server to stop (no PID file)')
      return true
    }

    const { pid, port } = pidData
    console.log(`Stopping dev server (PID: ${pid}, port: ${port})...`)
    
    const killed = await this.killProcess(pid)
    await this.removePidFile()
    
    if (killed) {
      console.log('Dev server stopped successfully')
      return true
    } else {
      console.log('Failed to stop dev server process')
      return false
    }
  }

  async dev() {
    // Check if there's already a healthy server on our port
    const pidUsingPort = await this.checkPort(this.defaultPort)
    
    if (pidUsingPort) {
      // Port is in use - check if it's a healthy Vite server
      const healthy = await this.healthCheck(this.defaultPort)
      
      if (healthy) {
        // It's a healthy Vite server, reuse it
        console.log(`Reusing existing healthy dev server on port ${this.defaultPort} (PID: ${pidUsingPort})`)
        return { port: this.defaultPort, pid: pidUsingPort, reused: true }
      } else {
        // Port is occupied by something else or unhealthy
        throw new Error(`Port ${this.defaultPort} is in use by another process (PID: ${pidUsingPort}) or unhealthy.\n\nOptions:\n- Stop the process using the port: kill ${pidUsingPort}\n- Use 'pnpm dev:start' to force start (will kill existing process)\n- Use 'pnpm dev:stop' to stop any managed dev server`)
      }
    }

    // Port is free, start new server on default port
    return await this.start()
  }

  async start() {
    // Check if our managed server is already running
    const status = await this.status()
    if (status.running) {
      console.log(`Dev server already running: ${status.message}`)
      return { port: status.port, pid: status.pid, reused: true }
    }

    // Check if port is available
    const pidUsingPort = await this.checkPort(this.defaultPort)
    if (pidUsingPort) {
      // Kill existing process if it's not healthy
      const healthy = await this.healthCheck(this.defaultPort)
      if (!healthy) {
        console.log(`Killing unhealthy process on port ${this.defaultPort} (PID: ${pidUsingPort})`)
        await this.killProcess(pidUsingPort)
        // Wait a bit for port to be released
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        throw new Error(`Port ${this.defaultPort} is already in use by a healthy Vite server (PID: ${pidUsingPort})`)
      }
    }

    console.log(`Starting dev server on port ${this.defaultPort}...`)

    // Start the server with explicit port
    const child = spawn('npx', ['vite', '--port', this.defaultPort.toString()], {
      cwd: projectRoot,
      stdio: ['ignore', 'ignore', 'ignore'], // Detach from stdio
      detached: true, // Run independently 
      env: { 
        ...process.env
      }
    })
    
    // Detach from parent process so it can run independently
    child.unref()

    // Handle process errors
    child.on('error', (err) => {
      console.error('Failed to start dev server:', err.message)
      throw err
    })

    // Give it a moment to start, then find the actual Vite process
    await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
    
    // Find the actual process using the port (since detached processes change PID)
    const actualPid = await this.checkPort(this.defaultPort)
    if (!actualPid) {
      throw new Error('Dev server failed to bind to port - no process found on port')
    }
    
    // Verify it's healthy
    const healthy = await this.healthCheck(this.defaultPort)
    if (!healthy) {
      throw new Error('Dev server started but failed health check')
    }
    
    // Save PID file with the actual process PID
    const pidData = {
      pid: actualPid,
      port: this.defaultPort,
      startTime: Date.now(),
      command: 'node scripts/dev-server.js start'
    }
    
    await this.writePidFile(pidData)
    console.log(`Dev server started on port ${this.defaultPort} (PID: ${actualPid})`)
    console.log(`Server ready at http://localhost:${this.defaultPort}`)
    
    return { port: this.defaultPort, pid: actualPid, reused: false }
  }

  async restart() {
    console.log('Restarting dev server...')
    await this.stop()
    return await this.start()
  }

  async portCheck() {
    const pid = await this.checkPort(this.defaultPort)
    if (!pid) {
      console.log(`Port ${this.defaultPort} is available`)
      return { available: true, port: this.defaultPort }
    }

    const healthy = await this.healthCheck(this.defaultPort)
    console.log(`Port ${this.defaultPort} is in use by PID ${pid}`)
    console.log(`Health check: ${healthy ? 'PASSED' : 'FAILED'}`)
    
    if (healthy) {
      console.log('Port is being used by a healthy Vite dev server')
      return { available: false, port: this.defaultPort, canReuse: true, pid }
    } else {
      console.log('Port is being used by a non-Vite process or unhealthy server')
      return { available: false, port: this.defaultPort, canReuse: false, pid }
    }
  }

  async killUnmanaged() {
    const pidData = await this.readPidFile()
    const portPid = await this.checkPort(this.defaultPort)
    
    if (!portPid) {
      console.log(`No process found on port ${this.defaultPort}`)
      return true
    }

    // If we have a managed process and it matches the port, use regular stop
    if (pidData && pidData.pid === portPid) {
      console.log('Found managed dev server, using regular stop command...')
      return await this.stop()
    }

    // Kill unmanaged process
    console.log(`Killing unmanaged process on port ${this.defaultPort} (PID: ${portPid})...`)
    
    const killed = await this.killProcess(portPid)
    
    if (killed) {
      console.log('Unmanaged process killed successfully')
      return true
    } else {
      console.log('Failed to kill unmanaged process')
      return false
    }
  }
}

// CLI handling
async function main() {
  const manager = new DevServerManager()
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'dev':
      case '':
      case undefined:
        // Default behavior for 'pnpm dev'
        await manager.dev()
        process.exit(0)
        break

      case '--start':
      case 'start':
        await manager.start()
        process.exit(0)
        break

      case '--stop':
      case 'stop': {
        const stopped = await manager.stop()
        process.exit(stopped ? 0 : 1)
        break
      }

      case '--restart':
      case 'restart': {
        await manager.restart()
        process.exit(0)
        break
      }

      case '--status':
      case 'status': {
        const status = await manager.status()
        console.log(status.message)
        process.exit(status.running ? 0 : 1)
        break
      }

      case '--port-check':
      case 'port-check': {
        await manager.portCheck()
        process.exit(0)
        break
      }

      case '--kill':
      case 'kill': {
        const killed = await manager.killUnmanaged()
        process.exit(killed ? 0 : 1)
        break
      }

      default:
        console.log(`
Dev Server Manager

Usage:
  node scripts/dev-server.js <command>

Commands:
  dev           Start or reuse server on port 5173 (fail if can't)
  start         Force start new server (kill existing if needed)
  stop          Stop dev server gracefully
  restart       Stop then start dev server
  status        Check if dev server is running
  port-check    Check port availability and conflicts
  kill          Kill unmanaged process on port 5173

Examples:
  node scripts/dev-server.js dev
  node scripts/dev-server.js start
  node scripts/dev-server.js status
  node scripts/dev-server.js stop
  node scripts/dev-server.js kill
        `)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...')
  const manager = new DevServerManager()
  await manager.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...')
  const manager = new DevServerManager()
  await manager.stop()
  process.exit(0)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { DevServerManager }