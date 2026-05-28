'use client';

import {
  UtensilsCrossed,
  Car,
  Home,
  Gamepad2,
  Heart,
  GraduationCap,
  Shirt,
  Wifi,
  MoreHorizontal,
  Banknote,
  Laptop,
  TrendingUp,
  Tag,
  DollarSign,
  Wallet,
  Target,
  Sparkles,
  PartyPopper,
  Crown,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  UtensilsCrossed,
  Car,
  Home,
  Gamepad2,
  Heart,
  GraduationCap,
  Shirt,
  Wifi,
  MoreHorizontal,
  Banknote,
  Laptop,
  TrendingUp,
  Tag,
  DollarSign,
  Wallet,
  Target,
  Sparkles,
  PartyPopper,
  Crown,
};

export function DynamicIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const IconComponent = iconMap[name] || Tag;
  return <IconComponent {...props} />;
}
