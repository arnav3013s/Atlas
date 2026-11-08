import { spawn } from 'node:child_process'
import { makeServer } from '../server.mjs'

const server = makeServer()
server.listen(0, '127.0.0.1', () => {
  const { port } = server.address()
  console.log('Assistant API: http://127.0.0.1:' + port)
  const viteEnv = { ...process.env, ATLAS_API_PORT: String(port) }
  delete viteEnv.OPENAI_API_KEY
  const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {
    stdio: 'inherit',
    env: viteEnv,
  })

  vite.on('exit', code => {
    server.close()
    process.exitCode = code ?? 0
  })
  vite.on('error', error => {
    console.error(error.message)
    server.close()
    process.exitCode = 1
  })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      vite.kill()
      server.close()
    })
  }
})

