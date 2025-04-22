import React from 'react';
import MonthCalendar from './MonthCalendar';

function YearCalendar({ year, tasks = [], today = new Date(), onDayClick }) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Arrange months in a 4x3 grid (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
  const rows = [
    months.slice(0, 3),
    months.slice(3, 6),
    months.slice(6, 9),
    months.slice(9, 12),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 22 }}>
          {row.map(month => (
            <div key={month} style={{ flex: 1, background: '#f5faff', borderRadius: 16, boxShadow: '0 1px 4px 0 #e3eaf1', padding: 6 }}>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 17, margin: '8px 0', color: '#1565d8', letterSpacing: 1 }}>
                {new Date(year, month).toLocaleString('default', { month: 'long' })}
              </div>
              <MonthCalendar
                month={month}
                year={year}
                tasks={tasks}
                today={today}
                onDayClick={onDayClick}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default YearCalendar;
