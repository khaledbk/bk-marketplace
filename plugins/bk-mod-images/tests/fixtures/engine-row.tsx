import type { On } from 'claude-code'
import { mock } from 'claude-code/testing'

/**
 * The engine's own drawing of every component, beneath the plugin: one
 * `Text` keyed `row`, in a terminal that speaks kitty graphics unless `env` says otherwise.
 */
export const engineRow = (on: On, env: Record<string, string> = { TERM: 'xterm-kitty' }) => {
  mock.env(on, env)
  return on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text key="row">{`engine ${e.component}`}</Text>
  })
}
