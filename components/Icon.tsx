import React from 'react';

// FIX: Define a more specific type for the icons object from window.lucide.
// This ensures that `icons` is understood as a map of string keys to React components,
// which resolves two major issues:
// 1. It allows `LucideIcon` to be correctly identified as a JSX-compatible component.
// 2. It prevents `keyof typeof icons` from being inferred as `never`, which was causing
//    type errors in all components that use the `Icon` component.
const { icons }: { icons: Record<string, React.ComponentType<any>> } = window.lucide || { icons: {} };

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: string;
  color?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, color, size, className, ...props }) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    console.warn(`Icon '${String(name)}' not found.`);
    return null;
  }

  return (
    <LucideIcon color={color} size={size} className={className} {...props} />
  );
};

export default Icon;