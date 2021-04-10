import fs from 'fs'

class Log {
    constructor(path, enableOutput) {
        this.path = path
        this.data = {}
        this.enableOutput = enableOutput
        this.formatCursor = 2**6
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
        if (from) {
            const currentCursor = Math.max(message.length * 2, from.length, to.length)
            if (currentCursor > this.formatCursor) {
                this.formatCursor = parseInt(currentCursor * 1.5)
            }
        }
        const line = from
            ? `${this.format(message, parseInt(this.formatCursor / 2))} ${this.format(from, this.formatCursor)}${this.format('->', parseInt(this.formatCursor / 2))}${this.format(to, this.formatCursor)}`
            : message
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
