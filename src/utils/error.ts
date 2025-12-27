// Error handling utilities

/**
 * Standard error handler for consistent error logging and handling
 */
export function handleError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[${context}]`, error)
  
  // You can add additional error tracking here (e.g., Sentry, LogRocket)
  // trackError(error, context)
  
  throw new Error(`${context}: ${errorMessage}`)
}

/**
 * Log an error without throwing
 */
export function logError(error: unknown, context: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[${context}]`, error)
  
  // You can add additional error tracking here
  // trackError(error, context)
}

/**
 * Type guard to check if an error is a Supabase error
 */
export function isSupabaseError(error: unknown): error is { message: string; code?: string; details?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}
