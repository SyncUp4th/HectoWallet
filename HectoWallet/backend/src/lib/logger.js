function ts() {
  return new Date().toISOString()
}

export function log(scope, message, meta) {
  const suffix = meta !== undefined ? ` ${JSON.stringify(meta)}` : ''
  console.log(`[${ts()}] [${scope}] ${message}${suffix}`)
}

export function logError(scope, message, err) {
  console.error(`[${ts()}] [${scope}] ${message}: ${err?.message ?? err}`)
}
