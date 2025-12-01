
import React, { useEffect } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useSwipe } from '../hooks/useSwipe';
import { useHaptic } from '../hooks/useHaptic';
import { formatCurrency } from '../utils/helpers';
import { useViewTransitionNavigate } from '../hooks/useViewTransitionNavigate';

interface TaskCardProps {
    task: Task;
    idx: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, idx }) => {
    const navigate = useViewTransitionNavigate(); // Use the new hook
    const { savedTaskIds, toggleSavedTask } = useApp();
    const { showToast } = useToast();
    const { ref, isIntersecting } = useIntersectionObserver({ freezeOnceVisible: true });
    const { trigger } = useHaptic();

    // Swipe Logic
    const { handlers, offset } = useSwipe({
        onSwipeLeft: async () => {
            trigger(10);
            await toggleSavedTask(task.id);
            showToast(!savedTaskIds.includes(task.id) ? "Task saved" : "Removed from saved", "info");
        },
        threshold: 80
    });

    // Data Prefetching Simulation
    useEffect(() => {
        if (isIntersecting) {
            // Preload images
            if (task.images) {
                task.images.forEach(imgSrc => {
                    const img = new Image();
                    img.src = imgSrc;
                });
            }
            if (task.taskerAvatar) {
                const img = new Image();
                img.src = task.taskerAvatar;
            }
        }
    }, [isIntersecting, task]);

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        trigger(5);
        try {
            await toggleSavedTask(task.id);
            showToast(!savedTaskIds.includes(task.id) ? "Task saved" : "Removed from saved", "info");
        } catch (e) {
            showToast("Failed to update. Please try again.", "error");
        }
    };

    // Swipe Styling
    const swipeStyle = {
        transform: `translateX(${offset.x}px)`,
        transition: offset.x === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
    };

    const isSaved = savedTaskIds.includes(task.id);

    return (
        <div className="relative overflow-hidden rounded-[2rem]">
            {/* Swipe Background Layer */}
            <div className="absolute inset-0 bg-surface dark:bg-surface-dark flex items-center justify-end px-8 rounded-[2rem]">
                <div className={`flex items-center gap-2 font-bold transition-all duration-300 ${Math.abs(offset.x) > 50 ? 'opacity-100 scale-110' : 'opacity-50 scale-100'} ${isSaved ? 'text-gray-500' : 'text-primary'}`}>
                    <span className={`material-symbols-outlined ${isSaved ? '' : 'material-symbols-filled'}`}>favorite</span>
                    <span>{isSaved ? 'Unsave' : 'Save'}</span>
                </div>
            </div>

            <div 
                ref={ref as React.RefObject<HTMLDivElement>}
                onClick={() => navigate(`/task/${task.id}`)}
                {...handlers}
                style={{ ...swipeStyle, viewTransitionName: `task-card-${task.id}` }}
                className="bg-white dark:bg-surface-dark shadow-sm overflow-hidden cursor-pointer group p-6 relative transition-shadow duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 active:scale-[0.99] z-10"
            >
                <button 
                    aria-label={isSaved ? "Remove from saved" : "Save task"}
                    onClick={handleToggleSave}
                    className="absolute top-5 end-5 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all z-10 active:scale-75 duration-300"
                >
                    <span className={`material-symbols-outlined text-[22px] transition-all duration-300 ${isSaved ? 'material-symbols-filled text-danger scale-110 animate-pulse-slow' : 'text-gray-400'}`}>favorite</span>
                </button>

                <div className="flex justify-between items-start mb-3 pe-10">
                    <div>
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{task.category}</div>
                        <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark leading-tight">{task.title}</h3>
                    </div>
                </div>
                
                <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-5 line-clamp-2 leading-relaxed">{task.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 text-xs font-bold text-text-secondary dark:text-text-secondary-dark">
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
                            <span className="material-symbols-outlined text-base text-primary">location_on</span>
                            {task.distance}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
                            <span className="material-symbols-outlined text-base text-primary">schedule</span>
                            {task.time}
                        </div>
                    </div>
                    <div className="font-extrabold text-lg text-primary bg-primary/5 px-3 py-1 rounded-lg">
                        {formatCurrency(task.budget)}
                    </div>
                </div>
            </div>
        </div>
    );
};
