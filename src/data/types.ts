export interface Session {
  id: string;
  label: string;
  date: string;
  time: string | null;
}

export interface Race {
  season: number;
  round: number;
  raceName: string;
  circuitId: string;
  circuitName: string;
  locality: string;
  country: string;
  date: string;
  time: string | null;
  sessions: Session[];
}

export interface DriverStanding {
  position: string;
  code: string;
  number: string;
  givenName: string;
  familyName: string;
  driverId: string;
  nationality: string;
  constructorId: string;
  constructorName: string;
  points: string;
  wins: string;
}

export interface ConstructorStanding {
  position: string;
  constructorId: string;
  name: string;
  nationality: string;
  points: string;
  wins: string;
}

export interface PodiumEntry {
  position: string;
  code: string;
  givenName: string;
  familyName: string;
  constructorId: string;
  constructorName: string;
  time: string | null;
  status: string;
}

export interface RecentResult {
  season: number;
  round: number;
  raceName: string;
  date: string;
  time: string | null;
  locality: string;
  country: string;
  podium: PodiumEntry[];
}

export interface NextSeason {
  season: number;
  races: Race[];
}

export interface Snapshot {
  fetchedAt: string;
  source: string;
  sourceName: string;
  season: number;
  standingsRound: number | null;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  races: Race[];
  recentResults: RecentResult[];
  nextSeason: NextSeason | null;
}
