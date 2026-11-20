import { randomUUID } from 'expo-crypto'
import { File, Paths } from 'expo-file-system'
import { Image } from 'expo-image'
import { useEffect, useRef } from 'react'
import { getImageCacheKey, isRemoteImage, setImageCacheKey } from './imageCacheKey'

/**
 * Downloads a cached image again and, when it changed, caches the new one under a new key. Every
 * image rendered with `useImageCacheKey` then switches to it.
 *
 * An image that isn't cached is left alone: displaying it fetches the current one.
 */
// shortcut: downloads the whole image on every call, send the stored ETag once logos get large.
export async function revalidateImage(url: string) {
  const cachedPath = await Image.getCachePathAsync(getImageCacheKey(url))
  if (!cachedPath) return

  const download = new File(Paths.cache, `image-revalidation-${randomUUID()}`)
  try {
    await File.downloadFileAsync(url, download)

    const digest = await download.digest('SHA-256')
    if (digest === (await new File(`file://${cachedPath}`).digest('SHA-256'))) return

    const cacheKey = `${url}#${digest}`
    await Image.writeToCacheAsync(download.uri, cacheKey)
    // Not an image, e.g. the login page of a captive portal: keep showing the cached one.
    if (!(await Image.readFromCacheAsync(cacheKey))) return

    setImageCacheKey(url, cacheKey)
  } finally {
    if (download.exists) download.delete()
  }
}

/**
 * Revalidates each image once for as long as the component is mounted. Only for the images of the
 * party the user is interacting with, which sees the requests.
 */
export function useRevalidateImages(urls: Array<string | undefined>) {
  const revalidated = useRef(new Set<string>())

  useEffect(() => {
    for (const url of urls) {
      if (!isRemoteImage(url) || revalidated.current.has(url)) continue
      revalidated.current.add(url)

      // The cached image stays when this fails.
      revalidateImage(url).catch(() => {})
    }
  })
}
