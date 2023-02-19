import {getApi} from "../../api/Api";
import {For, onMount, Show} from "solid-js";
import tippy from "tippy.js";
import {A} from "@solidjs/router";
import {Guild} from "../../types/guild";
import GuildIcon from "./GuildIcon";
import {tippyBaseOptions} from "../../pages/Layout";
import useNewGuildModalComponent from "./NewGuildModal";

const Separator = () => <hr class="h-1 bg-gray-800 border-none rounded-full my-2" />

export default function GuildSideSelect() {
  const api = getApi()!
  let newServerAnchor: HTMLButtonElement | null = null

  onMount(() => {
    tippy(newServerAnchor!, { content: 'New Server', ...tippyBaseOptions });
  })

  const { NewGuildModal, setShow: setShowNewGuildModal } = useNewGuildModalComponent()

  return (
    <div class="overflow-y-auto hide-scrollbar mobile:hidden">
      <div class="flex flex-col p-2 bg-gray-900 gap-y-2 min-h-full">
        <NewGuildModal />
        <A href="/"
           class="opacity-70 hover:opacity-100 transition-opacity duration-300 w-full px-3 pt-3 flex items-center">
          <img src="/icons/home.svg" alt="Home" class="invert select-none w-5"/>
        </A>
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
          ref={newServerAnchor!}
          class="flex group items-center justify-center bg-neutral-focus hover:bg-accent rounded-[50%] hover:rounded-[25%] transition-all duration-300 w-12 h-12"
          onClick={() => setShowNewGuildModal(true)}
        >
          <img
            src="/icons/plus.svg"
            alt="Home"
            class="filter-accent-300 group-hover:invert select-none w-5 h-5"
            width={20}
            height={20}
          />
        </button>
      </div>
    </div>
  )
}