import {getApi} from "../../api/Api";
import {For} from "solid-js";
import type {Guild} from "../../types/guild";
import Layout from "../Layout";
import {A} from "@solidjs/router";
import GuildIcon from "../../components/guilds/GuildIcon";
import useNewGuildModalComponent from "../../components/guilds/NewGuildModal";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export default function GuildSelect() {
  const api = getApi()!
  const { NewGuildModal, setShow: setShowNewGuildModal } = useNewGuildModalComponent()

  return (
    <Layout showBottomNav>
      <NewGuildModal />
      <div class="flex flex-col w-full h-full">
        {/* TODO: Make this into a tab to select between guilds and DM channels */}
        <h1 class="font-title font-bold text-center text-2xl p-3 mt-2">Servers</h1>
        <div class="flex flex-col overflow-y-auto w-full">
          <For each={api.cache!.guildList.map(g => api.cache!.guilds.get(g)!)}>
          {(guild: Guild) => (
            <A href={`/guilds/${guild.id}`} class="hover:bg-gray-700 transition w-full p-3 flex items-center cursor-pointer">
              <GuildIcon guild={guild} unread={false} pings={0} sizeClass="w-14 h-14" />
              <span class="ml-4 font-medium text-lg">{guild.name}</span>
            </A>
          )}
          </For>
        </div>
        <button
          class="absolute top-4 right-4 flex group items-center justify-center bg-gray-700 border-4
            border-gray-800 hover:bg-accent rounded-[50%] hover:rounded-[25%] transition-all duration-300 w-12 h-12"
          onClick={() => setShowNewGuildModal(true)}
          use:tooltip={{ content: "New Server", placement: 'left' }}
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
