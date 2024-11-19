export function redirectSystemPath({ path }: { initial: boolean; path: string }) {
  try {
    console.log('the path', path)
    if (path === '/wallet/redirect') {
      return null
    }
    return path
  } catch {
    // Do not crash inside this function! Instead you should redirect users
    // to a custom route to handle unexpected errors, where they are able to report the incident
    return '/'
  }
}
