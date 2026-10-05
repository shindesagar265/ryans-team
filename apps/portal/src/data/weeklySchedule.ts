export interface WeeklySession {
  location: string;
  start: string;
  end: string;
  level?: 'Beginner' | 'Advanced' | 'Sea Lion Club';
  swimmers: string[];
}

export interface WeeklyScheduleDay {
  day: string;
  sessions: WeeklySession[];
}

export const weeklySchedule: WeeklyScheduleDay[] = [
  {
    day: 'Monday',
    sessions: [
      { location: 'Kowloon Park', start: '18:15', end: '19:15', swimmers: ['Sharvil Soni', 'Vladimir', 'Avi'] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', level: 'Advanced', swimmers: ['Kishan', 'Vladimir'] },
      { location: 'Kowloon Park', start: '19:30', end: '20:30', level: 'Advanced', swimmers: ['Kishan'] },
    ],
  },
  {
    day: 'Tuesday',
    sessions: [
      { location: 'Kowloon Park', start: '18:15', end: '19:15', swimmers: [] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', swimmers: ['Arasu'] },
      { location: 'Kowloon Park', start: '19:30', end: '20:30', swimmers: [] },
    ],
  },
  {
    day: 'Wednesday',
    sessions: [
      { location: 'Kowloon Park', start: '15:30', end: '16:30', level: 'Beginner', swimmers: ['Avi'] },
      { location: 'Kowloon Park', start: '18:15', end: '19:15', level: 'Beginner', swimmers: ['Peggy 媽'] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', level: 'Advanced', swimmers: ['Joey中醫'] },
    ],
  },
  {
    day: 'Thursday',
    sessions: [
      { location: 'Kowloon Station', start: '16:15', end: '17:15', swimmers: ['Angel', 'Henry', 'Sam'] },
      { location: 'Kowloon Park', start: '18:30', end: '19:30', swimmers: [] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', level: 'Advanced', swimmers: ['Kishan', 'Grace'] },
    ],
  },
  {
    day: 'Friday',
    sessions: [
      { location: 'Kowloon Park', start: '15:30', end: '16:30', swimmers: ['Avi'] },
      { location: 'Kowloon Park', start: '18:15', end: '19:15', level: 'Beginner', swimmers: ['Nysa'] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', swimmers: ['Rida', 'Ashmit', 'Chris Yau', 'Malathi'] },
    ],
  },
  {
    day: 'Saturday',
    sessions: [
      { location: 'Tuen Mun North West', start: '10:30', end: '11:30', level: 'Sea Lion Club', swimmers: ['Ayaan Ahmed 艾恩', 'Farhaan Ahmed 范恒', 'Mohammad Alyssa'] },
      { location: 'Kowloon Park', start: '13:30', end: '14:30', swimmers: ['Axzel Lhian', 'Yuven'] },
      { location: 'Kowloon Park', start: '14:30', end: '16:00', level: 'Advanced', swimmers: ['麥兆豐', '俊橋', '祥溢', '玥頤', '銘心', '承亨', '黃柏翰 Hank'] },
      { location: 'Kowloon Park', start: '15:30', end: '17:00', level: 'Advanced', swimmers: ['家睿', '家霖', '森森', '晞晨'] },
      { location: 'Kowloon Park', start: '18:15', end: '19:15', swimmers: ['Arasu', 'Peggy 媽'] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', swimmers: [] },
    ],
  },
  {
    day: 'Sunday',
    sessions: [
      { location: 'Tuen Mun North West', start: '10:30', end: '11:30', level: 'Sea Lion Club', swimmers: ['王皓鋐 Kaden'] },
      { location: 'Kowloon Park', start: '13:30', end: '14:30', swimmers: ['Yousef Azab', 'Ammar Azab', 'Ammar (Mugeesh)'] },
      { location: 'Kowloon Park', start: '18:15', end: '19:15', level: 'Beginner', swimmers: ['Chris Yau', 'Daisy', 'Siti', 'Abdelrahman'] },
      { location: 'Kowloon Park', start: '19:00', end: '20:00', level: 'Beginner', swimmers: [] },
    ],
  },
];
