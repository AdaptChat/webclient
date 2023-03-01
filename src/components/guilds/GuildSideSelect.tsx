import {getApi} from "../../api/Api";
import {For, onMount, Show} from "solid-js";
import {A} from "@solidjs/router";
import {Guild} from "../../types/guild";
import GuildIcon from "./GuildIcon";
import useNewGuildModalComponent from "./NewGuildModal";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

const Separator = () => <hr class="h-1 bg-gray-800 border-none rounded-full my-2" />

function BasicButton({ icon, alt, href }: { icon: string, alt: string, href: string }) {
  let anchor: HTMLAnchorElement | null = null
  onMount(() => {
    tooltip(anchor!, () => ({ content: alt, placement: 'right' }))
  })

  return (
    <A
      ref={anchor!}
      href={href}
      class="opacity-70 hover:opacity-100 transition-opacity duration-300"
    >
      <img src={icon} alt={alt} class="invert select-none w-5" width={20} />
    </A>
  )
}

export default function GuildSideSelect() {
  const api = getApi()!
  const { NewGuildModal, setShow: setShowNewGuildModal } = useNewGuildModalComponent()

  return (
    <div class="flex flex-col justify-between bg-gray-900 mobile:hidden">
      <div class="h-[calc(100%-1.25rem)] overflow-y-auto hide-scrollbar">
        <div class="flex flex-col p-2 gap-y-2 min-h-full">
          <NewGuildModal />
          <div class="flex flex-col px-3 pt-3">
            <BasicButton icon="/icons/home.svg" alt="Home" href="/" />
          </div>
          <Separator />
          <For each={Array.from(api.cache!.guildList.map(g => api.cache!.guilds.get(g)!))}>
            {(guild: Guild) => (
              <A href={`/guilds/${guild.id}`}>
                <GuildIcon guild={guild} unread={false} pings={0} sizeClass="w-12 h-12" tooltip />
              </A>
            )}
          </For>
          <Show when={api.cache!.guildList.length > 0} keyed={false}>
            <Separator />
          </Show>
          <button
            use:tooltip={{ content: "New Server", placement: 'right' }}
            class="flex group items-center justify-center bg-neutral-focus hover:bg-accent rounded-[50%]
              hover:rounded-[25%] transition-all duration-300 w-12 h-12"
            onClick={() => setShowNewGuildModal(true)}
          >
            <img
              src="/icons/plus.svg"
              alt="New Server"
              class="filter-accent-300 group-hover:invert select-none w-5 h-5"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center pb-3 pt-2 w-full relative">
        <div
          class="absolute left-0 right-0 bottom-full w-full flex-grow bg-gradient-to-t from-gray-900 to-transparent h-5
            pointer-events-none"
        />
        <BasicButton icon="/icons/gear.svg" alt="Settings" href="/settings"/>
      </div>
    </div>
  )
}