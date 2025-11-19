export const useRefreshedDeferredCredentials = () => {
  // const { paradym } = useParadym('unlocked')
  // const { deferredCredentials, isLoading: isLoadingDeferredCredentials } = useDeferredCredentials()
  // const [refreshedDeferredCredentials, setRefreshedDeferredCredentials] = useState(false)
  // useEffect(() => {
  //   if (isLoadingDeferredCredentials || refreshedDeferredCredentials) return
  //   paradym.logger.debug('Refreshing deferred credentials')
  //   setRefreshedDeferredCredentials(true)
  //   fetchAndProcessDeferredCredentials(
  //     paradym,
  //     deferredCredentials
  //       .map((deferredCredential) => ({
  //         ...deferredCredential,
  //         nextCheckAt: getDeferredCredentialNextCheckAt(deferredCredential),
  //       }))
  //       .filter(
  //         (deferredCredential) =>
  //           !deferredCredential.nextCheckAt || deferredCredential.nextCheckAt.getTime() < Date.now()
  //       )
  //   ).finally(() => {
  //     paradym.logger.debug('Finished refreshing deferred credentials')
  //   })
  // }, [paradym, refreshedDeferredCredentials, isLoadingDeferredCredentials, deferredCredentials])
}
