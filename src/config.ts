class Config {
  static get JsonSigningSecret(): string {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET
    else throw new Error("JWT_SECRET must be defined in environment")
  }

  static get Port(): number {
    if (process.env.PORT) return parseInt(process.env.PORT)
    else return 3000
  }

  static get ConcurrentWorkers(): number {
    if (process.env.CONCURRENT_WORKERS) return parseInt(process.env.CONCURRENT_WORKERS)
    else return 3
  }

  static get YoutubeApiKey(): string {
    if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY
    else throw new Error("Application must specify env var `YOUTUBE_API_KEY` to use this functionality.")
  }
}

export default Config
