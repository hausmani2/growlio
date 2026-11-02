import test from "node:test";
import assert from "node:assert/strict";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale.js";
import {
  dateInsideWeek,
  filterDaysForWeek,
  salesTrendSentence,
  shouldAcceptWeekResponse,
  weekKeyFor,
  weeksInsideRange,
} from "./dailyPerformanceWeek.js";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 2 });

test("weeksInsideRange for October with Tuesday week start ends on Oct 27-31", () => {
  const weeks = weeksInsideRange([
    dayjs("2026-10-01"),
    dayjs("2026-10-31"),
  ]);
  const last = weeks[weeks.length - 1];
  assert.equal(last.start.format("YYYY-MM-DD"), "2026-10-27");
  assert.equal(last.end.format("YYYY-MM-DD"), "2026-10-31");
});

test("filterDaysForWeek keeps only days in the selected week", () => {
  const week = {
    start: dayjs("2026-10-27"),
    end: dayjs("2026-10-31"),
  };
  const rows = [
    { date: "2026-10-22", sales: 1000 },
    { date: "2026-10-29", sales: 59000 },
    { date: "2026-10-30", sales: 20700 },
  ];
  const filtered = filterDaysForWeek(rows, week);
  assert.deepEqual(
    filtered.map((row) => row.date),
    ["2026-10-29", "2026-10-30"]
  );
});

test("dateInsideWeek rejects days outside the selected week", () => {
  const week = {
    start: dayjs("2026-10-27"),
    end: dayjs("2026-10-31"),
  };
  assert.equal(dateInsideWeek("2026-10-29", week), true);
  assert.equal(dateInsideWeek("2026-10-22", week), false);
});

test("shouldAcceptWeekResponse ignores a stale previous-week response", () => {
  const active = weekKeyFor("2026-10-27", "2026-10-31");
  const stale = weekKeyFor("2026-10-20", "2026-10-26");
  assert.equal(shouldAcceptWeekResponse(stale, active), false);
  assert.equal(shouldAcceptWeekResponse(active, active), true);
});

test("salesTrendSentence names the count of earlier completed weekdays", () => {
  assert.equal(
    salesTrendSentence({
      salesNow: 59000,
      salesAvg: 1000,
      earlierCount: 1,
      weekdayName: "Thursday",
    }),
    "Sales were above the 1 earlier completed Thursday."
  );
});
