import {Plugin, unified} from "unified";
import {visit} from "unist-util-visit";
import {VFile} from "vfile";

import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import {Root as HtmlRoot} from "rehype-stringify/lib";
import {Root as MdRoot} from "remark-parse/lib";

import {createSignal, JSX} from "solid-js";
import {Navigator, useNavigate} from "@solidjs/router";

import {Member} from "../../types/guild";
import {getApi} from "../../api/Api";
import {snowflakes} from "../../utils";
import {GuildCreateEvent} from "../../types/ws";
import {childrenToSolid} from "./markdown/ast-to-solid";
import {html} from "property-information";
import remarkRegexp from "./markdown/regex-plugin";

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
      return joinGuild(href, navigate)
    }
    else if (url.hostname === 'app.adapt.chat') {
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }
    else if (url.hostname.endsWith('adapt.chat'))
      return

    if (!window.confirm(`You are about to leave Adapt.chat and go to ${href}. Are you sure?`)) {
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
        <span class="bg-gray-700 text-xs px-1 py-0.5 ml-1 rounded-lg select-none text-base-content/80">Image</span>
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
        "text-base-content bg-gray-600/50": revealed(),
      }}
      onClick={() => setRevealed(true)}
    >
      <span classList={{
        "absolute inset-0 bg-gray-900 rounded transition duration-200 pointer-events-none opacity-100": true,
        "opacity-0": revealed(),
        "opacity-100": !revealed(),
      }} />
      {props.children}
    </span>
  )
}

export async function joinGuild(code: string, navigate: Navigator) {
  const api = getApi()!

  let acked = false
  let ack = (guildId: number) => {
    acked = true
    navigate(`/guilds/${guildId}`)
  }

  const nonce = snowflakes.fromTimestamp(Date.now())
  api.ws?.on("guild_create", (event: GuildCreateEvent, remove) => {
    if (acked)
      return remove()
    if (!event.nonce || event.nonce != nonce.toString())
      return

    ack(event.guild.id)
    remove()
  })

  const matches = code.match(/(?:(?:https?:\/\/(?:www\.)?)?adapt\.chat\/invite\/)?(\w{6,12})\/?/) ?? code
  if (!matches || matches.length < 1)
    throw new Error('Invite code did not match expected format.')

  const response = await api.request<Member>(
    'POST',
    `/invites/${matches[1]}`,
    { params: { nonce } },
  )
  if (!response.ok)
    throw new Error(response.errorJsonOrThrow().message)

  const { guild_id } = response.ensureOk().jsonOrThrow()
  if (api.cache?.guildList?.includes(guild_id))
    ack(guild_id)
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

function MentionUser({ arg, children, ...props }: any) {
  const api = getApi()!
  const user = api.cache?.users?.get(parseInt(arg))
  // TODO: Should there be a special fallback for when the user is not found?
  if (!user) return <span {...props}>{children}</span>

  return (
    <span
      {...props}
      class="bg-accent bg-opacity-30 hover:bg-opacity-80 py-0.5 rounded cursor-pointer transition duration-200"
    >
      @{user.username}
    </span>
  )
}

export const components: Record<string, (props: JSX.HTMLAttributes<any>) => JSX.Element> = {
  strong: (props) => <strong class="font-bold" {...props} />,
  h1: (props) => <h1 class="text-2xl font-bold" {...props} />,
  h2: (props) => <h2 class="text-xl font-bold" {...props} />,
  h3: (props) => <h3 class="text-lg font-bold" {...props} />,
  h4: (props) => <h4 class="text-base font-bold" {...props} />,
  h5: (props) => <h5 class="text-sm font-bold" {...props} />,
  h6: (props) => <h6 class="text-xs font-bold" {...props} />,
  a: Anchor,
  img: (props: any) => <Anchor {...props} isImage href={props.src}>{props.alt || props.src}</Anchor>,
  span: (props) => <span {...props} />,
  code: (props) => <code {...props} class="bg-gray-900 rounded px-1 py-0.5" />,
  // TODO: syntax highlighting
  pre: (props) => (
    <pre class="bg-gray-900 rounded px-2 py-1 my-1 whitespace-pre-wrap break-words all-children:!px-0" {...props} />
  ),
  ul: (props) => <ul class="list-disc ml-4" {...props} />,
  ol: (props) => <ol class="list-decimal ml-4" {...props} />,
  spoiler: Spoiler,
  highlight: (props) => <span class="bg-highlight text-highlight-content rounded py-0.5" {...props} />,
  styled: ({ arg, ...props }: any) => <span {...props} style={parseStyle(arg)} />,
  'mention-user': MentionUser,
  blockquote: (props) => (
    <div class="flex">
      <div class="select-none bg-gray-600 rounded-full w-0.5" />
      <blockquote class="mx-2" {...props} />
    </div>
  ),
}

export const render = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  // TODO: Backslashes are supposed to work here, however browser support for negative lookbehind is limited
  //  (Safari doesn't support it until 16.4, which is not yet stable as of writing this)
  .use(remarkRegexp(/\|\|(.+?)\|\|/s, 'spoiler'))
  .use(remarkRegexp(/!!(.+?)!!/s, 'highlight'))
  .use(remarkRegexp(/\[([^\]]+)]\{([^}]+)}/, 'styled'))
  .use(remarkRegexp(/(<@(\d{14,24})>)/, 'mention-user'))
  .use(flattenHtml)
  .use(remarkRehype)
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
    .replace(/^([+\-*]|(\d[.)]))\s*$/, '\u200E$1')

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
  );
}