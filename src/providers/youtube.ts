import { Entity } from ".prisma/client"
import IProvider from "./IProvider"

class YoutubeProvider implements IProvider {
  download = (url: string): Entity | null => null
  isParseable = (url: string): boolean => false
  parse = <T>(url: string): T | null => null
}

export default YoutubeProvider
