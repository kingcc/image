import { writeFile, stat, unlink } from 'fs/promises'
import imagemin from 'imagemin'
import imageminJpegtran from 'imagemin-jpegtran'

import { getTagsSetFromFileName, transferTagsSetToFileName, getFileNameFromPath, getFolderPathFromPath } from './fileName.mjs'

async function getFileSize(path) {
    return (await stat(path)).size ?? 0
}

export default async function compressJpeg({ path, log }) {
    const fileName = getFileNameFromPath(path)
    const folderPath = getFolderPathFromPath(path)
    const tagsSet = getTagsSetFromFileName(fileName)

    if (!tagsSet.has('compressed')) {
        const newName = transferTagsSetToFileName(tagsSet.add('compressed'), fileName)
        const newPath = `${folderPath}/${newName}`
        const [{ data: destBuffer }] = await imagemin([path], { plugins: [imageminJpegtran()] })
        await writeFile(newPath, destBuffer)
        const compressedPercent = parseInt((await getFileSize(newPath) / await getFileSize(path)) * 100)
        await unlink(path)
        log.record(`[Compress File To ${compressedPercent}%]`, path, newPath)

        return { path: newPath, log }
    } else {
        return { path, log }
    }
}
