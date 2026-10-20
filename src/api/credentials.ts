// Temporary gate until the product is done: these ship in the public bundle, so they only keep casual visitors out.
export const LOGIN = 'iamgroot'
export const PASSWORD = 'iamnotgrood'

export function isValidLogin(login: string, password: string): boolean {
  return login === LOGIN && password === PASSWORD
}
