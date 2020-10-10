import fs from 'fs'
import gm from 'gm'
import crypto from 'crypto'

/* Configuration items */

const SOURCE_DIR = './source'
const OUTPUT_DIR = './output'

const MAX_WORKERS = 8
const INSPECT_INTERVAL = 1000

const filters = []

/* Utils */

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

async function sleep(timeout) {

    return new Promise(
        (resolve) => setTimeout(resolve, timeout)
    )

}

class Worker {
    constructor(imageName) {
        this.imagePath = `${SOURCE_DIR}/${imageName}`
        this.getImageInfo().then()

        const imageMD5 = crypto.createHash('md5').update(this.imagePath).digest('hex').slice(0, 16)
        this.imagePixels = (imageInfo.size?.width ?? 1) * (imageInfo.size?.height ?? 1)

        const imageOutputPath = `${OUTPUT_DIR}/${imagePixels}_${imageMD5}.${imageInfo.format?.toLowerCase?.()}`
        console.log(`Moving ${imageInfo.path} to ${imageOutputPath}...`)
        fs.copyFileSync(imageInfo.path, imageOutputPath)
    }

    async getImageInfo() {

        return new Promise((resolve, reject) => {

            gm(this.imagePath).identify((error, result) => {
    
                if (error) {
                    reject(error)
                }
    
                resolve(result)
    
            })
    
        })

    }
}

async function main() {

    /* phase 1: Some preparatory work */

    // Store the pictures processed by worker
    const memoryQueue = []

    if (!fs.existsSync(OUTPUT_DIR)){
        fs.mkdirSync(OUTPUT_DIR)
    }

    memoryQueue.push(...fs.readdirSync(OUTPUT_DIR))

    /* phase 2: Start processing the data*/

    const sourceImagesNames = fs.readdirSync(SOURCE_DIR)
    const workers = []

    for (const imageName of sourceImagesNames) {

        while (true) {

            if (workers.length < MAX_WORKERS) {
                workers.push(new Worker(imageName))
                break
            } else {
                await sleep(INSPECT_INTERVAL)
            }

        }

    }

}

main()
