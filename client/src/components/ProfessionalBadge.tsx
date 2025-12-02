import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import * as Icons from "lucide-react";
import type { ProfessionalRole } from "@shared/schema";

interface ProfessionalBadgeProps {
  role: ProfessionalRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const iconMap: Record<string, keyof typeof Icons> = {
  user: "User",
  sparkles: "Sparkles",
  scissors: "Scissors",
  shirt: "Shirt",
  "book-open": "BookOpen",
  languages: "Languages",
  hand: "Hand",
  pencil: "Pencil",
  paintbrush: "Paintbrush",
  camera: "Camera",
  monitor: "Monitor",
  hammer: "Hammer",
  wrench: "Wrench",
  zap: "Zap",
  droplet: "Droplet",
  package: "Package",
  truck: "Truck",
  car: "Car",
};

export function ProfessionalBadge({ role, size = "md", showIcon = true }: ProfessionalBadgeProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };
  
  const IconComponent = role.icon && iconMap[role.icon] 
    ? (Icons[iconMap[role.icon]] as React.ComponentType<{ size: number; className?: string }>)
    : null;
  
  const name = isArabic ? role.nameAr : role.nameEn;
  
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        backdrop-blur-md border border-white/20
        ${sizeClasses[size]}
      `}
      style={{
        backgroundColor: `${role.colorHex}20`,
        color: role.colorHex,
        borderColor: `${role.colorHex}30`,
      }}
      data-testid={`badge-professional-${role.slug}`}
    >
      {showIcon && IconComponent && (
        <IconComponent size={iconSizes[size]} className="shrink-0" />
      )}
      <span className="whitespace-nowrap">{name}</span>
    </motion.span>
  );
}

interface ProfessionalBadgeListProps {
  roles: (ProfessionalRole | { role: ProfessionalRole })[];
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
}

export function ProfessionalBadgeList({ roles, size = "md", maxDisplay = 3 }: ProfessionalBadgeListProps) {
  const displayRoles = roles.slice(0, maxDisplay);
  const remaining = roles.length - maxDisplay;
  
  const getRoleData = (item: ProfessionalRole | { role: ProfessionalRole }): ProfessionalRole => {
    if ("role" in item) {
      return item.role;
    }
    return item;
  };
  
  return (
    <div className="flex flex-wrap gap-2" data-testid="list-professional-badges">
      {displayRoles.map((item) => {
        const role = getRoleData(item);
        return (
          <ProfessionalBadge key={role.id} role={role} size={size} />
        );
      })}
      {remaining > 0 && (
        <span 
          className={`
            inline-flex items-center justify-center font-medium rounded-full
            bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
            ${size === "sm" ? "px-2 py-0.5 text-[10px]" : size === "md" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"}
          `}
          data-testid="badge-professional-more"
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
