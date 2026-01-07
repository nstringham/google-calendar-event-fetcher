# Google Calendar Event Fetcher

Fetch and transform events from the Google Calendar API

## Features

- Get events from Google Calendar
- Transform Events into a form that works for you application
- Subscribe to the full list of all events for reactivity
- TypeScript Types

## Installation

```bash
npm install google-calendar-event-fetcher
```

## Example Usage

```js
import GoogleCalendarEventFetcher from "google-calendar-event-fetcher";

const googleCalendarEventFetcher = new GoogleCalendarEventFetcher({
  calendarId: "c_1pcp6odi9qfe276tpuob8h00ms@group.calendar.google.com",
  apiKey: "AIzaSyDHUqblOxNndbN7jUXvoKy8IugKLlSXbkE",
  transform: (event) => {
    return {
      title: event.summary,
      start: new Date(event.start.dateTime ?? event.start.date),
      end: new Date(event.end.dateTime ?? event.end.date),
      description: event.description,
    };
  },
});

googleCalendarEventFetcher.subscribe((events) => {
  console.log("All events:", events);
});

googleCalendarEventFetcher.fetchEvents(new Date("2026-01-01"), new Date("2026-01-31"));
```
