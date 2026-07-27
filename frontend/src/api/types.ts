export interface Standort {
  id: number;
  name: string;
  adresse: string | null;
  notizen: string | null;
  erstellt_am: string;
  anzahl_voelker?: number;
}

export interface Volk {
  id: number;
  standort_id: number | null;
  standort_name?: string | null;
  name: string;
  beutentyp: string | null;
  koenigin_jahr: number | null;
  koenigin_rasse: string | null;
  koenigin_gezeichnet: number;
  status: string;
  notizen: string | null;
  erstellt_am: string;
}

export interface Durchsicht {
  id: number;
  volk_id: number;
  datum: string;
  volksstaerke: string | null;
  brutnest: string | null;
  koenigin_gesehen: number;
  weiselzellen: number;
  stifte: number;
  larven: number;
  verdeckelte_brut: number;
  futtervorrat: string | null;
  sanftmut: string | null;
  krankheiten: string | null;
  massnahmen: string | null;
  notizen: string | null;
  erstellt_am: string;
}

export interface Arzneimittel {
  id: number;
  name: string;
  chargennummer: string | null;
  einheit: string;
  bestand: number;
  verfallsdatum: string | null;
  bezugsquelle: string | null;
  einkaufsdatum: string | null;
  wartezeit_tage: number;
  notizen: string | null;
  erstellt_am: string;
}

export interface Behandlung {
  id: number;
  volk_id: number;
  volk_name?: string;
  arzneimittel_id: number | null;
  arzneimittel_name?: string | null;
  datum: string;
  indikation: string | null;
  dosierung: string | null;
  anwendungsmethode: string | null;
  menge_verbraucht: number | null;
  wartezeit_ende: string | null;
  behandelnde_person: string | null;
  notizen: string | null;
  erstellt_am: string;
}

export interface Ernte {
  id: number;
  volk_id: number | null;
  volk_name?: string | null;
  standort_id: number | null;
  standort_name?: string | null;
  datum: string;
  menge_kg: number;
  sorte: string | null;
  notizen: string | null;
  erstellt_am: string;
}
