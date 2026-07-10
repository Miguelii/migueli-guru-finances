import path from 'node:path'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)

export function loadSystemEnvs() {
    const baseDir = import.meta.dirname
    jiti.import(path.resolve(baseDir, './client.ts'))
    jiti.import(path.resolve(baseDir, './server.ts'))
}
