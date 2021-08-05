import Config from "./config"

if (Config.values.allowHeartbeat && !Config.values.allowErrorReporting) {
  const Sentry = require("@sentry/node")
  require("@sentry/tracing")
  Sentry.init({
    dsn: "https://8e8d2894d457420386f2e842ce9e80ff@o51634.ingest.sentry.io/5893564",
    tracesSampleRate: 0,
  })
}

if (Config.values.allowErrorReporting) {
  const Sentry = require("@sentry/node")
  require("@sentry/tracing")
  Sentry.init({
    dsn: "https://8e8d2894d457420386f2e842ce9e80ff@o51634.ingest.sentry.io/5893564",
    tracesSampleRate: 0.5,
  })
}
