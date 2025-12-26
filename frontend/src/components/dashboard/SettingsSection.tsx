import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function SettingsSection({ title, icon: Icon, children }: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 border-b bg-gray-50/50">
        <Icon className="h-5 w-5 text-gray-500" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
