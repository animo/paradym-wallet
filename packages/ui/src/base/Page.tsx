import { styled } from 'tamagui'

import { paddingSizes } from '../tamagui.config'

import { Stack } from './Stacks'

export const Page = styled(Stack, {
  name: 'Page',
  backgroundColor: '$grey-200',
  position: 'absolute',
  padding: paddingSizes.xl,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})

// export type PageContainerProps = GetProps<typeof PageContainer>

// export type PageProps = PageContainerProps & {
//   scrollable: boolean
// }

// export const Page = ({ children, scrollable, ...props }: PropsWithChildren<PageProps>) => {
//   if (scrollable)
//     return (
//       <ScrollView>
//         <PageContainer {...props}>{children}</PageContainer>
//       </ScrollView>
//     )

//   return <PageContainer {...props}>{children}</PageContainer>
// }
