import type { Store, CrewMember, AttendanceLog } from './types';

export const stores: Store[] = [
  { id: 'store-1', name: 'Downtown Central', latitude: 110.3775794, longitude: -6.9483907 },
  { id: 'store-2', name: 'Beachside Outlet', latitude: 33.993020, longitude: -118.479530 },
  { id: 'store-3', name: 'Mountain View Branch', latitude: 34.1366, longitude: -118.1251 },
];

export const crewMembers: CrewMember[] = [
  { id: 'crew-1', name: 'Alex Johnson', storeId: 'store-1', address: '123 Main St, Los Angeles, CA 90012' },
  { id: 'crew-2', name: 'Maria Garcia', storeId: 'store-1', address: '456 Grand Ave, Los Angeles, CA 90012' },
  { id: 'crew-3', name: 'James Smith', storeId: 'store-2', address: '789 Ocean Front Walk, Santa Monica, CA 90401' },
  { id: 'crew-4', name: 'Patricia Williams', storeId: 'store-3', address: '101 Rosemont Ave, Pasadena, CA 91103' },
];

export const attendanceLogs: AttendanceLog[] = [
  {
    id: 'log-1',
    crewMemberId: 'crew-1',
    crewMemberName: 'Alex Johnson',
    storeId: 'store-1',
    storeName: 'Downtown Central',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
    type: 'in',
  },
  {
    id: 'log-2',
    crewMemberId: 'crew-1',
    crewMemberName: 'Alex Johnson',
    storeId: 'store-1',
    storeName: 'Downtown Central',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)),
    type: 'out',
  },
  {
    id: 'log-3',
    crewMemberId: 'crew-3',
    crewMemberName: 'James Smith',
    storeId: 'store-2',
    storeName: 'Beachside Outlet',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 4)),
    type: 'in',
  },
];
