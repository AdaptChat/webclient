import {getApi} from "../api/Api";
import {For} from "solid-js";
import type {Guild} from "../types/guild";
import Layout, {GuildIcon} from "./Layout";
import {A} from "@solidjs/router";

export default function GuildSelect() {
  const api = getApi()!

  return (
    <Layout showBottomNav>
      {/* TODO: Make this into a tab to select between guilds and DM channels */}
      <h1 class="font-title font-bold text-2xl p-3 mt-2">Servers</h1>
      <For each={Array.from(api.cache!.guilds.values())}>
        {(guild: Guild) => (
          <A href={`/guilds/${guild.id}`} class="hover:bg-gray-700 transition w-full p-3 flex items-center cursor-pointer">
            <GuildIcon guild={guild} unread={false} pings={0} sizeClass="w-14 h-14" />
            <span class="ml-4 font-medium text-lg">{guild.name}</span>
          </A>
        )}
      </For>
    </Layout>
  )
}
