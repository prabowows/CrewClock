export interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface CrewMember {
  id: string;
  name: string;
  storeId: string;
}

export interface AttendanceLog {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  storeId: string;
  storeName: string;
  timestamp: Date;
  type: 'in' | 'out';
  photoURL?: string;
}

export interface BroadcastMessage {
  id: string;
  message: string;
  timestamp: Date;
}
