import fs from 'fs'
import gm from 'gm'
import crypto from 'crypto'
import pngToJpeg from 'png-to-jpeg'
import piexif from 'piexifjs'

const SOURCE_DIR = './source'
const OUTPUT_DIR = './output'
const LOG_FILE = './log.json'

async function mkdirIfNotExist(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
}

class Log {
    constructor(path) {
        this.path = path
        this.data = {}
    }
    load() {
        if (!fs.existsSync(this.path)) fs.writeFileSync(this.path, JSON.stringify(this.data))
        this.data = JSON.parse(fs.readFileSync(this.path))
        return this
    }
    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.data))
        return this
    }
    record(line) {
        if (!('record' in this.data)) {
            this.data.record = []
        }
        this.data.record.push(line)
    }
    addFile(file) {
        if (!('files' in this.data)) {
            this.data.files = {}
        }
        if (!('similarities' in this.data)) {
            this.data.similarities = {}
        }
        if (!('sizes' in this.data)) {
            this.data.sizes = {}
        }
        if (file.hash in this.data.files) {
            this.record(`Hash ${file.hash} conflict between ${this.data.files[file.hash].name}(already exists) with ${file.oldName}`)
        }
        this.data.files[file.hash] = this.data.files[file.hash] ?? { oldName: [] }
        this.data.files[file.hash].name = file.newName
        this.data.files[file.hash].oldName.push(file.oldName)
        if ('similarity' in file) {
            if (file.similarity in this.data.similarities) {
                this.record(`Similarity ${file.similarity} conflict between ${this.data.similarities[file.similarity]}(already exists) with ${file.hash}`)
            }
            this.data.similarities[file.similarity] = [...new Set([...(this.data.similarities[file.similarity] ?? []), file.hash])]
        }
        if ('size' in file) {
            if (file.size in this.data.sizes) {
                this.record(`Size ${file.size} conflict between ${this.data.sizes[file.size]}(already exists) with ${file.hash}`)
            }
            this.data.sizes[file.size] = [...new Set([...(this.data.sizes[file.size] ?? []), file.hash])]
        }
    }
    get oldNames() {
        if (!('files' in this.data)) {
            this.data.files = {}
        }
        const oldNames = []
        for (const file of Object.values(this.data.files)) {
            oldNames.push(...(file.oldName ?? []))
        }
        return oldNames
    }
}

async function transferImageToJpeg(path, outpath) {
    const buffer = fs.readFileSync(path)
    return pngToJpeg({ quality: 100 })(buffer)
        .then(output => fs.writeFileSync(outpath, output))
}

function removeExifFromJpeg(path, outpath) {
    const imgData = fs.readFileSync(path).toString('binary')
    const newImgData = piexif.remove(imgData)
    fs.writeFileSync(outpath, newImgData, 'binary')
}

function getFileSha256(path) {
    return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
}

async function getImageInfo(path) {
    return new Promise((resolve, reject) => {
        gm(path).identify((error, result) => {
            if (error) {
                reject(error)
            }
            resolve(result)
        })
    })
}

async function dispose({ imageName, sourceDir, outputDir, log, deleteOrigin = false }) {
    const imagePath = `${sourceDir}/${imageName}`
    const imageInfo = await getImageInfo(imagePath)
    const imageExt = imageInfo.format?.toLowerCase?.()

    if (imageExt === 'png') {
        const newName = imageName.replace(/\.png$/, '.jpeg')
        const newPath = `${outputDir}/${newName}`
        await transferImageToJpeg(imageInfo.path, newPath)
        log.record(`Transfer ${imageInfo.path} to ${newPath}`)
        if (deleteOrigin) {
            fs.unlinkSync(imagePath)
            log.record(`Delete ${imagePath}`)
        }
        return dispose({ imageName: newName, sourceDir: outputDir, outputDir, log, deleteOrigin: true })
    }

    if (imageExt === 'jpeg') {

        if (!imageName.includes('exifree')) {
            const newName = imageName.replace(/\.jpe?g$/, '.exifree.jpeg')
            const newPath = `${outputDir}/${newName}`
            await removeExifFromJpeg(imageInfo.path, newPath)
            log.record(`Transfer ${imageInfo.path} to ${newPath}`)
            if (deleteOrigin) {
                fs.unlinkSync(imagePath)
                log.record(`Delete ${imagePath}`)
            }
            return dispose({ imageName: newName, sourceDir: outputDir, outputDir, log, deleteOrigin: true })
        }

        const imageHash = getFileSha256(imagePath).slice(0, 16)
        const imagePixels = (imageInfo.size?.width ?? 1) * (imageInfo.size?.height ?? 1)
        const newName = `${imagePixels}_${imageHash}.exifree.jpeg`
        log.addFile({ hash: imageHash, oldName: imageName.replace(/\..*$/, ''), newName, size: imagePixels })
        fs.copyFileSync(imageInfo.path, `${outputDir}/${newName}`)
        log.record(`Move ${imageInfo.path} to ${`${outputDir}/${newName}`}`)

    }

    if (deleteOrigin) {
        fs.unlinkSync(imagePath)
        log.record(`Delete ${imagePath}`)
    }
}

async function main() {

    await mkdirIfNotExist(SOURCE_DIR)
    await mkdirIfNotExist(OUTPUT_DIR)

    const log = new Log(LOG_FILE)
    log.load()

    const oldNamesSet = new Set(log.oldNames)
    await Promise.all(
        fs.readdirSync(SOURCE_DIR)
            .filter((file) => {
                if (oldNamesSet.has(file.replace(/\..*$/, ''))) {
                    log.record(`${file} in oldNames`)
                    return false
                }
                return true
            })
            .map((file) => dispose({ imageName: file, sourceDir: SOURCE_DIR, outputDir: OUTPUT_DIR, log }))
    )
    
    log.save()
}

main().catch(console.error)