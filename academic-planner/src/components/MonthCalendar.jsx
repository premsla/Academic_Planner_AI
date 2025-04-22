import React from 'react';

function MonthCalendar({ month, year, tasks = [], today = new Date(), onDayClick }) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();
  if (startDay === 0) startDay = 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  let grid = [];
  let dayNum = 1;
  let nextMonthDay = 1;
  for (let week = 0; week < 6; week++) {
    let row = [];
    for (let d = 1; d <= 7; d++) {
      let cellDate, isCurrentMonth = false, isToday = false, isFaded = false, displayNumber = '';
      if (week === 0 && d < startDay) {
        cellDate = new Date(year, month - 1, prevMonthDays - (startDay - d - 1));
        isFaded = true;
        displayNumber = cellDate.getDate();
      } else if (dayNum > daysInMonth) {
        cellDate = new Date(year, month + 1, nextMonthDay++);
        isFaded = true;
        displayNumber = cellDate.getDate();
      } else {
        cellDate = new Date(year, month, dayNum);
        isCurrentMonth = true;
        isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
        displayNumber = dayNum;
        dayNum++;
      }
      let showNumber = '';
      if (isCurrentMonth) {
        showNumber = displayNumber;
      } else if (isFaded && ((week === 0) || (week >= 4 && dayNum > daysInMonth + 1))) {
        showNumber = displayNumber;
      }
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const td = new Date(t.dueDate);
        return td.getFullYear() === cellDate.getFullYear() && td.getMonth() === cellDate.getMonth() && td.getDate() === cellDate.getDate();
      });
      // Priority color logic
      const priorityColors = {
        high: { bg: '#ffe3e3', border: '#ff6b6b', text: '#d7263d' },
        medium: { bg: '#fff4e3', border: '#ffb347', text: '#b97a00' },
        low: { bg: '#e3ffe9', border: '#38c172', text: '#227a4c' },
        none: { bg: '#e3f0ff', border: '#1565d8', text: '#1565d8' },
      };
      row.push(
        <td
          key={d + '-' + week}
          style={{
            verticalAlign: 'top',
            background: isToday ? '#e6f6ff' : '#fff',
            borderRadius: 14,
            border: isToday ? '2px solid #1565d8' : '1px solid #e3eaf1',
            minWidth: 90, maxWidth: 110, height: 80, padding: 6,
            opacity: isFaded ? 0.45 : 1,
            position: 'relative',
            transition: 'border 0.2s',
            cursor: isCurrentMonth ? 'pointer' : 'default',
            boxShadow: isToday ? '0 2px 8px 0 #b3d7fa' : '0 1px 3px 0 rgba(31,38,135,0.06)',
          }}
          onClick={isCurrentMonth && onDayClick ? () => onDayClick(cellDate) : undefined}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: isToday ? '#1565d8' : '#3a3a3a', marginBottom: 2 }}>{showNumber}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {dayTasks.slice(0, 3).map((task, i) => {
              let prio = (task.priority || '').toLowerCase();
              if (!['high', 'medium', 'low'].includes(prio)) prio = 'none';
              const color = priorityColors[prio];
              return (
                <div key={task._id || task.id || i} style={{
                  background: color.bg,
                  color: color.text,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '2px 6px',
                  marginBottom: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  borderLeft: `4px solid ${color.border}`,
                  boxShadow: '0 1px 3px 0 rgba(21,101,216,0.07)',
                  display: 'flex', alignItems: 'center',
                  gap: 4,
                }}>
                  {task.title}
                  {task.priority && (
                    <span style={{
                      fontSize: 10,
                      color: color.text,
                      fontWeight: 700,
                      marginLeft: 5,
                      background: '#fff6',
                      borderRadius: 5,
                      padding: '0 5px',
                      border: `1px solid ${color.border}`,
                    }}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                  )}
                  {task.startTime ? <span style={{ color: '#888', fontWeight: 400, fontSize: 11, marginLeft: 3 }}>({task.startTime})</span> : ''}
                </div>
              );
            })}
            {dayTasks.length > 3 && (
              <span style={{ fontSize: 11, color: '#888' }}>+{dayTasks.length - 3} more</span>
            )}
          </div>
        </td>
      );
    }
    grid.push(<tr key={`row-${week}`}>{row}</tr>);
  }
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.06)', padding: 10, marginBottom: 8, border: '1px solid #e3eaf1' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 8 }}>
        <thead>
          <tr>
            {weekDays.map(day => <th key={day} style={{ padding: 6, color: '#a1a1a1', fontWeight: 700, fontSize: 15, background: '#f7fafd', borderRadius: 8 }}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {grid}
        </tbody>
      </table>
    </div>
  );
}

export default MonthCalendar;
