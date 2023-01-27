/**
 * The response body for POST /login
 */
export interface LoginResponse {
  /**
   * The authentication token to use for future requests.
   */
  token: string;
  /**
   * The user ID of the logged-in user.
   */
  user_id: number;
}
