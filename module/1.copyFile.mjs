import { copyFile } from 'fs/promises'

export default async function copyFileWithLog({ inputPath, destPath, log }) {
    await copyFile(inputPath, destPath)
    log.record('[Move File]', inputPath, destPath)
    return { path: destPath, log }
}