export const getMealWindows = (hour: number): string[] => {
  if (hour < 5) return ["breakfast", "lunch", "snack", "dinner"]; // Early morning
  if (hour < 11) return ["breakfast", "lunch", "snack", "dinner"];
  if (hour < 15) return ["lunch", "snack", "dinner"];
  if (hour < 17) return ["snack", "dinner"];
  if (hour < 21) return ["dinner"];
  return ["night snack"];
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};