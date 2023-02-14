import {Guild} from "../../types/guild";
import Layout from "../Layout";
import StatusIndicator from "../../components/StatusIndicator";
import {For, Show} from "solid-js";
import {Card, SidebarButton} from "../Home";
import {useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
import type {GuildChannel} from "../../types/channel";
import NotFound from "../NotFound";

export function GuildSidebar() {
  const { guildId, channelId: channelIdString } = useParams()
  const channelId = parseInt(channelIdString)

  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(guildId))
  if (!guild) return

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="card m-2 p-3 border border-2 border-base-content/10">
        {guild.icon && <figure><img src={guild.icon} alt="" /></figure>}
        <div class="font-title card-title">{guild.name}</div>
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId}`} svg="/icons/home.svg" active={!channelId}>Home</SidebarButton>
        <For each={guild.channels}>
          {(channel: GuildChannel) => (
            <SidebarButton
              href={`/guilds/${guildId}/${channel.id}`}
              svg="/icons/hashtag.svg"
              active={channelId === channel.id}
            >
              {channel.name}
            </SidebarButton>
          )}
        </For>
      </div>
    </div>
  )
}

export default function GuildHome() {
  const { guildId } = useParams<{ guildId: string }>()
  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(guildId))

  if (!guild) return <NotFound sidebar={GuildSidebar} />

  return (
    <Layout sidebar={GuildSidebar} title={guild.name}>
      <div class="flex flex-col items-center w-full h-full p-8 mobile-xs:p-4 xl:p-12 2xl:p-16 overflow-auto">
        <div class="flex items-center mobile:justify-center px-8 bg-gray-900 rounded-xl py-12 w-full mobile:flex-col">
          <Show when={guild.icon} keyed={false}>
            <img src={guild.icon} alt="" class="w-24 rounded-lg mr-4"/>
          </Show>
          <div class="flex flex-col mobile:items-center">
            <h1 class="text-4xl mobile:text-3xl text-center font-title font-bold">
              Welcome to {' '}
              <span
                class="bg-gradient-to-r bg-clip-text overflow-ellipsis text-transparent from-accent to-secondary">
                {guild.name}
              </span>!
            </h1>
          </div>
        </div>
        <div class="flex items-center justify-center mt-4 gap-4 w-full mobile:flex-col">
          <Card title="Popular Channels">
            <div class="w-full h-full flex items-center justify-center">
              <p class="text-center">This card is a <b>Work in Progress.</b></p> {/* TODO */}
            </div>
          </Card>
          <Card title="Recent Activity">
            <div class="w-full h-full flex items-center justify-center">
              <p class="text-center">This card is a <b>Work in Progress.</b></p> {/* TODO */}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
