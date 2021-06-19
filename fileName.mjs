const tags = [
    'exiffree',
    'compressed',
    'jpeg',
]

export function getNickNameFromFileName(fileName) {
    let returns = fileName
    for (const tag of tags) {
        returns = returns.replace(new RegExp(`\.${tag}`, 'g'), '')
    }
    return returns
}

export function getTagsSetFromFileName(fileName) {
    const nameTagsSet = new Set(fileName.split('.'))
    return new Set(tags.filter(tag => nameTagsSet.has(tag)))
}

export function transferTagsSetToFileName(nameTagsSet, referential = '') {
    const prefix = getNickNameFromFileName(referential)
    return `${prefix}.${tags.filter(tag => nameTagsSet.has(tag)).join('.')}`
}

export function getFileNameFromPath(path, optional = 'fileName') {
    try {
        return /^.*\/(.*)$/.exec(path)[1]
    } catch (e) {
        return optional
    }
}

export function getFolderPathFromPath(path, optional = 'folderPath') {
    try {
        return /^(.*)\/.*$/.exec(path)[1]
    } catch (e) {
        return optional
    }
}
