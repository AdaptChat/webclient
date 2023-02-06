import {For, onMount, ParentProps, Show} from "solid-js";
import {getApi} from "../api/Api";
import type {Guild} from "../types/guild";
import tippy from "tippy.js"
import {A, useLocation, useNavigate} from "@solidjs/router";

interface GuildIconProps {
  guild: Guild,
  unread: boolean,
  pings: number,
  sizeClass: string,
  tooltip?: boolean,
}

export function GuildIcon({ guild, unread, pings, sizeClass, tooltip }: GuildIconProps) {
  const mx = pings.toString().length * 0.25 + 'rem'
  const indicator =
    pings > 0 ? (
      <span
        class="indicator-item indicator-bottom badge badge-error px-1 py-2 min-w-4 h-4 my-1"
        style={{
          'margin-left': mx,
          'margin-right': mx,
        }}
      >
        {pings}
      </span>
    )
    : unread ? <span class="indicator-item indicator-bottom badge badge-sm badge-accent m-1" />
    : null

  let baseClass = "avatar indicator group";
  if (tooltip) baseClass += " cursor-pointer"

  let anchor: HTMLDivElement | null = null

  onMount(() => {
    if (tooltip) tippy(anchor!, {
      content: guild.name,
      placement: 'right',
      arrow: true,
      animation: 'shift-away',
    })
  })

  return (
    <Show when={guild.icon} fallback={
      <div class={"placeholder " + baseClass} ref={anchor!}>
        {indicator}
        <div class={"relative bg-neutral-focus text-neutral-content rounded-[50%] group-hover:rounded-[25%] transition-all " + sizeClass}>
          <span class="rounded-[inherit]">{guild.name.split(/ +/).map(word => word[0] ?? '').join('')}</span>
        </div>
      </div>
    } keyed={false}>
      <div class={baseClass} ref={anchor!}>
        {indicator}
        <div class={"rounded-full hover:rounded-lg " + sizeClass}>
          <img src={guild.icon} alt=""/>
        </div>
      </div>
    </Show>
  )
}

function BottomNav({ href, icon, alt }: { href: string, icon: string, alt: string }) {
  const route = useLocation()
  const navigate = useNavigate()
  let anchor: HTMLAnchorElement | null = null

  onMount(() => {
    tippy(anchor!, {
      content: alt,
      placement: 'top',
      arrow: true,
      animation: 'shift-away',
    })
  })

  return (
    <a
      class={`bg-gray-900 hover:bg-gray-700 transition text-base-content/30 ${route.pathname === href ? 'active' : ''}`}
      onClick={() => navigate(href)}
      ref={anchor!}
    >
      <img src={icon} alt={alt} class="invert select-none w-5" />
    </a>
  )
}

export default function Layout(props: ParentProps) {
  const api = getApi()!

  return (
    <div class="w-full h-full overflow-hidden">
      <div class="flex flex-grow w-full h-full mobile:h-[calc(100%-4rem)]">
        <div class="flex flex-col p-2 pr-3 bg-gray-900 h-full overflow-y-auto gap-y-2 hide-scrollbar mobile:hidden">
          <A href="/" class="opacity-70 hover:opacity-100 transition-opacity duration-300 w-full px-3 pt-3 flex items-center">
            <img src="/icons/home.svg" alt="Home" class="invert select-none w-5" />
          </A>
          <hr class="h-1 bg-gray-800 border-none rounded-full my-2" />
          <For each={Array.from(api.cache!.guilds.values())}>
            {(guild: Guild) => (
              <A href={`/guilds/${guild.id}`}>
                <GuildIcon guild={guild} unread={false} pings={0} sizeClass="w-12 h-12" tooltip />
              </A>
            )}
          </For>
        </div>
        <div class="flex flex-col items-center w-full">
          {props.children}
        </div>
      </div>
      <div class="btm-nav md:hidden">
        <BottomNav href="/" icon="/icons/home.svg" alt="Home" />
        <BottomNav href="/select" icon="/icons/server.svg" alt="Servers" />
      </div>
    </div>
  )
}
