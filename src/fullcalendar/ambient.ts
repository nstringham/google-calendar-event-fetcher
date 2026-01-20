import type { eventSourceRefiners } from "./refiners.js";
import type { RawOptionsFromRefiners } from "@fullcalendar/core/internal";

type GoogleCalendarEventSourceRefiners = typeof eventSourceRefiners;

declare module "@fullcalendar/core/internal" {
  interface EventSourceRefiners extends GoogleCalendarEventSourceRefiners {}
}

export type GoogleCalendarEventSource = Required<RawOptionsFromRefiners<GoogleCalendarEventSourceRefiners>>;
