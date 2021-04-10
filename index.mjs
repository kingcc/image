import fs from 'fs'

import copyFile from './copyFile.mjs'
import transferFileToJpeg from './transferFileToJpeg.mjs'
import removeExifFromJpeg from './removeExifFromJpeg.mjs'
import compressJpeg from './compressJpeg.mjs'
import renameJpegUsingImageInfo from './renameJpegUsingImageInfo.mjs'

import Log from './Log.mjs'

const INPUT_FOLDER = './input'
const DEST_FOLDER = './dest'
const LOG_FILE = './log.json'

async function mkdirIfNotExist(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
}

async function dispose({ fileName, inputFolder, destFolder, log }) {
    return Promise.resolve({ inputPath: `${inputFolder}/${fileName}`, destPath: `${destFolder}/${fileName}`, log })
        .then(copyFile)
        .then(transferFileToJpeg)
        .then(removeExifFromJpeg)
        .then(compressJpeg)
        .then(renameJpegUsingImageInfo)
}

async function main() {

    await mkdirIfNotExist(INPUT_FOLDER)
    await mkdirIfNotExist(DEST_FOLDER)

    const log = new Log(LOG_FILE, process.argv.includes('--verbose')).load()

    await Promise.all(
        fs.readdirSync(INPUT_FOLDER)
            .filter(log.isFimilar.bind(log))
            .map((fileName) => dispose({ fileName, inputFolder: INPUT_FOLDER, destFolder: DEST_FOLDER, log }))
    )
    
    log.save()
}

main().catch(console.error)
