import gm from 'gm'

const cache = {}

export default async function getImageInfo(path) {
    if (path in cache) {
        return cache[path]
    } else {
        return new Promise((resolve, reject) => {
            gm(path).identify((error, result) => {
                if (error) {
                    reject(error)
                }
                cache[path] = result
                resolve(result)
            })
        })
    }
}