import { Canvas, FitBox, ImageSVG, rect, Skia, type SkSVG } from '@shopify/react-native-skia'
import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

// `null` when there is no svg or Skia can't parse it, so the card falls back to its simple design.
export function useSvg(svgSource?: string) {
  return useMemo(() => (svgSource ? Skia.SVG.MakeFromString(svgSource, Skia.FontMgr.System()) : null), [svgSource])
}

// ID-1, the size of a bank card, for a template without an intrinsic size.
const id1AspectRatio = 85.6 / 53.98

// Kept between square and twice as wide, so a template can't stretch the card out of shape.
export function getSvgAspectRatio(svg: SkSVG) {
  const aspectRatio = svg.width() / svg.height()
  return Number.isFinite(aspectRatio) && aspectRatio > 0 ? Math.min(Math.max(aspectRatio, 1), 2) : id1AspectRatio
}

export function CredentialSvg({ svg }: { svg: SkSVG }) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const hasIntrinsicSize = svg.width() > 0 && svg.height() > 0

  return (
    // Skia's Canvas doesn't support onLayout on the new architecture, so the view around it is measured.
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setSize(event.nativeEvent.layout)}>
      <Canvas style={StyleSheet.absoluteFill}>
        {hasIntrinsicSize ? (
          // Skia draws an svg with its own width and height at that size, so scale it to the card.
          <FitBox src={rect(0, 0, svg.width(), svg.height())} dst={rect(0, 0, size.width, size.height)}>
            <ImageSVG svg={svg} x={0} y={0} width={svg.width()} height={svg.height()} />
          </FitBox>
        ) : (
          <ImageSVG svg={svg} x={0} y={0} width={size.width} height={size.height} />
        )}
      </Canvas>
    </View>
  )
}
