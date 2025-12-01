import { cn } from '@/lib/utils';
import { TASK_CATEGORIES, type TaskCategory } from '@shared/schema';

interface CategoryPickerProps {
  selected: string | null;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<TaskCategory, string> = {
  'Cleaning': 'cleaning_services',
  'Moving': 'local_shipping',
  'Delivery': 'delivery_dining',
  'Handyman': 'handyman',
  'Assembly': 'build',
  'Gardening': 'yard',
  'Painting': 'format_paint',
  'Errands': 'directions_run',
  'Pet Care': 'pets',
  'Tech Help': 'computer',
  'Other': 'more_horiz',
};

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TASK_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95",
            selected === category
              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/50"
              : "border-transparent bg-muted hover:bg-muted/80"
          )}
        >
          <span className="material-symbols-outlined text-2xl mb-2">
            {categoryIcons[category]}
          </span>
          <span className="text-xs font-bold">{category}</span>
        </button>
      ))}
    </div>
  );
}
