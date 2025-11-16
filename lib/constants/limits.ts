/**
 * Application Limits & Rate Limiting
 * Defines character limits, rate limits, and validation constraints
 */

export const LIMITS = {
  NICKNAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  THOUGHT: {
    MAX_LENGTH: 1800, // ~300 words
    MAX_WORDS: 300,
    MAX_PER_USER: 10,
    RATE_LIMIT_SECONDS: 30, // 1 thought per 30 seconds
  },
  COMMENT: {
    MAX_LENGTH: 500,
    MAX_DEPTH: 2, // L1 and L2 only, no L3
  },
  CHAT_MESSAGE: {
    MAX_LENGTH: 500,
  },
  SPAM_REPORT: {
    AUTO_HIDE_THRESHOLD: 3, // Auto-hide after 3 reports
  },
} as const

/**
 * Count words in text (approximate)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

/**
 * Validate nickname
 */
export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim()
  return (
    trimmed.length >= LIMITS.NICKNAME.MIN_LENGTH &&
    trimmed.length <= LIMITS.NICKNAME.MAX_LENGTH
  )
}

/**
 * Validate thought content
 */
export function isValidThought(content: string): {
  valid: boolean
  error?: string
} {
  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Thought cannot be empty' }
  }

  if (trimmed.length > LIMITS.THOUGHT.MAX_LENGTH) {
    return {
      valid: false,
      error: `Thought too long (max ${LIMITS.THOUGHT.MAX_LENGTH} characters)`,
    }
  }

  const wordCount = countWords(trimmed)
  if (wordCount > LIMITS.THOUGHT.MAX_WORDS) {
    return {
      valid: false,
      error: `Thought too long (max ${LIMITS.THOUGHT.MAX_WORDS} words)`,
    }
  }

  return { valid: true }
}

/**
 * Validate comment content
 */
export function isValidComment(content: string): {
  valid: boolean
  error?: string
} {
  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Comment cannot be empty' }
  }

  if (trimmed.length > LIMITS.COMMENT.MAX_LENGTH) {
    return {
      valid: false,
      error: `Comment too long (max ${LIMITS.COMMENT.MAX_LENGTH} characters)`,
    }
  }

  return { valid: true }
}

/**
 * Validate chat message
 */
export function isValidChatMessage(message: string): {
  valid: boolean
  error?: string
} {
  const trimmed = message.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }

  if (trimmed.length > LIMITS.CHAT_MESSAGE.MAX_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${LIMITS.CHAT_MESSAGE.MAX_LENGTH} characters)`,
    }
  }

  return { valid: true }
}
