import * as bcrypt from "bcrypt"
import { Stream } from "stream"

export const hash = async (password: string, rounds: number = 12) => {
  const result = await bcrypt.hash(Buffer.from(password).toString("base64"), rounds)
  return result
}

export const compare = async (input: string, expected: string) => {
  const result = await bcrypt.compare(Buffer.from(input).toString("base64"), expected)
  return result
}

export const ext = (url: string) => {
  return (url = url.substr(1 + url.lastIndexOf("/")).split("?")[0]).split("#")[0].substr(url.lastIndexOf("."))
}

export const getQueryJsonFromUrl = (url: string) => {
  var query = url.split("?")[1]
  var result: { [key: string]: any } = {}
  query.split("&").forEach(function (part) {
    var item = part.split("=")
    result[item[0]] = decodeURIComponent(item[1])
  })
  return result
}

export const stream2buffer = async (stream: Stream): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>()

    stream.on("data", (chunk) => _buf.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(_buf)))
    stream.on("error", (err) => reject(`error converting stream - ${err}`))
  })
}
