import Layout from "../Layout";
import {Show} from "solid-js";
import {Card,} from "../Home";
import {useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
import NotFound from "../NotFound";
import GuildSidebar from "../../components/guilds/GuildSidebar";

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
