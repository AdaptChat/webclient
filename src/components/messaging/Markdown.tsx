import "katex/dist/katex.min.css";

import {Plugin, unified} from "unified";
import {visit} from "unist-util-visit";
import {VFile} from "vfile";

import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import remarkMath from "remark-math";
import rehypeShikiji from "./markdown/rehype-shikiji";
import rehypeKatex from "rehype-katex";
import {Root as HtmlRoot} from "rehype-stringify/lib";
import {Root as MdRoot} from "remark-parse/lib";

import {createSignal, JSX, Show} from "solid-js";
import {A, useNavigate, useParams} from "@solidjs/router";

import {getApi} from "../../api/Api";
import {displayName, snowflakes} from "../../utils";
import {childrenToSolid} from "./markdown/ast-to-solid";
import {html} from "property-information";
import remarkRegexp from "./markdown/regex-plugin";
import {GuildChannel} from "../../types/channel";

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

function Anchor(props: JSX.HTMLAttributes<HTMLAnchorElement> & { isImage?: boolean }) {
  const navigate = useNavigate()
  const handler: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (e) => {
    if (e.ctrlKey || e.metaKey)
      return e.preventDefault()

    const href = e.currentTarget.href
    if (href.startsWith('#')) return

    const url = new URL(href)
    if (url.hostname === 'adapt.chat' && url.pathname.startsWith("/invite/")) {
      e.preventDefault()
      return navigate(url.pathname)
    }
    else if (url.hostname === 'app.adapt.chat') {
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }
    else if (url.hostname.endsWith('adapt.chat'))
      return

    if (!window.confirm(`You are about to leave Adapt and go to ${href}. Are you sure?`)) {
      e.preventDefault()
    }
  }

  return (
    <a
      {...props}
      class="group/anchor"
      target="_blank"
      rel="noreferrer"
      onClick={handler}
    >
      <span class="underline text-link group-hover/anchor:text-link-hover group-visited/anchor:text-link-visited transition">
        {props.children}
      </span>
      {props.isImage && (
        <span class="bg-3 text-xs px-1 py-0.5 ml-1 rounded-lg select-none text-fg/80">Image</span>
      )}
    </a>
  )
}

function Spoiler(props: JSX.HTMLAttributes<HTMLSpanElement>) {
  const [revealed, setRevealed] = createSignal(false)

  return (
    <span
      {...props}
      classList={{
        "relative rounded py-0.5": true,
        "cursor-pointer select-none all:!text-transparent": !revealed(),
        "text-fg bg-bg-3/60": revealed(),
      }}
      onClick={() => setRevealed(true)}
    >
      <span classList={{
        "absolute inset-0 bg-0 rounded transition duration-200 pointer-events-none opacity-100": true,
        "opacity-0": revealed(),
        "opacity-100": !revealed(),
      }} />
      {props.children}
    </span>
  )
}

function sanitizeCSSValue(value: string) {
  return value.replace(/[:;!]/g, '')
}

/**
 * Parses a style string into a CSS string.
 *
 * A style string can be either the following:
 * - A comma-separated list of key-value pairs, where a key-value pair is written as `key=value`
 *   - Available keys are: `color` and `bg`, which are both CSS colors
 * - A lone CSS color, which will be assumed to be the `color` key
 *
 * Example: `color=red, bg=blue`
 *
 * Since CSS colors can contain commas, any commas enclosed in parentheses are assumed to be part of the color.
 * For example, `color=rgb(255, 0, 0), bg=rgb(0, 255, 0)` is valid.
 *
 * @param style The style string to parse
 */
function parseStyle(style: string): string {
  const parts = style.split(/,(?![^(]*\))/g)
  const css: string[] = []
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (!key || !value)
      continue

    switch (key.trim()) {
      case 'color':
        css.push(`color: ${sanitizeCSSValue(value)} !important;`)
        break
      case 'bg':
        css.push(`background-color: ${sanitizeCSSValue(value)} !important;`)
        break
    }
  }
  if (!css.length) {
    if (!style.length) return '';
    css.push(`color: ${sanitizeCSSValue(style)} !important;`)
  }
  return css.join(' ')
}

function Mention({ arg, children, ...props }: any) {
  const api = getApi()!
  const fallback = () => <span {...props}>{children}</span>

  let id: bigint
  try {
    id = BigInt(arg)
  } catch {
    return fallback()
  }

  let mention
  switch (snowflakes.modelType(id)) {
    case snowflakes.ModelType.User:
      const user = api.cache?.users?.get(id);
      mention = user && displayName(user);
      break
    case snowflakes.ModelType.Role:
      mention = api.cache?.roles?.get(id)?.name;
      break
    case snowflakes.ModelType.Guild:
      mention = 'everyone';
      break
    default:
      mention = null
  }
  // TODO: Should there be a special fallback for when the mention is not found?
  if (!mention) return fallback()

  return (
    <span
      {...props}
      class="bg-accent bg-opacity-30 hover:bg-opacity-80 py-0.5 rounded cursor-pointer transition duration-200"
    >
      @{mention}
    </span>
  )
}

function MentionChannel({arg, children, ...props }: any) {
  const api = getApi()!
  const params = useParams()
  const channel = api.cache?.channels?.get(BigInt(arg)) as GuildChannel | undefined
  // TODO: Should there be a special fallback for when the channel is not found?
  if (!channel) return <span {...props}>{children}</span>

  return (
    <A
      {...props}
      class="bg-accent bg-opacity-30 hover:bg-opacity-80 py-0.5 rounded cursor-pointer transition duration-200"
      href={`/guilds/${channel.guild_id}/${channel.id}`}
    >
      #{channel.name}
      <Show when={channel.guild_id != params.guildId as any as bigint} keyed={false}>
        <span class="text-fg/80"> ({api.cache?.guilds.get(channel.guild_id)?.name})</span>
      </Show>
    </A>
  )
}

export const components: Record<string, (props: JSX.HTMLAttributes<any>) => JSX.Element> = {
  strong: (props) => <strong class="font-bold" {...props} />,
  h1: (props) => <h1 class="text-2xl font-bold my-[0.6em]" {...props} />,
  h2: (props) => <h2 class="text-xl font-bold my-[0.7em]" {...props} />,
  h3: (props) => <h3 class="text-lg font-bold my-[0.8em]" {...props} />,
  h4: (props) => <h4 class="text-base font-bold my-[0.9em]" {...props} />,
  h5: (props) => <h5 class="text-sm font-bold my-[1.0em]" {...props} />,
  h6: (props) => <h6 class="text-xs font-bold my-[1.1em]" {...props} />,
  a: Anchor,
  img: (props: any) => <Anchor {...props} isImage href={props.src}>{props.alt || props.src}</Anchor>,
  span: (props) => <span {...props} />,
  code: (props) => <code {...props} class="bg-0 rounded text-xs px-1 py-0.5" />,
  pre: (props) => (
    <div class="bg-0 rounded px-2.5 py-1.5 my-1">
      <pre {...props} />
    </div>
  ),
  ul: (props) => <ul class="list-disc ml-4" {...props} />,
  ol: (props) => <ol class="list-decimal ml-4" {...props} />,
  li: (props) => <li class="my-0.5" {...props} />,
  spoiler: Spoiler,
  highlight: (props) => <span class="bg-highlight text-highlight-content rounded py-0.5" {...props} />,
  styled: ({ arg, ...props }: any) => <span {...props} style={parseStyle(arg)} />,
  'mention-user': Mention,
  'mention-channel': MentionChannel,
  blockquote: (props) => (
    <div class="flex">
      <div class="select-none bg-fg/25 rounded-full w-0.5" />
      <blockquote class="mx-2" {...props} />
    </div>
  ),
}

export const render = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkMath, {
    singleDollarTextMath: false
  })
  // TODO: Backslashes are supposed to work here, however browser support for negative lookbehind is limited
  //  (Safari doesn't support it until 16.4, which is not yet stable as of writing this)
  .use(remarkRegexp(/\|\|(.+?)\|\|/s, 'spoiler'))
  .use(remarkRegexp(/!!(.+?)!!/s, 'highlight'))
  .use(remarkRegexp(/\[([^\]]+)]\{([^}]+)}/, 'styled'))
  .use(remarkRegexp(/(<@!?(\d{14,20})>)/, 'mention-user'))
  .use(remarkRegexp(/(<#!?(\d{14,20})>)/, 'mention-channel'))
  .use(flattenHtml)
  .use(remarkRehype)
  .use(rehypeKatex, {
    maxSize: 4,
    maxExpand: 0,
    trust: false,
    strict: false,
    output: "html",
    errorColor: "theme(colors.error)",
  })
  .use(rehypeShikiji)
  .use(underline)

const defaults = {
  remarkPlugins: [],
  rehypePlugins: [],
  class: "",
  unwrapDisallowed: false,
  disallowedElements: undefined,
  allowedElements: undefined,
  allowElement: undefined,
  children: "",
  sourcePos: false,
  rawSourcePos: false,
  skipHtml: false,
  includeElementIndex: false,
  transformLinkUri: null,
  transformImageUri: undefined,
  linkTarget: "_self",
}

export function DynamicMarkdown(props: { content: string }) {
  const file = new VFile();
  file.value = props.content
    .replace(/^([+\-*]|(\d[.)]))\s*$/g, '\u200E$1') // fix lists
    .replace(/<@(\d{14,20})>/g, '<@!$1>') // fix mentions being shown as mailto links

  const root = render.runSync(render.parse(file), file);
  if (root.type !== "root" as any)
    throw new TypeError("Expected a `root` node")

  return childrenToSolid(
    {
      options: {
        ...defaults,
        components,
      },
      schema: html,
      listDepth: 0,
    },
    root,
  )
}
