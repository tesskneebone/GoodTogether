# School / gym / homework planner

A small command-line tool that reads your class schedule from Outlook, checks
live traffic, and adds three kinds of events to your calendar:

- **Commute**: when to leave for school and when to head home. It tries
  departures every 15 minutes around your first and last class and picks the
  one with the least traffic. **If every drive would take more than 40
  minutes, it plans a transit trip instead.**
- **Gym**: a 2-hour block (including changing and walking over), up to 4 days
  a week. It goes where it helps your commute most. Usually that's right after
  your last class, so you skip evening rush hour, but it can also go in a long
  gap between classes or before your first class.
- **Homework**: fills free time (3 h on weekdays, 4 h on weekends by default)
  in 45–90 minute blocks. It uses gaps on campus first.

It has no dependencies. You just need Node 18 or newer.

## Try it first

```bash
cd planner
npm run demo
```

This runs a made-up class schedule against a fake LA traffic model, so you can
see what the plan looks like before connecting anything. Events marked `+` are
the ones the planner would add.

## Setup

### 1. Your settings

```bash
cp config.example.json config.json
```

Fill in `places.home` and `places.school`. For school, use where you
actually park (e.g. your parking structure), since that's where the drive
ends. `config.json` is gitignored.

### 2. Google Maps key (for traffic)

1. In the [Google Cloud console](https://console.cloud.google.com/), create a
   project and enable the **Routes API**.
2. Create an API key (APIs & Services → Credentials) and restrict it to the
   Routes API.
3. Export it before running:
   ```bash
   export GOOGLE_MAPS_API_KEY=your-key
   ```

A week's plan makes roughly 150–300 route lookups. That normally fits inside
Google's free monthly usage, but check your billing page.

### 3. Outlook access

Microsoft needs you to register a tiny "app" so the planner can reach your
calendar:

1. Go to [Microsoft Entra → App registrations](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   → **New registration**.
2. Name it anything. Under *Supported account types*, pick **Accounts in any
   organizational directory and personal Microsoft accounts**, then register.
3. Copy the **Application (client) ID** into `outlook.clientId` in
   `config.json`.
4. **Authentication** → *Advanced settings* → set **Allow public client
   flows** to **Yes**, then save.
5. **API permissions** → *Add a permission* → Microsoft Graph → Delegated →
   `Calendars.ReadWrite`.

The first run prints a link and a code. Open the link, enter the code, and
sign in. After that, the sign-in is cached in `.outlook-token.json`
(gitignored).

> **School Outlook accounts** (e.g. `@g.ucla.edu` / `@ucla.edu`): your
> university's IT may block apps it hasn't approved. If sign-in says admin
> approval is required, either ask IT or use a personal Outlook.com calendar
> that your class schedule is shared to. For a personal account, set
> `outlook.tenant` to `"consumers"`.

### 4. Tell it which events are classes

Events count as classes if they have the Outlook category `Class`, or if their
title contains a word like `LEC`, `DIS`, `LAB`, or `SEM`. You can change both
lists under `classes` in `config.json`. To check what it detects:

```bash
npm run plan -- --list-events
```

## Running it

```bash
npm run plan               # preview the next 7 days (starting tomorrow)
npm run write              # same, and add the events to Outlook
npm run plan -- --days 14 --start 2026-10-05
```

Everything the planner adds gets the Outlook category `AutoPlan`. Each
`--write` deletes the previous `AutoPlan` events in that date range and adds
fresh ones, so run it again whenever your schedule changes. It never touches
your other events. Commute events get a 10-minute reminder.

Traffic predictions get better closer to the day. Running it each evening for
the next few days works well.

## Tuning (`config.json`)

| Setting | Default | What it does |
| --- | --- | --- |
| `commute.maxDriveMinutes` | 40 | Over this, take transit instead |
| `commute.earliestDeparture` | 06:30 | Never plan to leave home earlier |
| `commute.waitCostPerMinute` | 0.25 | How much you mind arriving early or staying late to dodge traffic. At 0.25, you'd wait 20 min to save 5 min of driving. Raise it to leave closer to class time. |
| `commute.arrivalBufferMinutes` | 10 | Time to park and walk to class |
| `commute.searchWindowMinutes` | 150 | How far before/after class to look for better traffic |
| `gym.durationMinutes` | 120 | Gym block length, including changing and walking |
| `gym.daysPerWeek` | 4 | Gym sessions per week |
| `gym.open` / `gym.close` | 06:00 / 22:00 | Gym opening hours |
| `homework.hoursPerDay` / `weekendHoursPerDay` | 3 / 4 | Daily homework target |
| `homework.earliest` / `latest` | 08:00 / 22:00 | Window for homework blocks |

## Assumptions

- The gym is on or near campus (walking distance from class). Gym sessions only
  go on days you have class.
- All-day events and events marked *Free* are ignored. Everything else counts
  as busy.

## Tests

```bash
npm test
```
