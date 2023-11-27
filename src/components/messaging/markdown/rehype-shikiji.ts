/**
 * Taken from <https://github.com/antfu/shikiji/blob/main/packages/rehype-shikiji/src/index.ts>
 */

import type {BuiltinLanguage, BuiltinTheme, CodeToHastOptions} from 'shikiji'
import {addClassToHast, bundledLanguages, bundledLanguagesAlias, getHighlighter} from 'shikiji'
import {toString} from 'hast-util-to-string'
import {visit} from 'unist-util-visit'
import type {Plugin} from 'unified'
import type {Root} from 'hast'
import {Theme} from "../../../client/themes";

// <https://github.com/antfu/shikiji/blob/main/packages/shared/line-highlight.ts>
export function parseHighlightLines(attrs: string) {
  if (!attrs)
    return null
  const match = attrs.match(/{([\d,-]+)}/)
  if (!match)
    return null

  return match[1].split(',')
    .flatMap((v) => {
      const num = v.split('-').map(v => Number.parseInt(v, 10))
      if (num.length === 1)
        return [num[0]]
      else
        return Array.from({length: num[1] - num[0] + 1}, (_, i) => i + num[0])
    })
}

export const LIGHT_THEME: BuiltinTheme = 'github-light'
export const DARK_THEME: BuiltinTheme = 'github-dark'

const options = {
  langs: [
    ...Object.keys(bundledLanguages) as BuiltinLanguage[],
    () => fetch('/terbium.tmLanguage.json').then(r => r.json()),
  ],
  langAlias: {
    tb: 'terbium',
    trb: 'terbium',
  },
}
const highlighter = await getHighlighter(options as any)
await highlighter.loadTheme(LIGHT_THEME, DARK_THEME)

const rehypeShikiji: Plugin<[], Root> = function () {
  const prefix = 'language-'

  return function (tree: any) {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index == null || node.tagName !== 'pre')
        return

      const head = node.children[0]

      if (
        !head
        || head.type !== 'element'
        || head.tagName !== 'code'
        || !head.properties
      )
        return

      const classes = head.properties.className

      if (!Array.isArray(classes))
        return

      const language = classes.find(
        d => typeof d === 'string' && d.startsWith(prefix),
      )

      if (typeof language !== 'string')
        return

      let lang = language.slice(prefix.length)
      if (!highlighter.getLoadedLanguages().includes(lang))
        lang = 'text'

      const code = toString(head as any)
      const attrs = (head.data as any)?.meta

      let theme: string = DARK_THEME
      let storedTheme = localStorage.getItem('theme')
      if (storedTheme) {
        const [r, g, b] = (JSON.parse(storedTheme) as Theme).bg[0]
        theme = r * 0.299 + g * 0.587 + b * 0.114 > 186 ? LIGHT_THEME : DARK_THEME
      }

      const codeOptions: CodeToHastOptions = {
        ...options, theme, lang, meta: {},
      }

      if (typeof attrs === 'string') {
        const lines = parseHighlightLines(attrs)
        if (lines) {
          const className = 'highlighted'

          codeOptions.transformers ||= []
          codeOptions.transformers.push({
            name: 'rehype-shikiji:line-class',
            line(node, line) {
              if (lines.includes(line))
                addClassToHast(node, className)
              return node
            },
          })
        }
      }
      const fragment = highlighter.codeToHast(code, codeOptions)
      parent.children.splice(index, 1, ...fragment.children)
    })
  }
}

export default rehypeShikiji