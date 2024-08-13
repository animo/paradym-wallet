import { Progress, styled, withStaticProperties } from 'tamagui'

const _ProgressBar = styled(Progress, {
  name: 'ProgressBar',
  size: '$4',
  backgroundColor: '$grey-300',
  variants: {
    // Added here for type completion, but rendered in ProgressBar
    indicatorColor: {
      '...color': () => ({}),
    },
  },
})

const ProgressBarStyled = _ProgressBar.styleable(({ indicatorColor, ...props }, ref) => {
  return (
    <_ProgressBar {...props} ref={ref}>
      {props.children ?? <Progress.Indicator backgroundColor={indicatorColor ?? '$primary-500'} animation="lazy" />}
    </_ProgressBar>
  )
})

/**
 * Progress bar which renders an indicator by default. You can override it by
 * passing a ProgressBar.Indicator component
 */
export const ProgressBar = withStaticProperties(ProgressBarStyled, {
  Indicator: Progress.Indicator,
})
