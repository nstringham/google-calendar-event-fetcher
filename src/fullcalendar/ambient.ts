import type { eventSourceRefiners } from "./refiners.js";
import type { RawOptionsFromRefiners } from "@fullcalendar/core/internal";

type GoogleCalendarEventSourceRefiners = typeof eventSourceRefiners;

declare module "@fullcalendar/core/internal" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- this has to be an interface for interface merging
  interface EventSourceRefiners extends GoogleCalendarEventSourceRefiners {}
}

export type GoogleCalendarEventSource = RawOptionsFromRefiners<GoogleCalendarEventSourceRefiners> &
  Pick<
    Required<RawOptionsFromRefiners<GoogleCalendarEventSourceRefiners>>,
    "googleCalendarId" | "googleCalendarApiKey"
  >;
