import { addDays, addHours, setHours, setMinutes, startOfDay, format } from 'date-fns'

const today = startOfDay(new Date())

const SKILLS = ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Elevator', 'General Maintenance', 'Locksmith', 'Roofing']

const WORK_ORDER_TITLES = [
  'HVAC Filter Replacement', 'Electrical Panel Inspection', 'Emergency Pipe Repair',
  'Fire Alarm System Check', 'Elevator Annual Inspection', 'Roof Leak Assessment',
  'Lock Rekeying — Suite 400', 'Thermostat Calibration', 'Emergency Lighting Test',
  'Plumbing Drain Clearing', 'Generator Load Test', 'Security Camera Install',
  'Parking Lot Lighting', 'Boiler Maintenance', 'Air Handler Unit Service',
  'Sprinkler System Test', 'Electrical Outlet Repair', 'HVAC Compressor Swap',
  'Water Heater Replacement', 'Ceiling Tile Repair', 'Smoke Detector Battery',
  'Exit Sign Replacement', 'Condenser Coil Cleaning', 'Ductwork Inspection',
  'Backflow Preventer Test', 'Panel Breaker Replacement', 'Chiller Service',
  'Cooling Tower Treatment', 'Sump Pump Check', 'Window Seal Repair',
]

const CUSTOMERS = [
  'Meridian Office Park', 'Cascade Medical Center', 'Northgate Mall',
  'Riverside Elementary', 'Harbor Industrial Complex', 'Summit Hotels Group',
  'Valley Creek Apartments', 'Lakeside Business Center', 'Metro Fire Station 12',
  'Greenfield Corporate HQ',
]

export const technicians = [
  {
    recordId: 101, fullName: 'John Martinez', email: 'j.martinez@fieldpro.com',
    phone: '(555) 234-0101', skills: ['HVAC', 'General Maintenance'],
    hourlyRate: 45, shiftStart: '08:00', shiftEnd: '17:00', maxHoursWeek: 40,
    homeAddress: '142 Oak Street, Springfield', homeLat: 40.7128, homeLng: -74.0060,
    serviceRegion: 'North', active: true, avatarColor: '#0052CC',
  },
  {
    recordId: 102, fullName: 'Sarah Chen', email: 's.chen@fieldpro.com',
    phone: '(555) 234-0102', skills: ['Electrical', 'Fire Safety', 'General Maintenance'],
    hourlyRate: 52, shiftStart: '07:00', shiftEnd: '16:00', maxHoursWeek: 40,
    homeAddress: '88 Elm Avenue, Springfield', homeLat: 40.7282, homeLng: -73.9942,
    serviceRegion: 'East', active: true, avatarColor: '#00875A',
  },
  {
    recordId: 103, fullName: 'Mike Torres', email: 'm.torres@fieldpro.com',
    phone: '(555) 234-0103', skills: ['Plumbing', 'General Maintenance'],
    hourlyRate: 42, shiftStart: '08:00', shiftEnd: '17:00', maxHoursWeek: 40,
    homeAddress: '305 Pine Road, Springfield', homeLat: 40.7484, homeLng: -73.9856,
    serviceRegion: 'South', active: true, avatarColor: '#FF991F',
  },
  {
    recordId: 104, fullName: 'Lisa Park', email: 'l.park@fieldpro.com',
    phone: '(555) 234-0104', skills: ['HVAC', 'Electrical', 'Fire Safety'],
    hourlyRate: 58, shiftStart: '06:00', shiftEnd: '15:00', maxHoursWeek: 40,
    homeAddress: '17 Birch Lane, Springfield', homeLat: 40.7589, homeLng: -73.9851,
    serviceRegion: 'North', active: true, avatarColor: '#8B5CF6',
  },
  {
    recordId: 105, fullName: 'David Kim', email: 'd.kim@fieldpro.com',
    phone: '(555) 234-0105', skills: ['Elevator', 'Electrical'],
    hourlyRate: 65, shiftStart: '08:00', shiftEnd: '17:00', maxHoursWeek: 35,
    homeAddress: '520 Maple Drive, Springfield', homeLat: 40.7061, homeLng: -74.0087,
    serviceRegion: 'West', active: true, avatarColor: '#DE350B',
  },
  {
    recordId: 106, fullName: 'Amy Rodriguez', email: 'a.rodriguez@fieldpro.com',
    phone: '(555) 234-0106', skills: ['Plumbing', 'HVAC', 'General Maintenance'],
    hourlyRate: 48, shiftStart: '09:00', shiftEnd: '18:00', maxHoursWeek: 40,
    homeAddress: '78 Cedar Court, Springfield', homeLat: 40.7200, homeLng: -73.9960,
    serviceRegion: 'East', active: true, avatarColor: '#00875A',
  },
  {
    recordId: 107, fullName: 'James Wilson', email: 'j.wilson@fieldpro.com',
    phone: '(555) 234-0107', skills: ['Roofing', 'General Maintenance'],
    hourlyRate: 40, shiftStart: '07:00', shiftEnd: '16:00', maxHoursWeek: 40,
    homeAddress: '234 Spruce Way, Springfield', homeLat: 40.7350, homeLng: -74.0020,
    serviceRegion: 'South', active: true, avatarColor: '#FF991F',
  },
  {
    recordId: 108, fullName: 'Nina Patel', email: 'n.patel@fieldpro.com',
    phone: '(555) 234-0108', skills: ['Locksmith', 'Fire Safety', 'General Maintenance'],
    hourlyRate: 44, shiftStart: '08:00', shiftEnd: '17:00', maxHoursWeek: 40,
    homeAddress: '91 Willow Street, Springfield', homeLat: 40.7410, homeLng: -73.9890,
    serviceRegion: 'North', active: true, avatarColor: '#0052CC',
  },
  {
    recordId: 109, fullName: 'Carlos Rivera', email: 'c.rivera@fieldpro.com',
    phone: '(555) 234-0109', skills: ['HVAC', 'Plumbing'],
    hourlyRate: 46, shiftStart: '07:00', shiftEnd: '16:00', maxHoursWeek: 40,
    homeAddress: '66 Ash Boulevard, Springfield', homeLat: 40.7155, homeLng: -74.0035,
    serviceRegion: 'South', active: true, avatarColor: '#36B37E',
  },
  {
    recordId: 110, fullName: 'Rachel Foster', email: 'r.foster@fieldpro.com',
    phone: '(555) 234-0110', skills: ['Electrical', 'General Maintenance', 'Roofing'],
    hourlyRate: 50, shiftStart: '08:00', shiftEnd: '17:00', maxHoursWeek: 40,
    homeAddress: '203 Magnolia Lane, Springfield', homeLat: 40.7320, homeLng: -73.9975,
    serviceRegion: 'East', active: true, avatarColor: '#FF5630',
  },
  {
    recordId: 111, fullName: 'Tom Bradley', email: 't.bradley@fieldpro.com',
    phone: '(555) 234-0111', skills: ['Fire Safety', 'Elevator', 'HVAC'],
    hourlyRate: 55, shiftStart: '06:00', shiftEnd: '15:00', maxHoursWeek: 40,
    homeAddress: '417 Chestnut Ave, Springfield', homeLat: 40.7450, homeLng: -73.9920,
    serviceRegion: 'West', active: true, avatarColor: '#6554C0',
  },
  {
    recordId: 112, fullName: 'Megan O\'Brien', email: 'm.obrien@fieldpro.com',
    phone: '(555) 234-0112', skills: ['Plumbing', 'Locksmith'],
    hourlyRate: 43, shiftStart: '09:00', shiftEnd: '18:00', maxHoursWeek: 35,
    homeAddress: '55 Poplar Court, Springfield', homeLat: 40.7210, homeLng: -74.0050,
    serviceRegion: 'North', active: true, avatarColor: '#00B8D9',
  },
  {
    recordId: 113, fullName: 'Derek Chang', email: 'd.chang@fieldpro.com',
    phone: '(555) 234-0113', skills: ['Electrical', 'Fire Safety', 'Locksmith'],
    hourlyRate: 54, shiftStart: '07:00', shiftEnd: '16:00', maxHoursWeek: 40,
    homeAddress: '128 Sycamore Drive, Springfield', homeLat: 40.7380, homeLng: -73.9880,
    serviceRegion: 'East', active: true, avatarColor: '#FF991F',
  },
]

// Generate availability events (time off)
export const availabilityEvents = [
  // Today
  {
    recordId: 201, technicianId: 103, eventType: 'Unavailable',
    availabilityType: 'Training',
    start: setHours(today, 0).toISOString(),
    end: setHours(today, 12).toISOString(),
    allDay: false, recurring: 'None', notes: 'Safety certification renewal',
  },
  {
    recordId: 202, technicianId: 106, eventType: 'Unavailable',
    availabilityType: 'Personal',
    start: setHours(today, 14).toISOString(),
    end: setHours(today, 17).toISOString(),
    allDay: false, recurring: 'None', notes: 'Doctor appointment',
  },
  {
    recordId: 203, technicianId: 108, eventType: 'Unavailable',
    availabilityType: 'Unavailable',
    start: setHours(today, 13).toISOString(),
    end: setHours(today, 15).toISOString(),
    allDay: false, recurring: 'None', notes: '',
  },
  {
    recordId: 204, technicianId: 107, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(today, 0).toISOString(),
    end: setHours(today, 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'PTO',
  },
  // Day 1
  {
    recordId: 205, technicianId: 105, eventType: 'Unavailable',
    availabilityType: 'Sick',
    start: setHours(addDays(today, 1), 8).toISOString(),
    end: setHours(addDays(today, 1), 12).toISOString(),
    allDay: false, recurring: 'None', notes: '',
  },
  {
    recordId: 206, technicianId: 107, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 1), 0).toISOString(),
    end: setHours(addDays(today, 1), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'PTO',
  },
  // Day 2
  {
    recordId: 207, technicianId: 101, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 2), 0).toISOString(),
    end: setHours(addDays(today, 3), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'Family vacation',
  },
  {
    recordId: 208, technicianId: 107, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 2), 0).toISOString(),
    end: setHours(addDays(today, 2), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'PTO',
  },
  // Day 3
  {
    recordId: 209, technicianId: 105, eventType: 'Unavailable',
    availabilityType: 'Training',
    start: setHours(addDays(today, 3), 0).toISOString(),
    end: setHours(addDays(today, 3), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'Advanced HVAC training',
  },
  {
    recordId: 210, technicianId: 112, eventType: 'Unavailable',
    availabilityType: 'On-Call',
    start: setHours(addDays(today, 3), 0).toISOString(),
    end: setHours(addDays(today, 3), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'Emergency on-call duty',
  },
  // Day 4
  {
    recordId: 211, technicianId: 107, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 4), 0).toISOString(),
    end: setHours(addDays(today, 4), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'PTO',
  },
  {
    recordId: 212, technicianId: 103, eventType: 'Unavailable',
    availabilityType: 'Personal',
    start: setHours(addDays(today, 4), 13).toISOString(),
    end: setHours(addDays(today, 4), 17).toISOString(),
    allDay: false, recurring: 'None', notes: '',
  },
  // Day 5
  {
    recordId: 213, technicianId: 102, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 5), 0).toISOString(),
    end: setHours(addDays(today, 7), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'Weekend getaway',
  },
  {
    recordId: 214, technicianId: 107, eventType: 'Unavailable',
    availabilityType: 'Vacation',
    start: setHours(addDays(today, 5), 0).toISOString(),
    end: setHours(addDays(today, 5), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'PTO',
  },
  // Day 6
  {
    recordId: 215, technicianId: 104, eventType: 'Unavailable',
    availabilityType: 'Sick',
    start: setHours(addDays(today, 6), 0).toISOString(),
    end: setHours(addDays(today, 6), 23).toISOString(),
    allDay: true, recurring: 'None', notes: '',
  },
  {
    recordId: 216, technicianId: 111, eventType: 'Unavailable',
    availabilityType: 'Training',
    start: setHours(addDays(today, 6), 0).toISOString(),
    end: setHours(addDays(today, 6), 23).toISOString(),
    allDay: true, recurring: 'None', notes: 'Plumbing certification',
  },
  {
    recordId: 217, technicianId: 112, eventType: 'Unavailable',
    availabilityType: 'Personal',
    start: setHours(addDays(today, 6), 0).toISOString(),
    end: setHours(addDays(today, 6), 12).toISOString(),
    allDay: false, recurring: 'None', notes: '',
  },
]

function randomLat() { return 40.70 + Math.random() * 0.08 }
function randomLng() { return -74.02 + Math.random() * 0.06 }

function generateWorkOrders() {
  const orders = []

  // Assigned work orders (on timeline for today and tomorrow)
  const assignedConfigs = [
    // ── Today (day 0) ──
    { techId: 101, day: 0, startH: 8, dur: 2, title: 'HVAC Filter Replacement', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 101, day: 0, startH: 10.5, dur: 1.5, title: 'Thermostat Calibration', skills: ['HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 101, day: 0, startH: 13, dur: 3, title: 'Air Handler Unit Service', skills: ['HVAC', 'General Maintenance'], priority: 2, status: 'In Progress' },
    { techId: 102, day: 0, startH: 7, dur: 2, title: 'Electrical Panel Inspection', skills: ['Electrical'], priority: 1, status: 'In Progress' },
    { techId: 102, day: 0, startH: 10, dur: 1.5, title: 'Emergency Lighting Test', skills: ['Electrical', 'Fire Safety'], priority: 2, status: 'Scheduled' },
    { techId: 103, day: 0, startH: 13, dur: 2, title: 'Plumbing Drain Clearing', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 104, day: 0, startH: 6, dur: 2, title: 'Fire Alarm System Check', skills: ['Fire Safety'], priority: 1, status: 'Complete' },
    { techId: 104, day: 0, startH: 9, dur: 3, title: 'HVAC Compressor Swap', skills: ['HVAC', 'Electrical'], priority: 1, status: 'In Progress' },
    { techId: 105, day: 0, startH: 8, dur: 4, title: 'Elevator Annual Inspection', skills: ['Elevator'], priority: 1, status: 'In Progress' },
    { techId: 105, day: 0, startH: 13, dur: 2, title: 'Panel Breaker Replacement', skills: ['Electrical'], priority: 2, status: 'Scheduled' },
    { techId: 106, day: 0, startH: 9, dur: 1.5, title: 'Sump Pump Check', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 106, day: 0, startH: 11, dur: 2, title: 'Water Heater Replacement', skills: ['Plumbing', 'General Maintenance'], priority: 2, status: 'Scheduled' },
    { techId: 108, day: 0, startH: 8, dur: 1, title: 'Lock Rekeying — Suite 400', skills: ['Locksmith'], priority: 3, status: 'Scheduled' },
    { techId: 108, day: 0, startH: 10, dur: 2, title: 'Smoke Detector Battery', skills: ['Fire Safety', 'General Maintenance'], priority: 2, status: 'Scheduled' },
    { techId: 109, day: 0, startH: 8, dur: 2.5, title: 'HVAC Compressor Diagnostics', skills: ['HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 110, day: 0, startH: 9, dur: 1.5, title: 'Electrical Outlet Repair', skills: ['Electrical'], priority: 3, status: 'Scheduled' },
    { techId: 110, day: 0, startH: 11, dur: 2, title: 'Parking Lot Lighting', skills: ['Electrical', 'General Maintenance'], priority: 4, status: 'Scheduled' },
    { techId: 113, day: 0, startH: 7, dur: 2, title: 'Fire Panel Quarterly Test', skills: ['Fire Safety', 'Electrical'], priority: 1, status: 'In Progress' },
    { techId: 113, day: 0, startH: 10, dur: 1.5, title: 'Keycard System Reconfig', skills: ['Locksmith'], priority: 2, status: 'Scheduled' },

    // ── Tomorrow (day 1) ──
    { techId: 101, day: 1, startH: 8, dur: 2.5, title: 'Condenser Coil Cleaning', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 101, day: 1, startH: 11, dur: 2, title: 'Ductwork Inspection', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 102, day: 1, startH: 7, dur: 3, title: 'Generator Load Test', skills: ['Electrical'], priority: 1, status: 'Scheduled' },
    { techId: 102, day: 1, startH: 11, dur: 1.5, title: 'Emergency Lighting Test', skills: ['Electrical', 'Fire Safety'], priority: 2, status: 'Scheduled' },
    { techId: 103, day: 1, startH: 8, dur: 2, title: 'Water Heater Flush', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 103, day: 1, startH: 11, dur: 1.5, title: 'Bathroom Fixture Replacement', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 104, day: 1, startH: 6, dur: 2.5, title: 'HVAC Startup Inspection', skills: ['HVAC', 'Electrical'], priority: 2, status: 'Scheduled' },
    { techId: 106, day: 1, startH: 9, dur: 2, title: 'Backflow Preventer Test', skills: ['Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 108, day: 1, startH: 8, dur: 1.5, title: 'Master Key System Audit', skills: ['Locksmith'], priority: 2, status: 'Scheduled' },
    { techId: 109, day: 1, startH: 7, dur: 3, title: 'Boiler Maintenance', skills: ['HVAC', 'Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 110, day: 1, startH: 8, dur: 2, title: 'Roof Leak Assessment', skills: ['Roofing', 'General Maintenance'], priority: 1, status: 'Scheduled' },
    { techId: 111, day: 1, startH: 6, dur: 3, title: 'Fire Alarm System Check', skills: ['Fire Safety'], priority: 1, status: 'Scheduled' },
    { techId: 112, day: 1, startH: 9, dur: 1.5, title: 'Sump Pump Replacement', skills: ['Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 113, day: 1, startH: 7, dur: 2, title: 'Security Camera Install', skills: ['Electrical'], priority: 3, status: 'Scheduled' },

    // ── Day 2 ──
    { techId: 102, day: 2, startH: 7, dur: 2.5, title: 'Panel Breaker Replacement', skills: ['Electrical'], priority: 2, status: 'Scheduled' },
    { techId: 102, day: 2, startH: 10, dur: 1.5, title: 'Outlet GFCI Upgrade', skills: ['Electrical'], priority: 3, status: 'Scheduled' },
    { techId: 103, day: 2, startH: 8, dur: 2, title: 'Plumbing Drain Clearing', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 104, day: 2, startH: 7, dur: 3, title: 'Chiller Service', skills: ['HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 105, day: 2, startH: 8, dur: 4, title: 'Elevator Modernization', skills: ['Elevator', 'Electrical'], priority: 1, status: 'Scheduled' },
    { techId: 106, day: 2, startH: 9, dur: 2, title: 'Cooling Tower Treatment', skills: ['HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 108, day: 2, startH: 8, dur: 1.5, title: 'Lock Rekeying — Suite 200', skills: ['Locksmith'], priority: 3, status: 'Scheduled' },
    { techId: 109, day: 2, startH: 8, dur: 2, title: 'HVAC Filter Replacement', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 110, day: 2, startH: 9, dur: 2.5, title: 'Rooftop Unit Inspection', skills: ['Roofing', 'General Maintenance'], priority: 2, status: 'Scheduled' },
    { techId: 111, day: 2, startH: 6, dur: 2, title: 'Sprinkler System Test', skills: ['Fire Safety'], priority: 1, status: 'Scheduled' },
    { techId: 112, day: 2, startH: 9, dur: 1.5, title: 'Water Softener Install', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 113, day: 2, startH: 8, dur: 2, title: 'Fire Extinguisher Inspection', skills: ['Fire Safety'], priority: 2, status: 'Scheduled' },

    // ── Day 3 ──
    { techId: 101, day: 3, startH: 8, dur: 3, title: 'Air Handler Unit Service', skills: ['HVAC', 'General Maintenance'], priority: 2, status: 'Scheduled' },
    { techId: 101, day: 3, startH: 12, dur: 2, title: 'Thermostat Calibration', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 102, day: 3, startH: 7, dur: 2, title: 'Electrical Panel Inspection', skills: ['Electrical'], priority: 1, status: 'Scheduled' },
    { techId: 103, day: 3, startH: 9, dur: 2, title: 'Pipe Insulation Repair', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 104, day: 3, startH: 6, dur: 2.5, title: 'Fire Suppression Test', skills: ['Fire Safety', 'HVAC'], priority: 1, status: 'Scheduled' },
    { techId: 106, day: 3, startH: 9, dur: 2, title: 'Backflow Preventer Test', skills: ['Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 108, day: 3, startH: 8, dur: 1, title: 'Exit Sign Replacement', skills: ['General Maintenance'], priority: 4, status: 'Scheduled' },
    { techId: 109, day: 3, startH: 7, dur: 2.5, title: 'HVAC Compressor Swap', skills: ['HVAC', 'Plumbing'], priority: 1, status: 'Scheduled' },
    { techId: 110, day: 3, startH: 8, dur: 2, title: 'Parking Lot Lighting', skills: ['Electrical'], priority: 4, status: 'Scheduled' },
    { techId: 111, day: 3, startH: 7, dur: 3, title: 'Elevator Cab Refurbish', skills: ['Elevator', 'HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 113, day: 3, startH: 7, dur: 1.5, title: 'Smoke Detector Battery', skills: ['Fire Safety'], priority: 2, status: 'Scheduled' },

    // ── Day 4 ──
    { techId: 101, day: 4, startH: 8, dur: 2, title: 'Condenser Coil Cleaning', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 102, day: 4, startH: 7, dur: 2.5, title: 'Generator Load Test', skills: ['Electrical'], priority: 1, status: 'Scheduled' },
    { techId: 103, day: 4, startH: 8, dur: 1.5, title: 'Toilet Valve Replacement', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 104, day: 4, startH: 6, dur: 2, title: 'HVAC Startup Inspection', skills: ['HVAC', 'Electrical'], priority: 2, status: 'Scheduled' },
    { techId: 105, day: 4, startH: 8, dur: 4, title: 'Elevator Annual Inspection', skills: ['Elevator'], priority: 1, status: 'Scheduled' },
    { techId: 106, day: 4, startH: 9, dur: 2, title: 'Sump Pump Check', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 108, day: 4, startH: 8, dur: 2, title: 'Access Control System Update', skills: ['Locksmith', 'Fire Safety'], priority: 2, status: 'Scheduled' },
    { techId: 109, day: 4, startH: 7, dur: 2, title: 'HVAC Filter Replacement', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 110, day: 4, startH: 9, dur: 2, title: 'Ceiling Tile Repair', skills: ['General Maintenance'], priority: 4, status: 'Scheduled' },
    { techId: 111, day: 4, startH: 6, dur: 3, title: 'Fire Alarm System Check', skills: ['Fire Safety', 'HVAC'], priority: 1, status: 'Scheduled' },
    { techId: 112, day: 4, startH: 9, dur: 1.5, title: 'Drain Cleaning Service', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 113, day: 4, startH: 8, dur: 2, title: 'Security Camera Install', skills: ['Electrical', 'Locksmith'], priority: 2, status: 'Scheduled' },

    // ── Day 5 ──
    { techId: 101, day: 5, startH: 8, dur: 3, title: 'Ductwork Inspection', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 103, day: 5, startH: 8, dur: 2, title: 'Water Heater Replacement', skills: ['Plumbing', 'General Maintenance'], priority: 2, status: 'Scheduled' },
    { techId: 104, day: 5, startH: 7, dur: 2.5, title: 'Fire Panel Quarterly Test', skills: ['Fire Safety', 'Electrical'], priority: 1, status: 'Scheduled' },
    { techId: 105, day: 5, startH: 8, dur: 3, title: 'Elevator Cable Inspection', skills: ['Elevator'], priority: 1, status: 'Scheduled' },
    { techId: 106, day: 5, startH: 9, dur: 2, title: 'Cooling Tower Treatment', skills: ['HVAC'], priority: 2, status: 'Scheduled' },
    { techId: 108, day: 5, startH: 8, dur: 1.5, title: 'Lock Rekeying — Suite 600', skills: ['Locksmith'], priority: 3, status: 'Scheduled' },
    { techId: 109, day: 5, startH: 7, dur: 2, title: 'Boiler Maintenance', skills: ['HVAC', 'Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 110, day: 5, startH: 8, dur: 2, title: 'Window Seal Repair', skills: ['General Maintenance'], priority: 3, status: 'Scheduled' },
    { techId: 111, day: 5, startH: 6, dur: 2, title: 'Sprinkler System Test', skills: ['Fire Safety'], priority: 1, status: 'Scheduled' },
    { techId: 112, day: 5, startH: 9, dur: 1.5, title: 'Bathroom Fixture Replacement', skills: ['Plumbing'], priority: 3, status: 'Scheduled' },
    { techId: 113, day: 5, startH: 7, dur: 2, title: 'Emergency Generator Test', skills: ['Electrical', 'Fire Safety'], priority: 1, status: 'Scheduled' },

    // ── Day 6 ──
    { techId: 101, day: 6, startH: 8, dur: 2, title: 'HVAC Filter Replacement', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 103, day: 6, startH: 8, dur: 1.5, title: 'Pipe Fitting Repair', skills: ['Plumbing'], priority: 2, status: 'Scheduled' },
    { techId: 105, day: 6, startH: 8, dur: 3, title: 'Elevator Door Adjustment', skills: ['Elevator'], priority: 2, status: 'Scheduled' },
    { techId: 109, day: 6, startH: 8, dur: 2, title: 'Thermostat Calibration', skills: ['HVAC'], priority: 3, status: 'Scheduled' },
    { techId: 110, day: 6, startH: 9, dur: 2, title: 'Roof Flashing Repair', skills: ['Roofing', 'General Maintenance'], priority: 2, status: 'Scheduled' },
  ]

  assignedConfigs.forEach((cfg, i) => {
    const day = addDays(today, cfg.day)
    const startTime = addHours(day, cfg.startH)
    const endTime = addHours(startTime, cfg.dur)

    orders.push({
      recordId: 1001 + i,
      workOrderNumber: `WO-${1001 + i}`,
      title: cfg.title,
      description: `${cfg.title} at ${CUSTOMERS[i % CUSTOMERS.length]}`,
      status: cfg.status,
      priority: cfg.priority,
      scheduledStart: startTime.toISOString(),
      scheduledEnd: endTime.toISOString(),
      estDuration: cfg.dur,
      locationAddress: `${100 + i * 12} Main Street, Springfield`,
      locationLat: randomLat(),
      locationLng: randomLng(),
      skillsRequired: cfg.skills,
      assignedTechnicianId: cfg.techId,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      slaDeadline: addHours(endTime, 4).toISOString(),
      costEstimate: Math.round(cfg.dur * (35 + Math.random() * 30)),
      pinned: false,
      aiScheduled: false,
      aiScheduleBatch: null,
      _version: 1,
    })
  })

  // Unassigned work orders
  const unassignedTitles = [
    { title: 'Chiller Service', skills: ['HVAC'], dur: 3, priority: 2 },
    { title: 'Security Camera Install', skills: ['Electrical'], dur: 2, priority: 3 },
    { title: 'Parking Lot Lighting', skills: ['Electrical'], dur: 1.5, priority: 4 },
    { title: 'Roof Leak Assessment', skills: ['Roofing'], dur: 2, priority: 1 },
    { title: 'Sprinkler System Test', skills: ['Plumbing', 'Fire Safety'], dur: 2.5, priority: 1 },
    { title: 'Boiler Maintenance', skills: ['HVAC', 'Plumbing'], dur: 4, priority: 2 },
    { title: 'Exit Sign Replacement', skills: ['General Maintenance'], dur: 0.5, priority: 4 },
    { title: 'Ceiling Tile Repair', skills: ['General Maintenance'], dur: 1, priority: 4 },
    { title: 'Window Seal Repair', skills: ['General Maintenance'], dur: 1.5, priority: 3 },
    { title: 'Cooling Tower Treatment', skills: ['HVAC'], dur: 3, priority: 2 },
    { title: 'Ductwork Inspection', skills: ['HVAC'], dur: 2, priority: 3 },
    { title: 'Electrical Outlet Repair', skills: ['Electrical'], dur: 1, priority: 3 },
    // Additional unassigned WOs for richer Solvice demo
    { title: 'Fire Extinguisher Inspection', skills: ['Fire Safety'], dur: 1, priority: 2 },
    { title: 'Emergency Generator Test', skills: ['Electrical', 'HVAC'], dur: 3, priority: 1 },
    { title: 'Bathroom Fixture Replacement', skills: ['Plumbing'], dur: 1.5, priority: 3 },
    { title: 'Access Control System Update', skills: ['Locksmith', 'Electrical'], dur: 2, priority: 2 },
  ]

  unassignedTitles.forEach((cfg, i) => {
    const requestedDay = addDays(today, i % 5)
    const startHour = 7 + (i % 6)
    const requestedStart = new Date(requestedDay)
    requestedStart.setHours(startHour, 0, 0, 0)
    const requestedEnd = new Date(requestedDay)
    requestedEnd.setHours(startHour + cfg.dur, 0, 0, 0)
    orders.push({
      recordId: 1050 + i,
      workOrderNumber: `WO-${1050 + i}`,
      title: cfg.title,
      description: `${cfg.title} at ${CUSTOMERS[(i + 5) % CUSTOMERS.length]}`,
      status: 'New',
      priority: cfg.priority,
      scheduledStart: requestedStart.toISOString(),
      scheduledEnd: requestedEnd.toISOString(),
      estDuration: cfg.dur,
      locationAddress: `${200 + i * 15} Commerce Drive, Springfield`,
      locationLat: randomLat(),
      locationLng: randomLng(),
      skillsRequired: cfg.skills,
      assignedTechnicianId: null,
      customer: CUSTOMERS[(i + 5) % CUSTOMERS.length],
      slaDeadline: addDays(today, 2 + Math.floor(Math.random() * 5)).toISOString(),
      costEstimate: Math.round(cfg.dur * (35 + Math.random() * 30)),
      pinned: false,
      aiScheduled: false,
      aiScheduleBatch: null,
      _version: 1,
    })
  })

  return orders
}

export const workOrders = generateWorkOrders()

// Quickbase table metadata (for wizard AI suggestions)
export const qbTables = [
  {
    tableId: 'bqr4x5m3n', name: 'Work Orders', description: 'Service work orders and job tickets',
    fields: [
      { fieldId: 3, name: 'Record ID#', type: 'recordid' },
      { fieldId: 6, name: 'Work Order #', type: 'text' },
      { fieldId: 7, name: 'Title', type: 'text' },
      { fieldId: 8, name: 'Description', type: 'rich-text' },
      { fieldId: 9, name: 'Status', type: 'text-multi-choice', choices: ['New', 'Scheduled', 'In Progress', 'Complete', 'Cancelled'] },
      { fieldId: 10, name: 'Priority', type: 'numeric' },
      { fieldId: 12, name: 'Scheduled Start', type: 'datetime' },
      { fieldId: 13, name: 'Scheduled End', type: 'datetime' },
      { fieldId: 14, name: 'Est. Duration', type: 'duration' },
      { fieldId: 15, name: 'Location Address', type: 'text' },
      { fieldId: 16, name: 'Location Lat', type: 'numeric' },
      { fieldId: 17, name: 'Location Lng', type: 'numeric' },
      { fieldId: 18, name: 'Skills Required', type: 'text-multi-select' },
      { fieldId: 19, name: 'Assigned Technician', type: 'reference', targetTable: 'bqr4x5m4p' },
      { fieldId: 20, name: 'Customer', type: 'text' },
      { fieldId: 21, name: 'SLA Deadline', type: 'datetime' },
      { fieldId: 22, name: 'Cost Estimate', type: 'currency' },
    ],
  },
  {
    tableId: 'bqr4x5m4p', name: 'Technicians', description: 'Field technicians and service workers',
    fields: [
      { fieldId: 3, name: 'Record ID#', type: 'recordid' },
      { fieldId: 6, name: 'Full Name', type: 'text' },
      { fieldId: 7, name: 'Email', type: 'email' },
      { fieldId: 8, name: 'Phone', type: 'phone' },
      { fieldId: 10, name: 'Skills', type: 'text-multi-select' },
      { fieldId: 11, name: 'Hourly Rate', type: 'currency' },
      { fieldId: 12, name: 'Shift Start', type: 'timeofday' },
      { fieldId: 13, name: 'Shift End', type: 'timeofday' },
      { fieldId: 14, name: 'Max Hours/Week', type: 'numeric' },
      { fieldId: 15, name: 'Home Address', type: 'text' },
      { fieldId: 16, name: 'Home Lat', type: 'numeric' },
      { fieldId: 17, name: 'Home Lng', type: 'numeric' },
      { fieldId: 18, name: 'Service Region', type: 'text' },
      { fieldId: 19, name: 'Active', type: 'checkbox' },
    ],
  },
  {
    tableId: 'bqr4x5m5q', name: 'Availability Events', description: 'Time off, vacation, sick days, training',
    fields: [
      { fieldId: 3, name: 'Record ID#', type: 'recordid' },
      { fieldId: 6, name: 'Technician', type: 'reference', targetTable: 'bqr4x5m4p' },
      { fieldId: 7, name: 'Event Type', type: 'text-multi-choice', choices: ['Vacation', 'Sick', 'Personal', 'Training', 'Other'] },
      { fieldId: 8, name: 'Start', type: 'datetime' },
      { fieldId: 9, name: 'End', type: 'datetime' },
      { fieldId: 10, name: 'All Day', type: 'checkbox' },
      { fieldId: 11, name: 'Recurring', type: 'text-multi-choice', choices: ['None', 'Weekly', 'Biweekly', 'Monthly'] },
      { fieldId: 12, name: 'Notes', type: 'text' },
    ],
  },
  // Decoy tables (to test AI table detection)
  {
    tableId: 'bqr4x5m6r', name: 'Customers', description: 'Customer accounts and contacts',
    fields: [
      { fieldId: 3, name: 'Record ID#', type: 'recordid' },
      { fieldId: 6, name: 'Company Name', type: 'text' },
      { fieldId: 7, name: 'Contact Email', type: 'email' },
    ],
  },
  {
    tableId: 'bqr4x5m7s', name: 'Invoices', description: 'Billing and payment records',
    fields: [
      { fieldId: 3, name: 'Record ID#', type: 'recordid' },
      { fieldId: 6, name: 'Invoice #', type: 'text' },
      { fieldId: 7, name: 'Amount', type: 'currency' },
    ],
  },
]
