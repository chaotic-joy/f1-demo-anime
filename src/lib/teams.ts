const TEAM_COLORS: Record<string, string> = {
  mercedes: "#00a39a",
  ferrari: "#c4002f",
  red_bull: "#2450c7",
  mclaren: "#e86a00",
  rb: "#3c7dff",
  alpine: "#e45b9a",
  haas: "#8d9399",
  audi: "#d4002a",
  williams: "#1f7ed6",
  aston_martin: "#047a56",
  cadillac: "#9a7b2f",
};

export function teamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? "#161417";
}
