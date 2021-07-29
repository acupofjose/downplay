export const EVENT_DOWNLOAD_ERROR = "download:error"
export const EVENT_DOWNLOAD_PROGRESS = "download:progress"
export const EVENT_DOWNLOAD_COMPLETE = "download:complete"

export interface YoutubedlResult {
  upload_date: string
  extractor: string
  height: number
  like_count: number
  duration: number
  fulltitle: string
  playlist_index: number
  view_count: number
  playlist: string
  title: string
  _filename: string
  tags: string[]
  is_live: null
  id: string
  dislike_count: number
  average_rating: number
  abr: number
  uploader_url: string
  subtitles: Subtitles
  fps: number
  stretched_ratio: null
  age_limit: number
  thumbnail: string
  channel: string
  acodec: Acodec
  display_id: string
  description: string
  format: string
  playlist_uploader: string
  playlist_id: string
  uploader: string
  format_id: string
  uploader_id: string
  categories: string[]
  playlist_title: string
  thumbnails: Thumbnail[]
  channel_id: string
  extractor_key: string
  vcodec: string
  vbr: number
  ext: YoutubedlResultEXT
  webpage_url_basename: string
  webpage_url: string
  formats: Format[]
  playlist_uploader_id: string
  channel_url: string
  resolution: null
  width: number
  n_entries: number
}

export enum Acodec {
  Mp4A402 = "mp4a.40.2",
  None = "none",
  Opus = "opus",
}

export enum YoutubedlResultEXT {
  M4A = "m4a",
  Mp4 = "mp4",
  Webm = "webm",
}

export interface Format {
  asr: number | null
  format_note: string
  protocol: Protocol
  format: string
  tbr: number
  height: number | null
  downloader_options?: DownloaderOptions
  format_id: string
  quality: number
  container?: Container
  http_headers: HTTPHeaders
  url: string
  vcodec: string
  abr?: number
  width: number | null
  ext: YoutubedlResultEXT
  filesize: number | null
  fps: number | null
  acodec: Acodec
  vbr?: number
}

export enum Container {
  M4ADash = "m4a_dash",
  Mp4Dash = "mp4_dash",
  WebmDash = "webm_dash",
}

export interface DownloaderOptions {
  http_chunk_size: number
}

export interface HTTPHeaders {
  "Accept-Charset": AcceptCharset
  "Accept-Language": AcceptLanguage
  "Accept-Encoding": AcceptEncoding
  Accept: Accept
  "User-Agent": string
}

export enum Accept {
  TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

export enum AcceptCharset {
  ISO88591UTF8Q07Q07 = "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
}

export enum AcceptEncoding {
  GzipDeflate = "gzip, deflate",
}

export enum AcceptLanguage {
  EnUsEnQ05 = "en-us,en;q=0.5",
}

export enum Protocol {
  HTTPS = "https",
}

export interface Subtitles {
  ru: De[]
  en: De[]
  pt: De[]
  de: De[]
  "zh-CN": De[]
  "es-419": De[]
  pl: De[]
}

export interface De {
  url: string
  ext: DeEXT
}

export enum DeEXT {
  Srv1 = "srv1",
  Srv2 = "srv2",
  Srv3 = "srv3",
  Ttml = "ttml",
  Vtt = "vtt",
}

export interface Thumbnail {
  url: string
  width: number
  resolution: string
  id: string
  height: number
}
