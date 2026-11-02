import dayjs from "dayjs";

export const weeksInsideRange = (range) => {
  if (!range?.[0] || !range?.[1]) return [];
  const rangeStart = dayjs(range[0]).startOf("day");
  const rangeEnd = dayjs(range[1]).endOf("day");
  if (!rangeStart.isValid() || !rangeEnd.isValid() || rangeEnd.isBefore(rangeStart)) {
    return [];
  }
  const weeks = [];
  let cursor = rangeStart.startOf("week");
  const last = rangeEnd.startOf("week");
  while (cursor.isBefore(last) || cursor.isSame(last, "day")) {
    const weekStart = cursor.startOf("day");
    const weekEnd = cursor.endOf("week");
    weeks.push({
      start: weekStart.isBefore(rangeStart) ? rangeStart : weekStart,
      end: weekEnd.isAfter(rangeEnd) ? rangeEnd : weekEnd,
    });
    cursor = cursor.add(1, "week");
  }
  return weeks;
};

export const weekKeyFor = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  return `${dayjs(startDate).format("YYYY-MM-DD")}|${dayjs(endDate).format("YYYY-MM-DD")}`;
};

export const dateInsideWeek = (isoDate, week) => {
  if (!isoDate || !week?.start || !week?.end) return false;
  const day = dayjs(isoDate).startOf("day");
  if (!day.isValid()) return false;
  return (
    (day.isAfter(week.start, "day") || day.isSame(week.start, "day")) &&
    (day.isBefore(week.end, "day") || day.isSame(week.end, "day"))
  );
};

export const filterDaysForWeek = (rows, week) => {
  if (!Array.isArray(rows) || !week?.start || !week?.end) return [];
  return rows.filter((item) => {
    if (item == null) return false;
    if (
      item.is_closed === false ||
      item.day_closed === false ||
      item.is_day_closed === false
    ) {
      return false;
    }
    return dateInsideWeek(item.date, week);
  });
};

export const shouldAcceptWeekResponse = (requestedKey, activeKey) =>
  Boolean(requestedKey) && requestedKey === activeKey;

export const salesTrendSentence = ({
  salesNow,
  salesAvg,
  earlierCount,
  weekdayName,
}) => {
  if (!(salesAvg > 0) || !earlierCount) return "";
  const direction = Number(salesNow) >= Number(salesAvg) ? "above" : "below";
  const count = Number(earlierCount);
  const dayLabel = `${weekdayName}${count === 1 ? "" : "s"}`;
  return `Sales were ${direction} the ${count} earlier completed ${dayLabel}.`;
};
