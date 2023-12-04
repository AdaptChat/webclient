import {SKIP, visit} from "unist-util-visit";
import {h} from "hastscript";

import type {Plugin} from "unified";
import type {Text, Element} from "hast";
import type {Root} from "remark-parse/lib";

export type Replacer = string | ((...matches: string[]) => string)

function generateSubstution(allText: string, exempt?: string): string {
  let substitution: string
  do {
    substitution = Math.random().toString(36).slice(2)
  } while (allText.includes(substitution) || exempt && substitution === exempt)
  return substitution
}

function createHastElement(replacement: string, match: string[]): Element {
  const hastElement: Element = h(replacement, match[1]) as any
  const properties = {
    ...hastElement.properties,
    value: match[1],
    arg: match[2],
  }
  return {
    type: 'element',
    tagName: replacement,
    properties,
    data: {
      hName: replacement,
      hProperties: properties,
    },
    children: hastElement.children,
  }
}

function createTextNode(parent: any, value: string, substitution: string) {
  const children = []
  let buffer = 0

  while (buffer <= value.length) {
    const sample = value.slice(buffer)
    if (sample.startsWith(substitution)) {
      const index = parseInt(sample.slice(substitution.length).match(/^\d+/)![0])

      children.push(parent.children[index])
      buffer += substitution.length + index.toString().length + 1
    } else {
      const end = sample.indexOf(substitution)
      children.push({
        type: 'text',
        value: sample.slice(0, end === -1 ? undefined : end),
      })
      if (end === -1) break
      buffer += end
    }
  }

  return children
}

export default function remarkRegexp(regexp: RegExp, replace: Replacer): Plugin<any[], Root> {
  return () => (tree) => {
    visit(tree, "text", (node, idx, parent) => {
      const allText = parent!.children.filter((n) => n.type === "text").map((n) => (n as Text).value).join("")

      const childSubstitution = generateSubstution(allText)
      const newChildSubstitution = generateSubstution(allText, childSubstitution)
      let substitutionMapping: any[] = []

      // hacky, but as long as the substution is not in the message, it should work.
      // obviously, there is no way to guarantee this, so this is a temporary solution.
      let syntheticChildren = parent!
        .children
        .map((n, i) => n.type === "text" ? n.value : `${childSubstitution}${i}.`)
        .join('')

      let match: RegExpExecArray
      let lastEnd = 0
      const globalRegexp = new RegExp(regexp, regexp.flags + 'g')

      while (match = globalRegexp.exec(syntheticChildren.slice(lastEnd))!) {
        const replacement = typeof replace === 'function'
          ? replace(...match)
          : replace

        const element = createHastElement(replacement, match)
        const substitution = `${newChildSubstitution}${substitutionMapping.length}.`
        const sliced = syntheticChildren.slice(lastEnd).replace(globalRegexp, substitution)
        syntheticChildren = syntheticChildren.slice(0, lastEnd) + sliced
        substitutionMapping.push(element)
      }

      const newChildren = []

      let buffer = 0
      while (buffer <= syntheticChildren.length) {
        const sample = syntheticChildren.slice(buffer)

        if (sample.startsWith(childSubstitution)) {
          const index = parseInt(sample.slice(childSubstitution.length).match(/^\d+/)![0])

          newChildren.push(parent!.children[index])
          buffer += childSubstitution.length + index.toString().length + 1
        }
        else if (sample.startsWith(newChildSubstitution)) {
          const index = parseInt(sample.slice(newChildSubstitution.length).match(/^\d+/)![0])
          const element = substitutionMapping[index]!
          const children = []

          for (const child of element.children) {
            if (child.type !== 'text') continue
            const text = child.value
            const newChildren = createTextNode(parent, text, childSubstitution)
            children.push(...newChildren)
          }

          element.children = children
          newChildren.push(substitutionMapping[index]!)
          buffer += newChildSubstitution.length + index.toString().length + 1
        }
        else {
          const end = sample.search(new RegExp(`${childSubstitution}|${newChildSubstitution}`))
          newChildren.push({
            type: 'text',
            value: sample.slice(0, end === -1 ? undefined : end)
          })
          if (end === -1) break
          buffer += end
        }
      }

      const nextChild = parent!.children.findIndex((n, i) => n.type !== "text" && i > (idx ?? -1))
      parent!.children = newChildren
      return [SKIP, nextChild]
    })
  }
}
