import { createReadStream, createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import gm from 'gm'

// const gmWithIM = gm.subClass({ imageMagick: true })

import { getTagsSetFromFileName, transferTagsSetToFileName, getFileNameFromPath, getFolderPathFromPath } from '../util/fileName.mjs'

async function gmIdentify(gmInstance) {
  return new Promise((resolve, reject) => {
    gmInstance.identify((err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

async function gmStream(gmInstance, writeStream, format = 'jpeg') {
    return new Promise((resolve, reject) => {
        gmInstance
            .stream(format)
            .pipe(writeStream)
            .once('finish', resolve)
            .once('error', reject)
    })
}


export default async function removeExifFromJpeg({ path, log }) {
    const fileName = getFileNameFromPath(path)
    const folderPath = getFolderPathFromPath(path)
    const tagsSet = getTagsSetFromFileName(fileName)

    if (!tagsSet.has('progressive')) {
        const newName = transferTagsSetToFileName(tagsSet.add('progressive'), fileName)
        const newPath = `${folderPath}/${newName}`
        const originalJpegData = await gmIdentify(gm(createReadStream(path)))
        await gmStream(
            gm(createReadStream(path))
                .interlace('line' /* or 'plane' */) // https://www.imagemagick.org/MagickStudio/Interlace.html
                .quality(originalJpegData['JPEG-Quality']), // save with the same quality as the original file
            createWriteStream(newPath),
        )
        await unlink(path)
        log.record('[Transfer JPEG To Progressive]', path, newPath)
        return { path: newPath, log }
    } else {
        return { path, log }
    }
}
