import { useState } from 'react';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  mode: 'date' | 'time';
  title: string;
}

export function DateTimePicker({ isOpen, onClose, onSelect, mode, title }: DateTimePickerProps) {
  const [selected, setSelected] = useState<string>('');

  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        full: d.toISOString(),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const getTimes = () => {
    const times = [];
    for (let i = 8; i <= 20; i++) {
      times.push(`${i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`);
      times.push(`${i > 12 ? i - 12 : i}:30 ${i >= 12 ? 'PM' : 'AM'}`);
    }
    return times;
  };

  const dates = getDates();
  const times = getTimes();

  const handleSelect = (val: string) => {
    setSelected(val);
  };

  const handleConfirm = () => {
    if (selected) onSelect(selected);
    onClose();
    setSelected('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      action={
        <button 
          disabled={!selected}
          onClick={handleConfirm}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
          data-testid="button-confirm-datetime"
        >
          Confirm
        </button>
      }
    >
      <div className="max-h-[40vh] overflow-y-auto no-scrollbar py-2">
        {mode === 'date' ? (
          <div className="grid grid-cols-3 gap-3">
            {dates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(date.label)}
                data-testid={`button-date-${idx}`}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95",
                  selected === date.label 
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/50" 
                    : "border-transparent bg-muted hover:bg-muted/80"
                )}
              >
                <span className="text-xs font-bold uppercase opacity-60">{date.day}</span>
                <span className="text-xl font-black">{date.date}</span>
                {idx < 2 && <span className="text-[10px] font-bold text-primary">{idx === 0 ? 'Today' : 'Tmrw'}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {times.map((time, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(time)}
                data-testid={`button-time-${idx}`}
                className={cn(
                  "p-3 rounded-2xl font-bold text-sm border-2 transition-all active:scale-95",
                  selected === time 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-transparent bg-muted hover:bg-muted/80"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
