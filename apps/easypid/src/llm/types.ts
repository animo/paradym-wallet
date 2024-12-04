export type ResourceSource = string | number

export interface Model {
  generate: (input: string) => Promise<void>
  response: string
  downloadProgress: number
  error: string | null
  isModelGenerating: boolean
  isModelReady: boolean
  isModelActivated: boolean
  isModelDownloading: boolean
  interrupt: () => void
  loadModel: () => Promise<void>
  removeModel: () => void
}
