import type {ClientUser, User} from "../types/user";
import type {Guild, Member} from "../types/guild";
import type {ReadyEvent} from "../types/ws";
import type {Message} from "../types/message";
import {createSignal, type Signal} from "solid-js";

/**
 * Options when updating guild cache.
 */
export interface UpdateGuildOptions {
  updateUsers?: boolean
}

/**
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUser?: ClientUser
  users: Map<number, User>
  guilds: Map<number, Guild>
  messages: Map<number, Signal<Message[]>>

  constructor() {
    this.users = new Map()
    this.guilds = new Map()
    this.messages = new Map()
  }

  static fromReadyEvent(ready: ReadyEvent): ApiCache {
    let cache = new ApiCache()
    cache.clientUser = ready.user
    for (const guild of ready.guilds)
      cache.updateGuild(guild, { updateUsers: true })

    cache.updateUser(ready.user)
    return cache
  }

  updateGuild(guild: Guild, { updateUsers }: UpdateGuildOptions = {}) {
    this.guilds.set(guild.id, guild)

    if (updateUsers && guild.members)
      for (const member of guild.members)
        this.updateUser(member as User)
  }

  updateUser(user: User) {
    this.users.set(user.id, user)
  }

  get clientAvatar(): string | undefined {
    return this.clientUser && (this.clientUser.avatar ?? defaultAvatar(this.clientUser.id))
  }

  avatarOf(userId: number): string | undefined {
    return this.users.get(userId)?.avatar ?? defaultAvatar(userId)
  }

  useMessageSignal(channelId: number): Signal<Message[]> {
    let store = this.messages.get(channelId)
    if (!store) {
      store = createSignal([])
      this.messages.set(channelId, store)
    }
    return store
  }
}

function defaultAvatar(userId: number): string {
  return `https://convey.adapt.chat/avatars/${userId}/default.png?theme=dark&width=96`
}
