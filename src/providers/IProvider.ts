import { Entity } from "@prisma/client"

interface IProvider {
  isParseable: (url: string) => boolean
  parse: <T>(url: string) => T | null
  download: (url: string) => Entity | null
}

export default IProvider
