import Icon from "../../components/icons/Icon";
import Users from "../../components/icons/svg/Users";
import UserTie from "../../components/icons/svg/UserTie";
import ChevronLeft from "../../components/icons/svg/ChevronLeft";
import Plus from "../../components/icons/svg/Plus";
import UserPlus from "../../components/icons/svg/UserPlus";
import {Navigator, useNavigate, useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
import {createEffect, createSignal, onMount, Show} from "solid-js";
import type {Invite} from "../../types/guild";
import type {User as UserObject} from "../../types/user";
import GuildIcon from "../../components/guilds/GuildIcon";
import {snowflakes} from "../../utils";
import {GuildCreateEvent} from "../../types/ws";
import {Member} from "../../types/guild";
import Header from "../../components/ui/Header";

const Fallback = () => (
  <p class="text-fg/50 animate-pulse text-2xl font-bold font-title">Loading...</p>
)

export const INVITE_REGEX = /(?:(?:https?:\/\/(?:www\.)?)?adapt\.chat\/invite\/)?(\w{6,12})\/?/;

export async function joinGuild(code: string, navigate: Navigator) {
  const api = getApi()!

  let acked = false
  let ack = (guildId: bigint) => {
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

  const matches = code.match(INVITE_REGEX)
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

export default function InviteScreen() {
  const code = useParams().code
  const navigate = useNavigate()

  const api = getApi()!
  const [invite, setInvite] = createSignal<Invite>()
  const [owner, setOwner] = createSignal<UserObject>()

  let backgroundRef: HTMLDivElement | null = null

  onMount(async () => {
    let invite: Invite = api.cache!.invites.get(code)!
    if (!invite) {
      const response = await api.request('GET', `/invites/${code}`)
      if (response.status === 404) {
        navigate('/404', { replace: true })
        return
      }
      invite = response.jsonOrThrow()
    }
    if (api.cache?.guildList.includes(invite.guild_id)) {
      // navigate(`/guilds/${invite.guild_id}`, { replace: true })
      // return
    }

    setInvite(invite)
    let banner = invite.guild?.banner;
    if (banner != null)
      backgroundRef!.style.backgroundImage = `url(${banner})` // TODO: this should be the splash image
  })

  createEffect(async () => {
    if (invite() == null) return
    const owner = invite()!.guild!.owner_id

    // is the owner in cache?
    const user = api.cache!.users.get(owner)
    if (user != null) return setOwner(user)

    // fetch the owner
    const response = await api.request('GET', `/users/${owner}`)
    if (response.status === 404) return
    setOwner(response.jsonOrThrow())
  })

  return (
    <div class="w-full h-full p-2">
      <div class="flex items-center justify-center w-full h-full bg-cover rounded-xl" ref={backgroundRef!}>
        <Header>{invite() ? `Accept server invite?` : 'Resolving invite...'}</Header>
        <Show when={invite()} fallback={<Fallback />}>
          <div
            class="flex flex-col bg-bg-0/80 px-8 rounded-xl w-[clamp(512px,70%,768px)]
              mobile:w-[90%] backdrop-blur"
          >
            <p class="py-6 flex items-center justify-center text-sm text-fg/40 font-title font-bold">
              <Icon icon={UserPlus} class="w-5 h-5 mr-2 fill-fg/40" />
              <span>You've been invited to join a server!</span>
            </p>
            <div class="flex items-center">
              <GuildIcon guild={invite()!.guild!} pings={0} unread={false} sizeClass="w-24 h-24 text-2xl" />
              <div class="ml-4">
                <h1 class="font-title font-bold text-4xl mobile:text-2xl mb-1">{invite()!.guild!.name}</h1>
                <p class="flex items-center gap-x-1 text-fg/50 text-sm">
                  <Icon icon={Users} class="w-4 h-4 fill-fg/50" />
                  <span class="mr-2">{invite()!.guild!.member_count!.total.toLocaleString()}</span>
                  {/* TODO: Online users */}
                  <Show when={owner()} keyed={false}>
                    <Icon icon={UserTie} class="w-4 h-4 fill-fg/50" />
                    <span>@{owner()!.username}</span>
                  </Show>
                </p>
                <p class="text-fg/30">{invite()!.guild!.description}</p>
              </div>
            </div>
            <div class="flex gap-x-2 mt-6 mb-8">
              <button class="btn btn-accent flex-grow" onClick={() => joinGuild(code, navigate)}>
                <Icon icon={Plus} class="w-4 h-4 mr-2 fill-fg" />
                <span>Join {invite()!.guild!.name}</span>
              </button>
              <button class="btn" onClick={() => navigate(-1)}>
                <Icon icon={ChevronLeft} class="w-4 h-4 mr-2 fill-fg" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
