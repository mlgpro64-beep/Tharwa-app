import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { TaskerAvailability } from "@shared/schema";

interface AvailabilityCalendarProps {
  userId: string;
  isEditable?: boolean;
  onDateSelect?: (date: string, status: "available" | "busy") => void;
}

export function AvailabilityCalendar({ userId, isEditable = false, onDateSelect }: AvailabilityCalendarProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const locale = isArabic ? ar : enUS;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");
  
  const { data: availability = [], isLoading } = useQuery<TaskerAvailability[]>({
    queryKey: ["/api/users", userId, "availability", startDate, endDate],
    queryFn: () => 
      fetch(`/api/users/${userId}/availability?startDate=${startDate}&endDate=${endDate}`)
        .then(res => res.json()),
  });
  
  const setAvailabilityMutation = useMutation({
    mutationFn: async (data: { date: string; status: "available" | "busy" }) => {
      return apiRequest("/api/availability", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "availability"] });
    },
  });
  
  const availabilityMap = useMemo(() => {
    const map = new Map<string, "available" | "busy">();
    availability.forEach(a => {
      map.set(a.date, a.status);
    });
    return map;
  }, [availability]);
  
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const startDayOfWeek = monthStart.getDay();
    const paddingDays = Array(startDayOfWeek).fill(null);
    
    return [...paddingDays, ...allDays];
  }, [currentMonth]);
  
  const weekDays = isArabic 
    ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (date: Date) => {
    if (isEditable) {
      setSelectedDate(date);
    } else {
      // If not editable (viewing as client), call onDateSelect callback
      const dateStr = format(date, "yyyy-MM-dd");
      const status = getDateStatus(date);
      onDateSelect?.(dateStr, status || "available");
    }
  };
  
  const handleSetAvailability = (status: "available" | "busy") => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setAvailabilityMutation.mutate({ date: dateStr, status });
    onDateSelect?.(dateStr, status);
    setSelectedDate(null);
  };
  
  const getDateStatus = (date: Date): "available" | "busy" | null => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availabilityMap.get(dateStr) || null;
  };
  
  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 p-4 sm:p-6" data-testid="calendar-availability">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="rounded-xl"
          data-testid="button-prev-month"
        >
          <ChevronLeft className={`w-5 h-5 ${isArabic ? "rotate-180" : ""}`} />
        </Button>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy", { locale })}
        </h3>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="rounded-xl"
          data-testid="button-next-month"
        >
          <ChevronRight className={`w-5 h-5 ${isArabic ? "rotate-180" : ""}`} />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const status = getDateStatus(day);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <motion.button
              key={day.toISOString()}
              whileTap={isEditable && !isPast ? { scale: 0.95 } : undefined}
              onClick={() => !isPast && handleDateClick(day)}
              disabled={isPast}
              className={`
                aspect-square rounded-xl flex items-center justify-center text-sm font-medium
                transition-all duration-200 relative
                ${isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                ${isToday(day) ? "font-bold" : ""}
                ${status === "available" 
                  ? "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30" 
                  : status === "busy" 
                    ? "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30"
                    : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"}
              `}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              {format(day, "d")}
              {status && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  status === "available" ? "bg-green-500" : "bg-red-500"
                }`} />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <AnimatePresence>
        {selectedDate && isEditable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-gray-100/80 dark:bg-white/5 rounded-2xl backdrop-blur-md"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
              {format(selectedDate, "EEEE, d MMMM", { locale })}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSetAvailability("available")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                disabled={setAvailabilityMutation.isPending}
                data-testid="button-set-available"
              >
                <Check className="w-4 h-4 mr-2" />
                {t("availability.available", "Available")}
              </Button>
              <Button
                onClick={() => handleSetAvailability("busy")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                disabled={setAvailabilityMutation.isPending}
                data-testid="button-set-busy"
              >
                <X className="w-4 h-4 mr-2" />
                {t("availability.busy", "Busy")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{t("availability.available", "Available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">{t("availability.busy", "Busy")}</span>
        </div>
      </div>
    </div>
  );
}

interface AvailabilityBadgeProps {
  userId: string;
  date?: string;
}

export function AvailabilityBadge({ userId, date }: AvailabilityBadgeProps) {
  const { t } = useTranslation();
  const targetDate = date || format(new Date(), "yyyy-MM-dd");
  
  const { data: availability = [] } = useQuery<TaskerAvailability[]>({
    queryKey: ["/api/users", userId, "availability", targetDate, targetDate],
    queryFn: () => 
      fetch(`/api/users/${userId}/availability?startDate=${targetDate}&endDate=${targetDate}`)
        .then(res => res.json()),
  });
  
  const status = availability.find(a => a.date === targetDate)?.status;
  
  if (!status) return null;
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full
        ${status === "available" 
          ? "bg-green-500/20 text-green-700 dark:text-green-400" 
          : "bg-red-500/20 text-red-700 dark:text-red-400"}
      `}
      data-testid="badge-availability"
    >
      <Calendar className="w-3 h-3" />
      {status === "available" 
        ? t("availability.available", "Available") 
        : t("availability.busy", "Busy")}
    </span>
  );
}
