import {Plugin, unified} from "unified";
import {visit} from "unist-util-visit";

import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import {Root as HtmlRoot} from "rehype-stringify/lib";
import {Root as MdRoot} from "remark-parse/lib";

import {JSX} from "solid-js";
import {Member} from "../../types/guild";
import {getApi} from "../../api/Api";
import {snowflakes} from "../../utils";
import {GuildCreateEvent} from "../../types/ws";
import {Navigator, useNavigate} from "@solidjs/router";
import {VFile} from "vfile";
import {childrenToSolid} from "./markdown/ast-to-solid";
import {html} from "property-information";

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

function anchorElement(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
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
      class="text-link underline hover:text-link-hover visited:text-link-visited transition"
      target="_blank"
      rel="noreferrer"
      onClick={handler}
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
  a: anchorElement,
  span: (props) =>  <span {...props} />,
}

export const render = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
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
