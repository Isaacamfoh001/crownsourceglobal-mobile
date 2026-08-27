export type TimeOfDayGreeting = "Good Morning" | "Good Afternoon" | "Good Evening";

/**
 * 05:00–11:59 → Good Morning, 12:00–16:59 → Good Afternoon,
 * 17:00–04:59 → Good Evening (wraps past midnight). Takes an optional Date
 * so it stays unit-testable instead of reading the clock internally.
 */
export function getTimeOfDayGreeting(date: Date = new Date()): TimeOfDayGreeting {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}
