import { access, mkdir, readdir } from 'fs/promises'

import Log from './Log.mjs'

const MODULES_FOLDER = './module'
const INPUT_FOLDER = './input'
const DEST_FOLDER = './dest'
const LOG_FILE = './log.json'

async function mkdirIfNotExist(dir) {
    try {
        await access(dir)
    } catch(e) {
        await mkdir(dir)
    }
}

async function disposeGenerator({ modules, inputFolder, destFolder, log }) {
    const isEnabled = m => !m.includes('disable')
    const modulePromises = modules.filter(isEnabled).sort().map(m => import(`${MODULES_FOLDER}/${m}`))
    const moduleFunctions = (await Promise.all(modulePromises)).map(m => m.default)
    return async (fileName) => {
        let chains = Promise.resolve({ inputPath: `${inputFolder}/${fileName}`, destPath: `${destFolder}/${fileName}`, log })
        for (const m of moduleFunctions) {
            chains = chains.then(m)
        }
        return chains
    }
}

async function main() {

    await mkdirIfNotExist(INPUT_FOLDER)
    await mkdirIfNotExist(DEST_FOLDER)

    const log = new Log(LOG_FILE, process.argv.includes('--verbose')).load()
    const files = await readdir(INPUT_FOLDER)
    const modules = await readdir(MODULES_FOLDER)
    const dispose = await disposeGenerator({ modules, inputFolder: INPUT_FOLDER, destFolder: DEST_FOLDER, log })
    await Promise.all(files.filter(log.isFimilar).map(dispose))
    
    log.save()
}

main().catch(console.error)
