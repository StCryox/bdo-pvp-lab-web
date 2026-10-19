import { ApiError } from './client'

const MAX_NETWORK_RETRIES = 2

/** A sleeping API host can drop the first connections; an HTTP problem will not change on retry. */
export const retryNetworkErrors = (failureCount: number, error: Error): boolean =>
  !(error instanceof ApiError) && failureCount < MAX_NETWORK_RETRIES
