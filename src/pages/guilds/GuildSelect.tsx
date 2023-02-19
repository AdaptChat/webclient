import {getApi} from "../../api/Api";
import {For, onMount} from "solid-js";
import type {Guild} from "../../types/guild";
import Layout, {tippyBaseOptions} from "../Layout";
import {A} from "@solidjs/router";
import GuildIcon from "../../components/guilds/GuildIcon";
import tippy from "tippy.js";
import useNewGuildModalComponent from "../../components/guilds/NewGuildModal";

export default function GuildSelect() {
  const api = getApi()!
  let newServerAnchor: HTMLButtonElement | null = null

  onMount(() => {
    tippy(newServerAnchor!, { content: 'New Server', ...tippyBaseOptions, placement: 'left' });
  })

  const { NewGuildModal, setShow: setShowNewGuildModal } = useNewGuildModalComponent()

  return (
    <Layout showBottomNav>
      <NewGuildModal />
      <div class="flex flex-col w-full h-full relative">
        {/* TODO: Make this into a tab to select between guilds and DM channels */}
        <h1 class="font-title font-bold text-center text-2xl p-3 mt-2">Servers</h1>
        <div class="flex flex-col overflow-y-auto w-full">
          <For each={Array.from(api.cache!.guilds.values())}>
          {(guild: Guild) => (
            <A href={`/guilds/${guild.id}`} class="hover:bg-gray-700 transition w-full p-3 flex items-center cursor-pointer">
              <GuildIcon guild={guild} unread={false} pings={0} sizeClass="w-14 h-14" />
              <span class="ml-4 font-medium text-lg">{guild.name}</span>
            </A>
          )}
          </For>
        </div>
        <button
          ref={newServerAnchor!}
          class="absolute bottom-4 right-4 flex group items-center justify-center bg-gray-700 border border-4
            border-gray-800 hover:bg-accent rounded-[50%] hover:rounded-[25%] transition-all duration-300 w-12 h-12"
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
    </Layout>
  )
}
