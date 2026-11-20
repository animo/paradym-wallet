import { Image } from 'expo-image'
import { createMMKV, type MMKV, useMMKVString } from 'react-native-mmkv'
import { getSharedMmkvPath } from '../storage/sharedMmkv'

let store: MMKV | undefined

/**
 * The cache key of each remote image that changed, by url. In the shared container and
 * `multi-process`, because the credential request UI renders these images from its own process.
 */
function getImageCacheKeyStore() {
  store ??= createMMKV({ id: 'paradym-image-cache-keys', path: getSharedMmkvPath(), mode: 'multi-process' })
  return store
}

export const isRemoteImage = (src: unknown): src is string => typeof src === 'string' && /^https?:\/\//.test(src)

/**
 * The key a remote image is cached under: its url, until `revalidateImage` found a newer image
 * behind it. A cached image can't be replaced on Android, so a changed image gets a new key.
 */
export function getImageCacheKey(url: string) {
  return getImageCacheKeyStore().getString(url) ?? url
}

export function setImageCacheKey(url: string, cacheKey: string) {
  getImageCacheKeyStore().set(url, cacheKey)
}

/**
 * Removes all cached images and the keys they are cached under.
 */
export async function clearImageCache() {
  await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()])
  getImageCacheKeyStore().clearAll()
}

/**
 * The cache key to render a remote image with, or `undefined` when it is cached under its url.
 */
export function useImageCacheKey(src: unknown) {
  const [cacheKey] = useMMKVString(isRemoteImage(src) ? src : '', getImageCacheKeyStore())
  return cacheKey
}
