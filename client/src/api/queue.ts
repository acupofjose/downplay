import Api from "./index"

export default class Queue {
  static enqueue = async (youtubeUrl: string, audioOnly: boolean = true) => {
    const endpoint = `/queue`
    try {
      const result = await Api.instance.post(endpoint, {
        url: youtubeUrl,
        audioOnly,
      })
      return result
    } catch (err) {
      console.log(err)
    }
  }
}
