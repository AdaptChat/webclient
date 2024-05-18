/**
 * Represents the presence state (status and activity) of a user.
 */
export interface Presence {
  /**
   * The ID of the user whose presence this is.
   */
  user_id: Snowflake
  /**
   * The status of the user.
   */
  status: 'online' | 'idle' | 'dnd' | 'offline'
  /**
   * The custom status of the user, if any.
   */
  custom_status?: string
  /**
   * The devices the user is present on.
   */
  devices: number
  /**
   * The time the user initially went online. This is only provided if the user is online.
   */
  online_since?: string
}
