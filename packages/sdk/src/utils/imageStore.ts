import { randomUUID } from 'expo-crypto'
import { Directory, File, Paths } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useCallback, useEffect, useRef } from 'react'
import { createMMKV, type MMKV, useMMKVString } from 'react-native-mmkv'
import { getAppGroupContainerPath } from '../dcApi/appGroup'
import { getSharedMmkvPath } from '../storage/sharedMmkv'

export type ImageKind = 'logo' | 'background'
export type ImageUse = { url?: string; kind: ImageKind }

/**
 * A remote image the wallet keeps its own copy of, such as the logo of an issuer, for as long as a
 * record uses it.
 *
 * Unlike expo-image's cache the copy doesn't expire, so a card looks the same offline and showing
 * it doesn't contact its issuer.
 */
interface StoredImage {
  kind: ImageKind
  /** The records that use the image, such as `credential:<id>`. The image goes with the last one. */
  usedBy: string[]
  /** Name of the file in the image directory. Missing until a copy of the image could be made. */
  file?: string
  /** SHA-256 of the image as served, to tell whether the image behind the url changed. */
  digest?: string
  addedAt: number
  /** When the image was last downloaded and compared with the stored copy. */
  refreshedAt?: number
}

/** Logos are shown at most as an 88 pt circle, backgrounds as a full-width card, on 3x screens. */
const logoMaxSide = 264
const backgroundMaxWidth = 1080

const revalidatedRecentlyMs = 60 * 1000

let store: MMKV | undefined

/**
 * The stored images, by url. In the shared container and `multi-process`, like the image files,
 * because the credential request UI renders these images from its own process.
 */
function getImageStore() {
  store ??= createMMKV({ id: 'paradym-image-store', path: getSharedMmkvPath(), mode: 'multi-process' })
  return store
}

let imageDirectory: Directory | undefined

function getImageDirectory() {
  if (!imageDirectory) {
    const containerPath = getAppGroupContainerPath()
    imageDirectory = new Directory(containerPath ? `file://${containerPath}` : Paths.document, 'images')
  }

  return imageDirectory
}

export const isRemoteImage = (src: unknown): src is string => typeof src === 'string' && /^https?:\/\//.test(src)

function getStoredImage(url: string): StoredImage | undefined {
  const value = getImageStore().getString(url)
  return value ? JSON.parse(value) : undefined
}

function setStoredImage(url: string, image: StoredImage) {
  getImageStore().set(url, JSON.stringify(image))
}

const getFile = (name: string) => new File(getImageDirectory(), name)

function deleteFile(name: string) {
  const file = getFile(name)
  if (file.exists) file.delete()
}

/**
 * The uri of the stored copy of a remote image, or `undefined` when there is none.
 */
export function getStoredImageUri(url: string) {
  const file = getStoredImage(url)?.file
  return file ? getFile(file).uri : undefined
}

const queue = new Map<string, Promise<void>>()

/**
 * Runs the tasks for a url one after another, so the references and the file of an image are
 * never changed by two tasks at once.
 */
function enqueue(url: string, task: () => Promise<void>) {
  const result = (queue.get(url) ?? Promise.resolve()).then(task)

  const settled = result.catch(() => {})
  queue.set(url, settled)
  void settled.then(() => {
    if (queue.get(url) === settled) queue.delete(url)
  })

  return result
}

async function isSvg(file: File) {
  const handle = file.open()
  try {
    const header = new TextDecoder().decode(await handle.readBytes(Math.min(file.size, 256))).trimStart()
    return header.startsWith('<svg') || header.startsWith('<?xml')
  } finally {
    handle.close()
  }
}

/**
 * Writes the image to the image directory, scaled down to the largest size its kind is shown at.
 * An svg is copied as it is.
 */
async function writeImage(source: File, kind: ImageKind) {
  const target = new File(getImageDirectory(), randomUUID())
  getImageDirectory().create({ idempotent: true, intermediates: true })

  if (await isSvg(source)) {
    await source.copy(target)
    return target
  }

  // Throws when it isn't an image, e.g. the login page of a captive portal.
  const image = await Image.loadAsync(source.uri)
  const { width, height } = image
  image.release()

  const scale = Math.min(1, kind === 'logo' ? logoMaxSide / Math.max(width, height) : backgroundMaxWidth / width)
  const context = ImageManipulator.manipulate(source.uri)
  if (scale < 1) context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) })

  const rendered = await context.renderAsync()
  // Both keep transparency. WebP keeps a full-width background small.
  const saved = await rendered.saveAsync(
    kind === 'logo' ? { format: SaveFormat.PNG } : { format: SaveFormat.WEBP, compress: 0.8 }
  )
  rendered.release()
  context.release()

  await new File(saved.uri).move(target)
  return target
}

/**
 * Stores the copy expo-image cached of an image that has no file yet. Never downloads it: that
 * happens only in a flow with the party it belongs to.
 */
async function storeFromCache(url: string) {
  const stored = getStoredImage(url)
  if (!stored || stored.file) return

  const cachePath = await Image.getCachePathAsync(url)
  if (!cachePath) return

  const source = new File(`file://${cachePath}`)
  const digest = await source.digest('SHA-256')
  const file = await writeImage(source, stored.kind)

  setStoredImage(url, { ...stored, file: file.name, digest })
}

/**
 * Records that the record uses these images, storing a copy of each image it is the first to use.
 */
export function addImageReferences(reference: string, uses: ImageUse[]) {
  return Promise.all(
    uses.map(({ url, kind }) => {
      if (!isRemoteImage(url)) return Promise.resolve()

      return enqueue(url, async () => {
        const stored = getStoredImage(url)
        if (stored) {
          if (!stored.usedBy.includes(reference)) {
            setStoredImage(url, { ...stored, usedBy: [...stored.usedBy, reference] })
          }
          return
        }

        setStoredImage(url, { kind, usedBy: [reference], addedAt: Date.now() })
        await storeFromCache(url)
      })
    })
  )
}

function removeImageReference(url: string, reference: string) {
  return enqueue(url, async () => {
    const stored = getStoredImage(url)
    if (!stored?.usedBy.includes(reference)) return

    const usedBy = stored.usedBy.filter((usedByReference) => usedByReference !== reference)
    if (usedBy.length > 0) {
      setStoredImage(url, { ...stored, usedBy })
      return
    }

    getImageStore().remove(url)
    if (stored.file) deleteFile(stored.file)
  })
}

const getImagesUsedBy = (reference: string) =>
  getImageStore()
    .getAllKeys()
    .filter((url) => isRemoteImage(url) && getStoredImage(url)?.usedBy.includes(reference))

/**
 * Records that the record no longer uses any image, removing the images nothing else uses.
 */
export function removeImageReferences(reference: string) {
  return Promise.all(getImagesUsedBy(reference).map((url) => removeImageReference(url, reference)))
}

/**
 * Records that the record now uses exactly these images, e.g. after its metadata was refreshed.
 */
export async function setImageReferences(reference: string, uses: ImageUse[]) {
  const urls = new Set(uses.map(({ url }) => url))
  await Promise.all(
    getImagesUsedBy(reference)
      .filter((url) => !urls.has(url))
      .map((url) => removeImageReference(url, reference))
  )
  await addImageReferences(reference, uses)
}

/**
 * Downloads a stored image and replaces the stored copy when the image changed. Every image
 * rendered with `useStoredImage` then switches to it. An image no record uses is left alone.
 */
// shortcut: downloads the whole image, send the stored ETag once images get large.
export function revalidateImage(url: string) {
  return enqueue(url, async () => {
    const stored = getStoredImage(url)
    if (!stored) return
    // Just downloaded, e.g. a deferred credential that was stored and revalidated right after.
    if (stored.refreshedAt && Date.now() - stored.refreshedAt < revalidatedRecentlyMs) return

    const download = new File(Paths.cache, randomUUID())
    try {
      await File.downloadFileAsync(url, download)
      const digest = await download.digest('SHA-256')

      if (digest === stored.digest && stored.file && getFile(stored.file).exists) {
        setStoredImage(url, { ...stored, refreshedAt: Date.now() })
        return
      }

      const file = await writeImage(download, stored.kind)
      setStoredImage(url, { ...stored, file: file.name, digest, refreshedAt: Date.now() })
      if (stored.file) deleteFile(stored.file)
    } finally {
      if (download.exists) download.delete()
    }
  })
}

/**
 * Revalidates the images. Only for the images of the party the user is interacting with, which
 * sees the requests.
 */
export function revalidateImages(urls: Array<string | undefined>) {
  for (const url of urls) {
    // The stored copy, or else the url, is shown when this fails.
    if (isRemoteImage(url)) revalidateImage(url).catch(() => {})
  }
}

/**
 * Revalidates each image once for as long as the component is mounted.
 */
export function useRevalidateImages(urls: Array<string | undefined>) {
  const revalidated = useRef(new Set<string>())

  useEffect(() => {
    revalidateImages(urls.filter((url) => url && !revalidated.current.has(url)))
    for (const url of urls) if (url) revalidated.current.add(url)
  })
}

/**
 * The source to render an image from: the stored copy of a remote image, or else the image itself.
 * Call `onLoad` once the image loaded, to store the copy expo-image just cached of an image a
 * record uses but that has no copy yet.
 */
export function useStoredImage<Source>(src: Source) {
  const url = isRemoteImage(src) ? src : undefined
  const [value] = useMMKVString(url ?? '', getImageStore())
  const file = value ? (JSON.parse(value) as StoredImage).file : undefined
  const isMissingFile = value !== undefined && !file

  const onLoad = useCallback(() => {
    if (url && isMissingFile) enqueue(url, () => storeFromCache(url)).catch(() => {})
  }, [url, isMissingFile])

  return { source: file ? getFile(file).uri : src, onLoad }
}

/**
 * Removes all stored images, and the images expo-image cached.
 */
export async function clearImageCache() {
  await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()])

  const directory = getImageDirectory()
  if (directory.exists) directory.delete()
  getImageStore().clearAll()
}

const backfilledKey = 'backfilled'

/**
 * Whether the images of the records that existed before the image store have been referenced.
 */
export const isImageStoreBackfilled = () => getImageStore().getBoolean(backfilledKey) === true

export const setImageStoreBackfilled = () => getImageStore().set(backfilledKey, true)
