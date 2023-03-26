import {Plugin, unified} from "unified";
import {visit} from "unist-util-visit";

import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import {Root as HtmlRoot} from "rehype-stringify/lib";
import {Root as MdRoot} from "remark-parse/lib";

import {createSignal, JSX} from "solid-js";
import {Member} from "../../types/guild";
import {getApi} from "../../api/Api";
import {snowflakes} from "../../utils";
import {GuildCreateEvent} from "../../types/ws";
import {Navigator, useNavigate} from "@solidjs/router";
import {VFile} from "vfile";
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

const textStyle: Plugin<any[], HtmlRoot> = () => (tree) => {
  visit(tree, "element", (node) => {
    if (node.tagName !== 'a') return
    const href = node.properties?.href as string
    if (!href) return

    if (href.startsWith('color=')) {
      const color = decodeURI(href.slice(6).replace(/_/g, ' '))
      node.properties = {
        style: `color: ${color} !important;`
      }
      node.tagName = 'span'
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
        "py-0.5 rounded transition duration-200": true,
        "!cursor-pointer !select-none all:!text-transparent all:!bg-gray-900": !revealed(),
        "text-base-content bg-gray-600/50": revealed(),
      }}
      onClick={() => setRevealed(true)}
    />
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
  code: (props) => <code class="bg-gray-900 rounded px-1 py-0.5" {...props} />,
  // TODO: syntax highlighting
  pre: (props) => <pre class="bg-gray-900 rounded px-2 py-1 my-1" {...props} />,
  ul: (props) => <ul class="list-disc ml-4" {...props} />,
  ol: (props) => <ol class="list-decimal ml-4" {...props} />,
  spoiler: Spoiler,
  highlight: (props) => <span class="bg-highlight text-highlight-content rounded py-0.5" {...props} />,
}

export const render = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRegexp(/\|\|([^|]+)\|\|/, 'spoiler'))
  .use(remarkRegexp(/!!([^!]+)!!/, 'highlight'))
  .use(flattenHtml)
  .use(remarkRehype)
  .use(underline)
  .use(textStyle)

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
  if (root.type !== "root")
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
