import { readFile, rename } from 'fs/promises'
import crypto from 'crypto'

import getImageInfo from './getImageInfo.mjs'
import { getNickNameFromFileName, getTagsSetFromFileName, transferTagsSetToFileName, getFileNameFromPath, getFolderPathFromPath } from './fileName.mjs'

export default async function renameJpegUsingImageInfo({ path, log }) {
    const file = await readFile(path)
    const imageInfo = await getImageInfo(path)
    const imageHash = crypto.createHash('sha256').update(file).digest('hex').slice(0, 16)
    const imagePixels = (imageInfo.size?.width ?? 1) * (imageInfo.size?.height ?? 1)

    const fileName = getFileNameFromPath(path)
    const folderPath = getFolderPathFromPath(path)
    const tagsSet = getTagsSetFromFileName(fileName)
    const oldNickName = getNickNameFromFileName(fileName)
    const newNickName = `${imagePixels}_${imageHash}`
    const newName = transferTagsSetToFileName(tagsSet, newNickName)
    const newPath = `${folderPath}/${newName}`
    if (path !== newPath) {
        await rename(path, newPath)
        log.addFile({ hash: imageHash, oldName: oldNickName, newName, size: imagePixels })
        log.record('[RENAME JPG File]', path, newPath)
    }

    return { path: newPath, log }
}