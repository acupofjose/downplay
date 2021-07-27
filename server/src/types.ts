export const EVENT_DOWNLOAD_PROGRESS = "download:progress"
export const EVENT_DOWNLOAD_COMPLETE = "download:complete"

export interface YoutubedlResult {
  upload_date: string
  protocol: string
  extractor: string
  format_note: string
  height: number
  like_count: number
  duration: number
  fulltitle: string
  quality: number
  id: string
  view_count: number
  playlist: any
  container: string
  title: string
  _filename: string
  format: string
  ext: string
  playlist_index: number
  dislike_count: number
  average_rating: number
  abr: number
  uploader_url: string
  filesize: number
  fps: number
  channel_url: string
  thumbnail: string
  channel: string
  acodec: string
  display_id: string
  asr: number
  description: string
  tags: string[]
  requested_subtitles: number
  tbr: number
  downloader_options: DownloaderOptions
  uploader: string
  format_id: string
  uploader_id: string
  categories: string[]
  thumbnails: Thumbnail[]
  url: string
  extractor_key: string
  vcodec: string
  http_headers: any
  channel_id: string
  is_live: boolean
  webpage_url_basename: string
  webpage_url: string
  formats: Format[]
  width: number
  age_limit: number
}

export interface DownloaderOptions {
  http_chunk_size: number
}

export interface Format {
  asr: number | null
  format_note: string
  protocol: string
  format: string
  tbr: number
  height: number | null
  downloader_options?: DownloaderOptions
  format_id: string
  quality: number
  container?: string
  http_headers: any
  url: string
  vcodec: string
  abr?: number
  width: number | null
  ext: string
  filesize: number | null
  fps: number | null
  acodec: string
  vbr?: number
}

export interface Thumbnail {
  url: string
  width: number
  resolution: string
  id: string
  height: number
}
