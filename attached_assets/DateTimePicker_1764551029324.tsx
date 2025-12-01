
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useHaptic } from '../hooks/useHaptic';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  mode: 'date' | 'time';
  title: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ isOpen, onClose, onSelect, mode, title }) => {
  const { trigger } = useHaptic();
  const [selected, setSelected] = useState<string>('');

  // Mock Data for Date Generation
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

  // Mock Data for Time Generation
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
      trigger(5);
      setSelected(val);
  };

  const handleConfirm = () => {
      trigger(10);
      if (selected) onSelect(selected);
      onClose();
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
                className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
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
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                                selected === date.label 
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/50' 
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
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
                            className={`p-3 rounded-2xl font-bold text-sm border-2 transition-all active:scale-95 ${
                                selected === time 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </Modal>
  );
};
