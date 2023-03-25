/**
 * This code is derived from code provided under the MIT License
 * Copyright (c) 2023 y_nk
 * https://www.npmjs.com/package/remark-regexp
 */

import { visit } from "unist-util-visit";
import {Element} from "hast";
import {Root} from "remark-parse/lib";
import {Plugin} from "unified";
import {h} from "hastscript";

export type Replacer = string | ((...matches: string[]) => Element | string)

export default function remarkRegexp(regexp: RegExp, replace: Replacer): Plugin<any[], Root> {
  return () => (tree) => {
    visit(tree, "text", (node, _, parent) => {
      const matches = regexp.exec(node.value)
      if (!matches) return

      const replacement = typeof replace === 'function'
        ? replace(...matches)
        : replace

      const element: Element = typeof replacement === 'string'
        ? h(replacement, matches[1]) as any
        : replacement as any

      const { properties } = element
      element.data ??= {}

      const index = node.value.search(regexp)
      const start = h('span', node.value.slice(0, index))
      const end = h('span', node.value.slice(index + matches[0].length))

      const data = parent!.data ??= {} as any
      data.hChildren = [start, element, end]

      if (properties)
        element.properties = {
          ...data.hProperties,
          ...properties,
        };
      (parent as any).data = data
    })
  }
}
