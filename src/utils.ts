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
  export function fromTimestamp(timestamp?: number | Date): Snowflake {
    timestamp ??= Date.now()
    if (timestamp instanceof Date)
      timestamp = timestamp.getTime()

    return BigInt(timestamp - EPOCH_MILLIS) << 18n
  }
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

  return prefix + timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}