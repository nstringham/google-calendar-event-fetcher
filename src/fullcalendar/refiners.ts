import { identity, type Identity } from "@fullcalendar/core/internal";
import type { FetchFunction } from "../event-fetcher.js";

export const eventSourceRefiners = {
  googleCalendarApiKey: String,
  googleCalendarId: String,
  customFetch: identity as Identity<FetchFunction>,
};
