import { useAgent } from '../providers/AgentProvider'

export const useLogger = () => {
  const { agent } = useAgent()

  return {
    logger: {
      ...agent.config.logger,
    },
  }
}
