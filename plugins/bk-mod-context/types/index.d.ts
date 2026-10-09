/**
 * The live window as the API last reported it: tokens the last response was
 * answered over, the model's window, and whether any response has reported yet.
 */
export type ContextFill = {
  tokens: number
  window: number
  isKnown: boolean
}

/**
 * The main loop's model as `/model` names it, and the session's effort level.
 */
export type ModelSetting = {
  model: string
  effort: string
}

declare module 'claude-code' {
  interface PluginState {
    'bk-mod-context': {
      fill: ContextFill
      setting: ModelSetting
    }
  }
}
