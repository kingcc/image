import fs from 'fs'
import gm from 'gm'
import crypto from 'crypto'

const SOURCE_DIR = './source'
const OUTPUT_DIR = './output'

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

async function main() {

    if (fs.existsSync(OUTPUT_DIR)){
        fs.rmdirSync(OUTPUT_DIR, { recursive: true })
    }
    fs.mkdirSync(OUTPUT_DIR)

    const imageNames = fs.readdirSync(SOURCE_DIR)
    for (const imageName of imageNames) {
        const imagePath = `${SOURCE_DIR}/${imageName}`
        const imageInfo = await getImageInfo(imagePath)
        const imageMD5 = crypto.createHash('md5').update(imagePath).digest('hex').slice(0, 16)
        const imagePixels = (imageInfo.size?.width ?? 1) * (imageInfo.size?.height ?? 1)
        const imageOutputPath = `${OUTPUT_DIR}/${imagePixels}_${imageMD5}.${imageInfo.format?.toLowerCase?.()}`
        console.log(`Moving ${imageInfo.path} to ${imageOutputPath}...`)
        fs.copyFileSync(imageInfo.path, imageOutputPath)
    }

}

main().catch(console.error)