import type {ClientUser, User} from "../types/user";
import type {Guild, Member} from "../types/guild";
import type {ReadyEvent} from "../types/ws";
import {Channel} from "../types/channel";
import MessageGrouper from "./MessageGrouper";
import type Api from "./Api";

/**
 * Options when updating guild cache.
 */
export interface UpdateGuildOptions {
  updateUsers?: boolean
  updateChannels?: boolean
}

/**
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUser?: ClientUser
  users: Map<number, User>
  guilds: Map<number, Guild>
  channels: Map<number, Channel>
  messages: Map<number, MessageGrouper>

  constructor(private readonly api: Api) {
    this.users = new Map()
    this.guilds = new Map()
    this.channels = new Map()
    this.messages = new Map()
  }

  static fromReadyEvent(api: Api, ready: ReadyEvent): ApiCache {
    let cache = new ApiCache(api)
    cache.clientUser = ready.user
    for (const guild of ready.guilds)
      cache.updateGuild(guild, { updateUsers: true, updateChannels: true })

    cache.updateUser(ready.user)
    return cache
  }

  updateGuild(guild: Guild, options: UpdateGuildOptions = {}) {
    this.guilds.set(guild.id, guild)

    if (options.updateUsers && guild.members)
      for (const member of guild.members)
        this.updateUser(member as User)

    if (options.updateChannels && guild.channels)
      for (const channel of guild.channels)
        this.updateChannel(channel)
  }

  updateUser(user: User) {
    this.users.set(user.id, user)
  }

  updateChannel(channel: Channel) {
    this.channels.set(channel.id, channel)
  }

  get clientAvatar(): string | undefined {
    return this.clientUser && (this.clientUser.avatar ?? defaultAvatar(this.clientUser.id))
  }

  avatarOf(userId: number): string | undefined {
    return this.users.get(userId)?.avatar ?? defaultAvatar(userId)
  }

  useChannelMessages(channelId: number): { grouper: MessageGrouper, cached: boolean } {
    let grouper = this.messages.get(channelId)
    const cached = !!grouper

    if (!grouper) this.messages.set(channelId, grouper = new MessageGrouper(this.api, channelId))
    return { grouper, cached }
  }
}

function defaultAvatar(userId: number): string {
  return `https://convey.adapt.chat/avatars/${userId}/default.png?theme=dark&width=96`
}
