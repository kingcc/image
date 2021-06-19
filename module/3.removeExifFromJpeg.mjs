import { readFile, writeFile, unlink } from 'fs/promises'
import piexif from 'piexifjs'

import { getTagsSetFromFileName, transferTagsSetToFileName, getFileNameFromPath, getFolderPathFromPath } from '../util/fileName.mjs'

export default async function removeExifFromJpeg({ path, log }) {
    const fileName = getFileNameFromPath(path)
    const folderPath = getFolderPathFromPath(path)
    const tagsSet = getTagsSetFromFileName(fileName)

    if (!tagsSet.has('exiffree')) {
        const newName = transferTagsSetToFileName(tagsSet.add('exiffree'), fileName)
        const newPath = `${folderPath}/${newName}`
        const imgData = (await readFile(path)).toString('binary')
        const newImgData = piexif.remove(imgData)
        await writeFile(newPath, newImgData, 'binary')
        await unlink(path)
        log.record('[Remove JPEG EXIF]', path, newPath)
        return { path: newPath, log }
    } else {
        return { path, log }
    }
}
