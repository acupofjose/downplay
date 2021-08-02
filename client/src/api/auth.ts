import Api from "./index"

export default class Auth {
  static login = async (username: string, password: string) => {
    const endpoint = `/auth/login`
    const result = await Api.instance.post(endpoint, {
      username,
      password,
    })
    return result.data as { token: string }
  }

  static register = async (username: string, password: string) => {
    const endpoint = `/auth/register`
    const result = await Api.instance.post(endpoint, {
      username,
      password,
    })
    return result.data as { token: string }
  }
}
