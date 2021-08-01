import * as bcrypt from "bcrypt"

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
