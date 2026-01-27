# Google Calendar Event Fetcher

Fetch and transform events from the Google Calendar API

## Features

- Get events from Google Calendar
- Transform Events into a form that works for you application
- Only fetch each event once
- Subscribe to the full list of all events for reactivity
- TypeScript Types

## Installation

```bash
npm install google-calendar-event-fetcher
```

## Example Usage

```js
import { GoogleCalendarEventFetcher, isAllDayEvent, convertToDate } from "google-calendar-event-fetcher";

const googleCalendarEventFetcher = new GoogleCalendarEventFetcher({
  calendarId: "your_google_calendar_id@group.calendar.google.com",
  apiKey: "YOUR_GOOGLE_API_KEY",
  transform: (event) => {
    return {
      title: event.summary,
      allDay: isAllDayEvent(event),
      start: convertToDate(event.start),
      end: convertToDate(event.end),
      description: event.description,
    };
  },
});

googleCalendarEventFetcher.subscribe((events) => {
  console.log("All events:", events);
});

googleCalendarEventFetcher.fetchEvents(new Date("2026-01-01"), new Date("2026-02-01"));
```

## Example Usage with FullCalendar

```js
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from "google-calendar-event-fetcher/fullcalendar";

const calendarElement = document.getElementById("calendar");
const calendar = new Calendar(calendarElement, {
  plugins: [dayGridPlugin, googleCalendarPlugin],
  initialView: "dayGridMonth",
  events: {
    googleCalendarId: "your_google_calendar_id@group.calendar.google.com",
    googleCalendarApiKey: "YOUR_GOOGLE_API_KEY",
  },
});

calendar.render();
```
