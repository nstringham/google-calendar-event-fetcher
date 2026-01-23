import { createPlugin } from "@fullcalendar/core";
import { eventSourceRefiners } from "./refiners.js";
import { eventSourceDef } from "./event-source.js";

export type { GoogleCalendarEventSource } from "./ambient.js";

export default createPlugin({
  name: "google-calendar-event-fetcher",
  eventSourceRefiners,
  eventSourceDefs: [eventSourceDef],
});
