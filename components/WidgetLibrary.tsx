"use client";

import { useDraggable } from '@dnd-kit/core';
import { WidgetType } from '@/types/form';
import {
  Type,
  FileText,
  History,
  Calendar,
  Clock,
  Hash,
  DollarSign,
  CheckSquare,
  List,
  ListOrdered,
  Upload,
  User,
  Zap,
  StickyNote,
} from 'lucide-react';

interface WidgetConfig {
  type: WidgetType;
  label: string;
  icon: React.ElementType;
}

const widgetConfigs: WidgetConfig[] = [
  { type: WidgetType.TEXT_SINGLE_LINE, label: 'Single Line Text', icon: Type },
  { type: WidgetType.TEXT_MULTI_LINE, label: 'Multi Line Text', icon: FileText },
  { type: WidgetType.TEXT_WITH_HISTORY, label: 'Text with History', icon: History },
  { type: WidgetType.DATE, label: 'Date', icon: Calendar },
  { type: WidgetType.TIME, label: 'Time', icon: Clock },
  { type: WidgetType.NUMBER, label: 'Number', icon: Hash },
  { type: WidgetType.DECIMAL, label: 'Decimal', icon: DollarSign },
  { type: WidgetType.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
  { type: WidgetType.RADIO_BUTTON_LIST, label: 'Radio Button List', icon: ListOrdered },
  { type: WidgetType.DROPDOWN_LIST, label: 'Dropdown List', icon: List },
  { type: WidgetType.FILE_UPLOAD, label: 'File Upload', icon: Upload },
  { type: WidgetType.SELECT_STAFF, label: 'Select Staff', icon: User },
];

const specialWidgetConfigs: WidgetConfig[] = [
  { type: WidgetType.ACTION_BUTTON, label: 'Action Button', icon: Zap },
  { type: WidgetType.INSTRUCTION_NOTE, label: 'Instruction Note', icon: StickyNote },
];

interface DraggableWidgetProps {
  config: WidgetConfig;
}

function DraggableWidget({ config }: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: config.type,
    data: { type: config.type, label: config.label },
  });

  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-1.5 p-1.5 mb-1 bg-white border border-gray-300 rounded cursor-grab active:cursor-grabbing
        hover:bg-blue-50 hover:border-blue-400
        transition-all duration-150
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <Icon className="w-3 h-3 text-gray-600" />
      <span className="text-xs font-medium text-gray-700">{config.label}</span>
    </div>
  );
}

export default function WidgetLibrary() {
  return (
    <div className="fixed left-0 top-16 w-48 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-300 p-2 overflow-y-auto z-10">
      <h3 className="text-xs font-bold text-gray-700 mb-2 px-1">WIDGETS</h3>
      <div className="space-y-0">
        {widgetConfigs.map((config) => (
          <DraggableWidget key={config.type} config={config} />
        ))}
      </div>
      
      {/* Special Widgets Section */}
      <div className="border-t border-gray-400 my-2 pt-2">
        <div className="text-[10px] font-semibold text-gray-600 mb-1 px-1">ACTIONS</div>
        <div className="space-y-0">
          {specialWidgetConfigs.map((config) => (
            <DraggableWidget key={config.type} config={config} />
          ))}
        </div>
      </div>
    </div>
  );
}
