import {
  Circle, Clock, Cloud, FileText, Globe, History,
  Laptop, LayoutDashboard, Package, Receipt, Search,
  Settings, Shield, ShoppingCart, Smartphone,
  TabletSmartphone, Users, Wallet, XCircle, Zap,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Circle, Clock, Cloud, FileText, Globe, History,
  Laptop, LayoutDashboard, Package, Receipt, Search,
  Settings, Shield, ShoppingCart, Smartphone,
  TabletSmartphone, Users, Wallet, XCircle, Zap,
};

type DynamicIconProps = {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
};

export function DynamicIcon({ name, className, size = 18, style }: DynamicIconProps) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) {
    return <Circle className={className} size={size} style={style} />;
  }
  return <IconComponent className={className} size={size} style={style} />;
}
