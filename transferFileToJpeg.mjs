import { rename, readFile, writeFile, unlink } from 'fs/promises'
import pngToJpeg from 'png-to-jpeg'

import { getTagsSetFromFileName, transferTagsSetToFileName, getFileNameFromPath, getFolderPathFromPath } from './fileName.mjs'
import getImageInfo from './getImageInfo.mjs'

export default async function transferFileToJpeg({ path, log }) {
    const fileName = getFileNameFromPath(path)
    const folderPath = getFolderPathFromPath(path)
    const tagsSet = getTagsSetFromFileName(fileName)

    const imageInfo = await getImageInfo(path)
    const imageExt = imageInfo.format?.toLowerCase?.()

    const newName = transferTagsSetToFileName(tagsSet.add('jpeg'), fileName)
    const newPath = `${folderPath}/${newName}`

    if (imageExt === 'jpeg' && path !== newPath) {
        await rename(path, newPath)
        log.record('[Transfer JPG File]', path, newPath)
    }

    if (imageExt === 'png') {
        const buffer = await readFile(path)
        const outputBuffer = await pngToJpeg({ quality: 100 })(buffer)
        await writeFile(newPath, outputBuffer)
        await unlink(path)
        log.record('[Transfer PNG File]', path, newPath)
    }

    return { path: newPath, log }
}
