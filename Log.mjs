import fs from 'fs'

class Log {
    constructor(path, enableOutput) {
        this.path = path
        this.data = {}
        this.enableOutput = enableOutput
    }
    load() {
        if (!fs.existsSync(this.path)) fs.writeFileSync(this.path, JSON.stringify(this.data))
        this.data = JSON.parse(fs.readFileSync(this.path))
        return this
    }
    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.data))
        return this
    }
    format(str, len, startLeft = true) {
        if (startLeft) {
            const spaceCount = (len - str.length) > 0 ? len - str.length : 0
            return str.slice(0, len) + Array(spaceCount).fill(' ').join('')
        }
    }
    record(message, from, to) {
        const line = from ? `${this.format(message, 32)} ${this.format(from, 64)} -> ${this.format(to, 64)}` : message
        if (this.enableOutput) {
            console.info(line)
        } else {
            if (!('record' in this.data)) {
                this.data.record = []
            }
            this.data.record.push(line)
        }
    }
    addFile(file) {
        if (!('files' in this.data)) {
            this.data.files = {}
        }
        if (!('similarities' in this.data)) {
            this.data.similarities = {}
        }
        if (!('sizes' in this.data)) {
            this.data.sizes = {}
        }
        if (file.hash in this.data.files) {
            this.record(`[Exception] Hash ${file.hash} conflict between ${this.data.files[file.hash].name}(already exists) with ${file.oldName}`)
        }
        this.data.files[file.hash] = this.data.files[file.hash] ?? { oldName: [] }
        this.data.files[file.hash].name = file.newName
        this.data.files[file.hash].oldName.push(file.oldName)
        if ('similarity' in file) {
            if (file.similarity in this.data.similarities) {
                this.record(`[Exception] Similarity ${file.similarity} conflict between ${this.data.similarities[file.similarity]}(already exists) with ${file.hash}`)
            }
            this.data.similarities[file.similarity] = [...new Set([...(this.data.similarities[file.similarity] ?? []), file.hash])]
        }
        if ('size' in file) {
            if (file.size in this.data.sizes) {
                this.record(`[Exception] Size ${file.size} conflict between ${this.data.sizes[file.size]}(already exists) with ${file.hash}`)
            }
            this.data.sizes[file.size] = [...new Set([...(this.data.sizes[file.size] ?? []), file.hash])]
        }
    }
    get oldNames() {
        if (!('files' in this.data)) {
            this.data.files = {}
        }
        const oldNames = []
        for (const file of Object.values(this.data.files)) {
            oldNames.push(...(file.oldName ?? []))
        }
        return oldNames
    }
    isFimilar(fileName) {
        if (this.oldNames.includes(fileName.replace(/\..*$/, ''))) {
            this.record(`[INFO] ${fileName} has already been dealt with.`)
            return false
        }
        return true
    }
}

export default Log
