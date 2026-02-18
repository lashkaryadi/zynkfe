const { subDays, subMonths, subYears, startOfDay, endOfDay, format, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } = require('date-fns');

function parseDateRange(range, customStart, customEnd) {
  const now = new Date();
  let start;
  let end = endOfDay(now);

  switch (range) {
    case '7d':
      start = startOfDay(subDays(now, 7));
      break;
    case '30d':
      start = startOfDay(subDays(now, 30));
      break;
    case '90d':
      start = startOfDay(subDays(now, 90));
      break;
    case '1y':
      start = startOfDay(subYears(now, 1));
      break;
    case 'custom':
      start = customStart ? startOfDay(new Date(customStart)) : startOfDay(subDays(now, 30));
      end = customEnd ? endOfDay(new Date(customEnd)) : end;
      break;
    default:
      start = startOfDay(subDays(now, 30));
  }

  return { start, end };
}

function getGranularity(start, end) {
  const days = differenceInDays(end, start);
  if (days <= 7) return 'hourly';
  if (days <= 90) return 'daily';
  if (days <= 365) return 'weekly';
  return 'monthly';
}

function getDateIntervals(start, end, granularity) {
  switch (granularity) {
    case 'daily':
      return eachDayOfInterval({ start, end });
    case 'weekly':
      return eachWeekOfInterval({ start, end });
    case 'monthly':
      return eachMonthOfInterval({ start, end });
    default:
      return eachDayOfInterval({ start, end });
  }
}

function formatDate(date, pattern = 'yyyy-MM-dd') {
  return format(date, pattern);
}

module.exports = {
  parseDateRange,
  getGranularity,
  getDateIntervals,
  formatDate,
};
