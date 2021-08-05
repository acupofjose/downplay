import * as Sentry from "@sentry/react"
import { Integrations } from "@sentry/tracing"
import { ConfigStatus } from "./api/config"

export class Analytics {
  static initIfEnabled = (status: ConfigStatus) => {
    if (status.config.allowHeartbeart || status.config.allowErrorReporting)
      Sentry.init({
        dsn: "https://e9ac683c81fa4fde91976cdb14c02ebf@o51634.ingest.sentry.io/5893570",
        integrations: [new Integrations.BrowserTracing()],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: status.config.allowErrorReporting ? 0.5 : 0,
      })
  }
}
