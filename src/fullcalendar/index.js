import { createPlugin } from "@fullcalendar/core";
import { eventSourceRefiners } from "./refiners.js";
import { eventSource } from "./event-source.js";

/** @typedef {import("./ambient.js").GoogleCalendarEventSource} GoogleCalendarEventSource */

export default createPlugin({
  name: "google-calendar-event-fetcher",
  eventSourceRefiners,
  eventSourceDefs: [eventSource],
});
