import type { DisplayImage } from '@paradym/wallet-sdk'
import { useEffect, useState } from 'react'

export function getOriginLabel(origin?: string) {
  if (!origin) return undefined

  try {
    return new URL(origin).hostname.replace(/^www\./, '')
  } catch {
    return origin
  }
}

function getHttpOriginUrl(origin: string) {
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined

    return new URL(url.origin)
  } catch {
    return undefined
  }
}

function getTagAttribute(tag: string, attributeName: string) {
  const attribute = new RegExp(`(?:^|\\s)${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(tag)
  return attribute?.[1] ?? attribute?.[2] ?? attribute?.[3]
}

function getHeadHtml(html: string) {
  return /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html.slice(0, 20_000)
}

function getFaviconScore(tag: string) {
  const rel = getTagAttribute(tag, 'rel')?.toLowerCase().split(/\s+/) ?? []
  if (!rel.some((value) => ['icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'].includes(value))) return 0

  const type = getTagAttribute(tag, 'type')?.toLowerCase()
  const sizeScore = (getTagAttribute(tag, 'sizes') ?? '').split(/\s+/).reduce((score, size) => {
    const [, width = '0', height = '0'] = /^(\d+)x(\d+)$/i.exec(size) ?? []
    return Math.max(score, Number(width) * Number(height))
  }, 0)

  return (
    (rel.includes('apple-touch-icon') ? 4000 : 0) +
    (rel.includes('apple-touch-icon-precomposed') ? 3500 : 0) +
    (rel.includes('icon') ? 3000 : 0) +
    (type?.includes('png') ? 500 : 0) +
    (type?.includes('svg') ? 400 : 0) +
    sizeScore
  )
}

function getFaviconFromHead(html: string, baseUrl: URL) {
  let best: { href: string; score: number } | undefined

  for (const [tag] of getHeadHtml(html).matchAll(/<link\b[^>]*>/gi)) {
    const href = getTagAttribute(tag, 'href')
    const score = getFaviconScore(tag)
    if (href && score > (best?.score ?? 0)) best = { href, score }
  }

  return best ? new URL(best.href, baseUrl).href : undefined
}

async function resolveOriginFavicon(origin: string) {
  const originUrl = getHttpOriginUrl(origin)
  if (!originUrl) return undefined

  const response = await fetch(originUrl.href, {
    headers: {
      Accept: 'text/html',
    },
  })

  if (!response.ok) return undefined

  return getFaviconFromHead(await response.text(), originUrl)
}

export function useOriginLogo(origin?: string): DisplayImage | undefined {
  const [logoUrl, setLogoUrl] = useState<string>()
  const label = getOriginLabel(origin)

  useEffect(() => {
    let isMounted = true

    setLogoUrl(undefined)
    if (!origin) return

    void resolveOriginFavicon(origin)
      .then((faviconUrl) => {
        if (isMounted) setLogoUrl(faviconUrl)
      })
      .catch(() => {
        if (isMounted) setLogoUrl(undefined)
      })

    return () => {
      isMounted = false
    }
  }, [origin])

  if (!logoUrl) return undefined

  return {
    url: logoUrl,
    altText: label,
  }
}
