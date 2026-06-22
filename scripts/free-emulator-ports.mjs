import { execSync } from 'node:child_process'

const PORTS = [8080, 9099, 4000]

function getListeningPids(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' })
    const pids = new Set()

    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) continue
      const parts = line.trim().split(/\s+/)
      const pid = parts.at(-1)
      if (pid && /^\d+$/.test(pid)) pids.add(pid)
    }

    return [...pids]
  } catch {
    return []
  }
}

let freed = 0

for (const port of PORTS) {
  for (const pid of getListeningPids(port)) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`Freed port ${port} (PID ${pid})`)
      freed += 1
    } catch {
      console.warn(`Could not free port ${port} (PID ${pid})`)
    }
  }
}

if (freed === 0) {
  console.log('Emulator ports are free.')
}
