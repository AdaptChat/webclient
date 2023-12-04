import {Member, Role} from "./types/guild";
import {PermissionOverwrite} from "./types/channel";
import {Permissions} from "./api/Bitflags";
import {User} from "./types/user";

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
  export function timestampMillis(snowflake: Snowflake): number {
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
  export function modelType(snowflake: Snowflake): ModelType {
    if (typeof snowflake !== "bigint")
      snowflake = BigInt(snowflake)

    return Number((snowflake >> 13n) & 0b11111n)
  }

  /**
   * Returns the snowflake replaced with the given model type.
   */
  export function withModelType(snowflake: Snowflake, modelType: ModelType): bigint {
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
export function calculatePermissions(userId: number, roles: Role[], overwrites?: PermissionOverwrite[]): Permissions {
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
 * Humanizes a timestamp.
 */
// TODO: Support for customizable locales
export function humanizeTimestamp(timestamp: number | Date): string {
  if (typeof timestamp === 'number')
    timestamp = new Date(timestamp)

  const now = new Date()

  let prefix
  if (isSameDay(timestamp, now))
    prefix = ''
  else if (isSameDay(timestamp, new Date(now.getTime() - 86_400_000)))
    prefix = 'Yesterday at '
  else
    prefix = timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' at '

  return prefix + humanizeTime(timestamp)
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
