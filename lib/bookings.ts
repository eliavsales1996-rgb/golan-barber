// src/lib/bookings.ts

export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export type Booking = {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  service: string;
  status: AppointmentStatus;
  createdAt: string;
};

export const SERVICES = [
  { id: 'haircut', name: 'תספורת פרימיום', duration: 45 },
  { id: 'beard', name: 'עיצוב זקן', duration: 30 },
  { id: 'combo', name: 'קומבו (תספורת + זקן)', duration: 60 },
];

let bookings: Booking[] = [];

export const getBookings = () => [...bookings];

export const addBooking = (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
  const newBooking: Booking = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  return newBooking;
};

export const updateBookingStatus = (id: string, status: AppointmentStatus) => {
  const booking = bookings.find(b => b.id === id);
  if (booking) booking.status = status;
};

export const getAvailableSlots = (date: string) => {
  const interval = 45;
  const slots = [];
  let current = new Date(`${date}T08:00:00`);
  const end = new Date(`${date}T20:00:00`);

  while (current < end) {
    const hours = current.getHours().toString().padStart(2, '0');
    const minutes = current.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    const existing = bookings.find(b => b.date === date && b.time === timeStr && b.status !== 'CANCELLED');
    
    slots.push({
      time: timeStr,
      available: !existing,
    });
    
    current = new Date(current.getTime() + interval * 60000);
  }
  
  return slots;
};
