interface _BitflagsMapping<Flags> {
  flags: Flags
  of(...flags: (keyof Flags)[]): _BitflagsValue<Flags>
  fromFlags(flags: { [key in keyof Flags]?: boolean }): _BitflagsValue<Flags>
  fromValue(value: number | bigint): _BitflagsValue<Flags>
  empty(): _BitflagsValue<Flags>
  all(): _BitflagsValue<Flags>
}

interface _BitflagsValue<Flags> {
  value: bigint
  has(flag: keyof Flags): boolean
  add(...targets: (keyof Flags)[]): this
  remove(...targets: (keyof Flags)[]): this
  toggle(...targets: (keyof Flags)[]): this
  update(newFlags: { [key in keyof Flags]?: boolean }): this
  clear(): this
  get isEmpty(): boolean
  toFlags(): { [key in keyof Flags]: boolean }
}

/**
 * Represents flags represented as booleans.
 */
export function generateBitflags<
  RawFlags extends { [key: string]: number | bigint | ((flags: { [key: string]: bigint }) => number | bigint) },
  Flags extends RawFlags & { [key: string]: bigint },
>(rawFlags: RawFlags): _BitflagsMapping<Flags> {
  const flags: Flags = {} as any
  for (const [key, value] of Object.entries(rawFlags)) {
    flags[key as keyof Flags] = BigInt(typeof value === "function" ? value(flags) : value) as any
  }

  class _BitflagsGeneratedBase {
    static readonly flags = flags
    value: bigint

    private constructor(value: number | bigint = 0) {
      this.value = BigInt(value)
    }

    static of(...flags: (keyof Flags)[]) {
      return new this(flags.reduce((acc, flag) => acc | this.flags[flag], 0n))
    }

    static fromFlags(flags: { [key in keyof Flags]?: boolean }) {
      const value = Object.entries(flags).reduce((acc, [key, value]) => {
        if (value) acc |= this.flags[key]
        return acc
      }, 0n)
      return new this(value)
    }

    static fromValue(value: number | bigint) {
      return new this(BigInt(value))
    }

    static empty() {
      return new this()
    }

    static all() {
      return new this(Object.values(flags).reduce((acc, value) => acc | value, 0n))
    }

    has(flag: keyof Flags) {
      return (this.value & flags[flag]) === flags[flag]
    }

    add(...targets: (keyof Flags)[]) {
      for (const flag of targets) this.value |= flags[flag]
      return this
    }

    remove(...targets: (keyof Flags)[]) {
      for (const flag of targets) this.value &= ~flags[flag] as unknown as bigint
      return this
    }

    toggle(...targets: (keyof Flags)[]) {
      for (const flag of targets) this.value ^= flags[flag]
      return this
    }

    update(newFlags: { [key in keyof Flags]?: boolean }) {
      for (const [key, value] of Object.entries(newFlags)) {
        if (value) this.add(key as keyof Flags)
        else this.remove(key as keyof Flags)
      }
      return this
    }

    clear() {
      this.value = 0n
      return this
    }

    get isEmpty() {
      return this.value === 0n
    }

    toFlags(): { [key in keyof Flags]: boolean } {
      return Object.fromEntries(Object.keys(flags).map((key) => [key, this.has(key)])) as any
    }
  }
  return _BitflagsGeneratedBase
}

type _Extract<T> = T extends _BitflagsMapping<infer U> ? _BitflagsValue<U> : never

export const Devices = generateBitflags({
  DESKTOP: 1 << 0,
  MOBILE: 1 << 1,
  WEB: 1 << 2,
})
export type Devices = _Extract<typeof Devices>

export const PrivacyConfiguration = generateBitflags({
  FRIENDS: 1 << 0,
  MUTUAL_FRIENDS: 1 << 1,
  GUILD_MEMBERS: 1 << 2,
  EVERYONE: 1 << 3,
  // Aliases
  DEFAULT_DM_PRIVACY: flags => flags.FRIENDS | flags.MUTUAL_FRIENDS | flags.GUILD_MEMBERS,
  DEFAULT_GROUP_DM_PRIVACY: flags => flags.FRIENDS,
  DEFAULT_FRIEND_REQUEST_PRIVACY: flags => flags.EVERYONE,
})
export type PrivacyConfiguration = _Extract<typeof PrivacyConfiguration>

export const UserFlags = generateBitflags({
  BOT: 1 << 0,
})
export type UserFlags = _Extract<typeof UserFlags>

export const RoleFlags = generateBitflags({
  HOISTED: 1 << 0,
  MANAGED: 1 << 1,
  MENTIONABLE: 1 << 2,
  DEFAULT: 1 << 3,
})
export type RoleFlags = _Extract<typeof RoleFlags>

export const MessageFlags = generateBitflags({
  PINNED: 1 << 0,
  SYSTEM: 1 << 1,
  CROSSPOST: 1 << 2,
  PUBLISHED: 1 << 3,
})
export type MessageFlags = _Extract<typeof MessageFlags>

export const GuildFlags = generateBitflags({
  PUBLIC: 1 << 0,
  VERIFIED: 1 << 1,
  VANIITY_URL: 1 << 2,
})
export type GuildFlags = _Extract<typeof GuildFlags>

export const Permissions = generateBitflags({
  VIEW_CHANNEL: 1 << 0,
  VIEW_MESSAGE_HISTORY: 1 << 1,
  SEND_MESSAGES: 1 << 2,
  MANAGE_MESSAGES: 1 << 3,
  ATTACH_FILES: 1 << 4,
  SEND_EMBEDS: 1 << 5,
  ADD_REACTIONS: 1 << 6,
  PIN_MESSAGES: 1 << 7,
  STAR_MESSAGES: 1 << 8,
  PUBLISH_MESSAGES: 1 << 9,
  MODIFY_CHANNELS: 1 << 10,
  MANAGE_CHANNELS: 1 << 11,
  MANAGE_WEBHOOKS: 1 << 12,
  MANAGE_EMOJIS: 1 << 13,
  MANAGE_STARBOARD: 1 << 14,
  MANAGE_GUILD: 1 << 15,
  MANAGE_ROLES: 1 << 16,
  CREATE_INVITES: 1 << 17,
  MANAGE_INVITES: 1 << 18,
  USE_EXTERNAL_EMOJIS: 1 << 19,
  CHANGE_NICKNAME: 1 << 20,
  MANAGE_NICKNAMES: 1 << 21,
  TIMEOUT_MEMBERS: 1 << 22,
  KICK_MEMBERS: 1 << 23,
  BAN_MEMBERS: 1 << 24,
  BULK_DELETE_MESSAGES: 1 << 25,
  VIEW_AUDIT_LOG: 1 << 26,
  PRIVILEGED_MENTIONS: 1 << 27,
  CONNECT: 1 << 28,
  SPEAK: 1 << 29,
  MUTE_MEMBERS: 1 << 30,
  DEAFEN_MEMBERS: 1n << 31n,
  ADMINISTRATOR: 1n << 32n,
  // Aliases
  DEFAULT: (flags) =>
    flags.VIEW_CHANNEL
    | flags.VIEW_MESSAGE_HISTORY
    | flags.SEND_MESSAGES
    | flags.ADD_REACTIONS
    | flags.STAR_MESSAGES
    | flags.ATTACH_FILES
    | flags.SEND_EMBEDS
    | flags.CREATE_INVITES
    | flags.USE_EXTERNAL_EMOJIS
    | flags.CHANGE_NICKNAME
    | flags.CONNECT
    | flags.SPEAK,
})
export type Permissions = _Extract<typeof Permissions>
