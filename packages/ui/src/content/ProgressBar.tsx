import { type ColorTokens, createStyledHOC, type GetProps, Progress, styled, withStaticProperties } from 'tamagui'

const _ProgressBar = styled(Progress, {
  name: 'ProgressBar',
  size: '4',
  backgroundColor: 'grey-200',
})

const ProgressBarStyled = createStyledHOC(
  _ProgressBar,
  ({ indicatorColor, ...props }: GetProps<typeof _ProgressBar> & { indicatorColor?: ColorTokens }, ref) => {
    return (
      <_ProgressBar {...props} ref={ref}>
        {props.children ?? <Progress.Indicator backgroundColor={indicatorColor ?? 'primary-500'} />}
      </_ProgressBar>
    )
  }
)

/**
 * Progress bar which renders an indicator by default. You can override it by
 * passing a ProgressBar.Indicator component
 */
export const ProgressBar = withStaticProperties(ProgressBarStyled, {
  Indicator: Progress.Indicator,
})
