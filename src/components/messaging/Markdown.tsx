import {CompilerFunction, Plugin, unified} from "unified";
import {visit} from "unist-util-visit";

import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import {Root as HtmlRoot} from "rehype-stringify/lib";
import {Root as MdRoot} from "remark-parse/lib";
import {toJsxRuntime} from "hast-util-to-jsx-runtime";

import {JSX} from "solid-js";
import {Fragment, jsx, jsxs, jsxDEV} from "solid-js/h/jsx-runtime";

const flattenHtml: Plugin<any[], MdRoot> = () => (tree) => {
  visit(tree, "html", (node) => {
    node.type = "text" as "html" // lol
  })
}

const underline: Plugin<any[], HtmlRoot> = () => (tree, file) => {
  visit(tree, "element", (node) => {
    if (!node.position) return
    const startOffset = node.position.start.offset
    const endOffset = node.position.end.offset
    if (startOffset == null || endOffset == null) return

    if (
      file.value.slice(startOffset, startOffset + 2) == '__'
      && file.value.slice(endOffset - 2, endOffset) == '__'
    ) {
      node.tagName = 'span'
      node.properties = {
        style: 'text-decoration: underline;'
      }
    }
  })
}

const components: Record<string, (props: JSX.HTMLAttributes<any>) => JSX.Element> = {
  strong: (props) => <strong class="font-bold" {...props} />,
  h1: (props) => <h1 class="text-2xl font-bold" {...props} />,
  h2: (props) => <h2 class="text-xl font-bold" {...props} />,
  h3: (props) => <h3 class="text-lg font-bold" {...props} />,
  h4: (props) => <h4 class="text-base font-bold" {...props} />,
  h5: (props) => <h5 class="text-sm font-bold" {...props} />,
  h6: (props) => <h6 class="text-xs font-bold" {...props} />,
  a: (props) => <a class="text-link underline" rel="noreferrer" target="_blank" {...props} />,
}

function toJsx(this: any) {
  const compiler: CompilerFunction<HtmlRoot, JSX.Element> = (tree) => toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    jsxDEV,
    components,
    elementAttributeNameCase: 'html',
    stylePropertyNameCase: 'css',
  })
  Object.assign(this, { Compiler: compiler })
}

export const render = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(flattenHtml)
  .use(remarkRehype)
  .use(underline)
  .use(toJsx)
