import { identity } from "@fullcalendar/core/internal";

/** @import { Identity } from "@fullcalendar/core/internal" */

export const eventSourceRefiners = {
  googleCalendarApiKey: String,
  googleCalendarId: String,
  customFetch: /** @type {Identity<(url: URL) => Promise<Response>>} */ (identity),
};
