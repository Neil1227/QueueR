import React from 'react';
import { CardCategory } from '@/lib/schema';
import { User, Store, PiggyBank, Briefcase, Tag, Layers, LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  category?: CardCategory | 'all' | string | null;
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  switch (category) {
    case 'all':
      return <Layers {...props} />;
    case 'business':
      return <Store {...props} />;
    case 'savings':
      return <PiggyBank {...props} />;
    case 'freelance':
      return <Briefcase {...props} />;
    case 'other':
      return <Tag {...props} />;
    case 'personal':
    default:
      return <User {...props} />;
  }
}
