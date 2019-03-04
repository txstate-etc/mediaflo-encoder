class UpscaleError extends Error {
  constructor (message) {
    super(message)
    this.name = 'UpscaleError'
  }
}

module.exports = { UpscaleError }
