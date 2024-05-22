import {Guild, Member, Role} from "./types/guild";
import {Channel, PermissionOverwrite} from "./types/channel";
import {Permissions} from "./api/Bitflags";
import {User} from "./types/user";
import {getApi} from "./api/Api";

/**
 * Utilities related to snowflakes.
 */
export namespace snowflakes {
  /**
   * The Adapt epoch in milliseconds.
   * @link https://github.com/AdaptChat/essence/blob/main/src/snowflake.rs#L29
   */
  export const EPOCH_MILLIS = 1_671_926_400_000

  /**
   * Returns the timestamp of a snowflake in milliseconds.
   */
  export function timestampMillis(snowflake: number | bigint): number {
    if (typeof snowflake !== "bigint")
      snowflake = BigInt(snowflake)

    return Number(snowflake >> 18n) + EPOCH_MILLIS
  }

  /**
   * Returns the timestamp of a snowflake as a Date.
   */
  export function timestamp(snowflake: Snowflake): Date {
    return new Date(timestampMillis(snowflake))
  }

  /**
   * Generates a snowflake from a Unix timestamp or Date in milliseconds.
   */
  export function fromTimestamp(timestamp?: number | Date): bigint {
    timestamp ??= Date.now()
    if (timestamp instanceof Date)
      timestamp = timestamp.getTime()

    return BigInt(timestamp - EPOCH_MILLIS) << 18n
  }

  /**
   * The model type stored in a snowflake.
   */
  export enum ModelType {
    // The model is a guild.
    Guild = 0,
    // The model is a user account.
    User = 1,
    // The model is a channel.
    Channel = 2,
    // The model is a message.
    Message = 3,
    // The model is a message attachment.
    Attachment = 4,
    // The model is a role.
    Role = 5,
    // The model is used internally, e.g. a nonce.
    Internal = 6,
    // Unknown model.
    Unknown = 31,
  }

  /**
   * Returns the model type of a snowflake.
   */
  export function modelType(snowflake: number | bigint): ModelType {
    if (typeof snowflake !== "bigint")
      snowflake = BigInt(snowflake)

    return Number((snowflake >> 13n) & 0b11111n)
  }

  /**
   * Returns the snowflake replaced with the given model type.
   */
  export function withModelType(snowflake: number | bigint, modelType: ModelType): bigint {
    if (typeof snowflake !== "bigint")
      snowflake = BigInt(snowflake)

    return (snowflake & ~(0b11111n << 13n)) | (BigInt(modelType) << 13n)
  }
}

/**
 * Calculates the permissions after applying all role permissions and channel overwrites.
 * This assumes `roles` is sorted by position.
 *
 * This does not account for guild owners (they should have all permissions), this should be
 * handled separately.
 */
export function calculatePermissions(userId: bigint, roles: Role[], overwrites?: PermissionOverwrite[]): Permissions {
  let perms = roles.reduce((acc, role) => acc | BigInt(role.permissions.allow), 0n)
    & ~roles.reduce((acc, role) => acc | BigInt(role.permissions.deny), 0n)

  if (Permissions.fromValue(perms).has('ADMINISTRATOR'))
    return Permissions.of('ADMINISTRATOR')

  if (overwrites != null) {
    const roleOverwrites = overwrites
      .map((overwrite) => [overwrite, roles.find((role) => role.id === overwrite.id)] as const)
      .filter(([_, role]) => role != null)
      .map(([overwrite, role]) => [overwrite, role!.position] as const)
      .sort((a, b) => a[1] - b[1])

    for (const [{ allow, deny }] of roleOverwrites) {
      perms |= BigInt(allow)
      perms &= ~BigInt(deny)
    }

    const memberOverwrite = overwrites.find((overwrite) => overwrite.id === userId)
    if (memberOverwrite != null) {
      perms |= BigInt(memberOverwrite.allow)
      perms &= ~BigInt(memberOverwrite.deny)
    }
  }

  return Permissions.fromValue(perms)
}

/**
 * Returns whether two dates fall on the same day.
 */
export function isSameDay(date: Date, now: Date): boolean {
  return date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear()
}

/**
 * Returns the day of the given date, ignoring the time.
 */
export function day(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Humanizes a timestamp.
 */
// TODO: Support for customizable locales
export function humanizeTimestamp(timestamp: number | Date): string {
  if (typeof timestamp === 'number')
    timestamp = new Date(timestamp)

  const now = new Date()

  let prefix
  if (isSameDay(timestamp, now))
    return humanizeTime(timestamp)
  else if (isSameDay(timestamp, new Date(now.getTime() - 86_400_000)))
    prefix = 'Yesterday'
  else if (day(now).getTime() - day(timestamp).getTime() < 3 * 86_400_000)
    prefix = timestamp.toLocaleDateString('en-US', { weekday: 'long' })
  else if (timestamp.getFullYear() === now.getFullYear())
    prefix = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  else
    prefix = timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })

  return `${prefix} at ${humanizeTime(timestamp)}`
}

/**
 * Humanizes a full timestamp.
 */
export function humanizeFullTimestamp(timestamp: number | Date): string {
  if (typeof timestamp === 'number')
    timestamp = new Date(timestamp)

  return timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/**
 * Humanizes only the date of a timestamp.
 */
export function humanizeDate(timestamp: number | Date): string {
  if (typeof timestamp === 'number')
    timestamp = new Date(timestamp)

  return timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Humanizes only the time of a timestamp.
 */
export function humanizeTime(timestamp: number | Date): string {
  if (typeof timestamp === 'number')
    timestamp = new Date(timestamp)

  return timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export interface DeltaUnits {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
  plural: string
}

export const DEFAULT_DELTA_UNITS = {
  year: ' year',
  month: ' month',
  day: ' day',
  hour: ' hour',
  minute: ' minute',
  second: ' second',
  plural: 's',
}
export const SHORT_DELTA_UNITS = {
  year: 'y',
  month: 'mo',
  day: 'd',
  hour: 'h',
  minute: 'm',
  second: 's',
  plural: '',
}

/**
 * Humanizes elapsed time.
 */
export function humanizeTimeDelta(deltaMs: number, units: DeltaUnits = DEFAULT_DELTA_UNITS): string {
  const delta = Math.abs(deltaMs)
  const seconds = Math.floor(delta / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  let params
  if (years > 0)
    params = [years, units.year]
  else if (months > 0)
    params = [months, units.month]
  else if (days > 0)
    params = [days, units.day]
  else if (hours > 0)
    params = [hours, units.hour]
  else if (minutes > 0)
    params = [minutes, units.minute]
  else
    params = [seconds, units.second]

  if (params[0] !== 1)
    params[1] += units.plural

  return `${params[0]}${params[1]}`
}

export function humanizeTimeDeltaShort(deltaMs: number): string {
  return humanizeTimeDelta(deltaMs, SHORT_DELTA_UNITS)
}

/**
 * Capitalizes a string.
 * @param s The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Returns a humanized version of a status.
 */
export function humanizeStatus(status: string): string {
  switch (status) {
    case 'online': return 'Online'
    case 'idle': return 'Idle'
    case 'dnd': return 'Do Not Disturb'
    default: return 'Offline'
  }
}

/**
 * Returns a human-readable size.
 */
export function humanizeSize(bytes: number): string {
  if (bytes < 1000) {
    return bytes + ' B';
  }

  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;

  do {
    bytes /= 1000;
    ++u;
  } while (Math.round(Math.abs(bytes) * 100) / 100 >= 1000 && u < units.length - 1);

  return bytes.toFixed(2) + ' ' + units[u];
}

/**
 * Returns a humanized version of a mention count.
 * @param n The number of mentions.
 */
export function humanizePings(n: number): string {
  if (n < 1000) return n.toLocaleString()
  return Math.round(n / 100) / 10 + 'k'
}

/**
 * Does nothing with the given values. Useful for ignoring unused imports that you don't want TypeScript to remove.
 */
export function noop(..._values: unknown[]) {}

/**
 * Yields the items of an iterator that match a predicate.
 */
export function* filterIterator<T>(iterator: Iterable<T>, predicate: (item: T) => boolean): Generator<T> {
  for (const item of iterator)
    if (predicate(item))
      yield item
}

/**
 * Returns the first item that matches a predicate.
 */
export function findIterator<T>(
  iterator: Iterable<T> | undefined,
  predicate: (item: T) => boolean,
): T | undefined {
  if (!iterator)
    return
  for (const item of iterator)
    if (predicate(item))
      return item
}

/**
 * Maps an iterator.
 */
export function* mapIterator<T, U>(
  iterator: Iterable<T>,
  mapper: (item: T) => U,
): Generator<U> {
  for (const item of iterator)
    yield mapper(item)
}

/**
 * Filter-maps an iterator.
 */
export function* filterMapIterator<T, U>(
  iterator: Iterable<T>,
  mapper: (item: T) => U | null,
): Generator<U> {
  for (const item of iterator) {
    const mapped = mapper(item)
    if (mapped != null)
      yield mapped
  }
}

/**
 * Flat-maps an iterator.
 */
export function* flatMapIterator<T, U>(
  iterator: Iterable<T>,
  mapper: (item: T) => Iterable<U>,
): Generator<U> {
  for (const item of iterator)
    for (const mapped of mapper(item))
      yield mapped
}

/**
 * Returns the sum of an iterator.
 */
export function sumIterator<T extends number>(iterator: Iterable<T>): T {
  let sum = 0
  for (const item of iterator)
    sum += item
  return sum as T
}

export function maxIterator(iterator: Iterable<number>): number
export function maxIterator<T>(iterator: Iterable<T>, mapper: (item: T) => number): T

/**
 * Returns the maximum value in an iterator.
 */
export function maxIterator<T>(iterator: Iterable<T>, mapper?: (item: T) => number): T {
  let max = -Infinity
  for (const item of iterator)
    if (item > max)
      max = mapper ? mapper(item) : item as number
  return max as T
}

/**
 * Yields elements in the difference between two sets.
 */
export function* setDifference<T>(a: Set<T>, b: Set<T>): Generator<T> {
  for (const v of a)
    if (!b.has(v))
      yield v;
}

/**
 * If a string is provided, return that string. If a Uint8Array is provided, return a UUID representation of those bytes.
 *
 * @param id The ID to convert.
 * @returns The ID as a string.
 */
export function uuid(id: string | Uint8Array): string {
  if (typeof id === 'string')
    return id
  const base = [...id].map((b) => b.toString(16).padStart(2, '0'))
  base.splice(4, 0, '-')
  base.splice(7, 0, '-')
  base.splice(10, 0, '-')
  base.splice(13, 0, '-')
  return base.join('')
}

function userDisplayName(user: User): string {
  return user.display_name ?? user.username
}

/**
 * Return the proper display name of a member or user.
 *
 * @param member The member or user to get the display name of.
 * @returns The display name of the member or user.
 */
export function displayName(member: Member | User): string {
  return (member as Member).nick ?? userDisplayName(member as User)
}

export interface ChannelDisplayMetadata {
  channel: Channel
  user: User | null
  guild: Guild | null
  icon: string | null
}

/**
 * Returns display metadata about a channel.
 */
export function displayChannel(channel: Channel): ChannelDisplayMetadata {
  const cache = getApi()!.cache!
  const user = channel.type === 'dm'
    ? cache.users.get(channel.recipient_ids.find((id) => id !== cache.clientId)!)
    : null
  const guild = 'guild_id' in channel ? cache.guilds.get(channel.guild_id) : null
  const icon = 'icon' in channel ? channel.icon : user && cache.avatarOf(user.id)

  return { channel, user: user ?? null, guild: guild ?? null, icon: icon ?? null }
}

/**
 * Returns the acronym of a phrase (guild name).
 */
export function acronym(phrase: string): string {
  return phrase.split(/ +/).map(word => word[0] ?? '').join('')
}
