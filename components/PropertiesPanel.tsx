"use client";

import { FormWidget, WidgetType } from '@/types/form';
import { Trash2 } from 'lucide-react';

// Map widget types to 3-letter prefixes
const getWidgetPrefix = (type: WidgetType): string => {
  const prefixMap: Record<WidgetType, string> = {
    [WidgetType.TEXT_SINGLE_LINE]: 'slt',
    [WidgetType.TEXT_MULTI_LINE]: 'mlt',
    [WidgetType.TEXT_WITH_HISTORY]: 'twh',
    [WidgetType.DATE]: 'dat',
    [WidgetType.TIME]: 'tim',
    [WidgetType.NUMBER]: 'num',
    [WidgetType.DECIMAL]: 'dec',
    [WidgetType.CHECKBOX]: 'chk',
    [WidgetType.RADIO_BUTTON_LIST]: 'rbl',
    [WidgetType.DROPDOWN_LIST]: 'ddl',
    [WidgetType.FILE_UPLOAD]: 'fup',
    [WidgetType.SELECT_STAFF]: 'sst',
    [WidgetType.ACTION_BUTTON]: 'btn',
    [WidgetType.INSTRUCTION_NOTE]: 'note',
  };
  return prefixMap[type] || 'wdg';
};

const generateFieldName = (type: WidgetType, label: string): string => {
  const prefix = getWidgetPrefix(type);
  // Remove all punctuation and special characters, replace spaces with underscores
  const sanitized = label.trim()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();
  
  const fieldName = sanitized ? `${prefix}_${sanitized}` : prefix;
  
  // Enforce 30 character max
  return fieldName.substring(0, 30);
};

interface PropertiesPanelProps {
  selectedWidget: FormWidget | null;
  sections: any[];
  onUpdate: (updates: Partial<FormWidget>) => void;
  onDelete: () => void;
  selectedSectionId?: string | null;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

export default function PropertiesPanel({
  selectedWidget,
  sections,
  onUpdate,
  onDelete,
  selectedSectionId,
  onSectionUpdate,
  isVisible = true,
  onToggle,
}: PropertiesPanelProps) {
  // If panel is hidden, show toggle button
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-2 py-3 rounded-l-lg shadow-lg hover:bg-blue-700 z-20"
        title="Show Properties Panel"
      >
        <span className="text-xs font-medium">›</span>
      </button>
    );
  }

  // Get selected section if editing section
  const selectedSection = selectedSectionId 
    ? sections.find(s => s.id === selectedSectionId) 
    : null;

  // If section is selected and no widget is selected, show section properties
  if (selectedSection && !selectedWidget) {
    return (
      <div className="fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Section Properties</h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide Properties Panel"
            >
              <span className="text-xl">×</span>
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={selectedSection.title}
              onChange={(e) => onSectionUpdate?.(selectedSection.id, { title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Columns
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={selectedSection.cols}
              onChange={(e) => onSectionUpdate?.(selectedSection.id, { cols: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total columns available in this section (widgets must add up to this number)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if field name is duplicate
  const isDuplicateFieldName = (fieldName: string): boolean => {
    if (!selectedWidget || !fieldName.trim()) return false;
    
    const allWidgets = sections.flatMap(s => s.rows).flatMap(r => r.widgets);
    return allWidgets.some(w => 
      w.id !== selectedWidget.id && w.fieldName === fieldName
    );
  };

  if (!selectedWidget) {
    return (
      <div className="fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide Properties Panel"
            >
              <span className="text-xl">×</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-center">
            Select a widget to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const properties = selectedWidget.properties || {};

  const updateProperty = (key: string, value: any) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value,
      },
    });
  };

  const renderTypeSpecificProperties = () => {
    switch (selectedWidget.type) {
      case WidgetType.DROPDOWN_LIST:
      case WidgetType.RADIO_BUTTON_LIST:
        const options = properties.options || ['Option 1'];
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>
            {options.map((option: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    updateProperty('options', newOptions);
                  }}
                  maxLength={30}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => {
                    const newOptions = options.filter((_: string, i: number) => i !== index);
                    updateProperty('options', newOptions);
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  disabled={options.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateProperty('options', [...options, `Option ${options.length + 1}`]);
              }}
              className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              + Add Option
            </button>
          </div>
        );

      case WidgetType.TEXT_SINGLE_LINE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={properties.placeholder || ''}
                onChange={(e) => updateProperty('placeholder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Enter placeholder text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={properties.maxLength || ''}
                onChange={(e) => updateProperty('maxLength', parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Leave empty for no limit"
              />
            </div>
          </div>
        );

      case WidgetType.TEXT_MULTI_LINE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rows
              </label>
              <input
                type="number"
                value={properties.rows || 3}
                onChange={(e) => updateProperty('rows', parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={properties.maxLength || ''}
                onChange={(e) => updateProperty('maxLength', parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Leave empty for no limit"
              />
            </div>
          </div>
        );

      case WidgetType.NUMBER:
      case WidgetType.DECIMAL:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Value
              </label>
              <input
                type="number"
                value={properties.min || ''}
                onChange={(e) => updateProperty('min', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="No minimum"
                step={selectedWidget.type === WidgetType.DECIMAL ? '0.01' : '1'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Value
              </label>
              <input
                type="number"
                value={properties.max || ''}
                onChange={(e) => updateProperty('max', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                placeholder="No maximum"
                step={selectedWidget.type === WidgetType.DECIMAL ? '0.01' : '1'}
              />
            </div>
          </div>
        );

      case WidgetType.DATE:
        return (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Date picker will be available in the rendered form
            </p>
          </div>
        );

      case WidgetType.ACTION_BUTTON:
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Action Description
            </label>
            <textarea
              value={properties.actionDescription || ''}
              onChange={(e) => updateProperty('actionDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              rows={6}
              placeholder="Describe what this button should do in plain language...&#10;&#10;Example: 'When clicked, show 3 additional name fields'"
            />
            <p className="text-xs text-gray-600 mt-1">
              Explain what should happen when this button is clicked. This will be used to generate JavaScript.
            </p>
          </div>
        );

      case WidgetType.INSTRUCTION_NOTE:
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Developer Instructions
            </label>
            <textarea
              value={properties.instructions || ''}
              onChange={(e) => updateProperty('instructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              rows={8}
              placeholder="Add instructions for the developer...&#10;&#10;Example: 'Only show fields X, Y, Z when checkbox A is checked'"
            />
            <p className="text-xs text-gray-600 mt-1">
              These instructions will be included in comments in the JavaScript file. Not included in XML.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto z-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Hide Properties Panel"
          >
            <span className="text-xl">×</span>
          </button>
        )}
      </div>

      {/* Preview Notice */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> This is a designer preview. Widgets will be fully functional in the live CareNotes form.
        </p>
      </div>

      <div className="space-y-4">
        {/* Widget Type Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Widget Type
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
            {selectedWidget.type.replace(/_/g, ' ')}
          </div>
          {selectedWidget.type === WidgetType.CHECKBOX && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> To create a checkbox group (multiple checkboxes like "Morning", "Afternoon", "Evening"), 
                add multiple checkbox widgets to the same row. Each checkbox needs its own unique field name.
              </p>
            </div>
          )}
          {selectedWidget.type === WidgetType.NUMBER && (
            <p className="text-sm text-gray-600 italic mt-2">
              Use for whole numbers only (e.g., age, count, quantity)
            </p>
          )}
          {selectedWidget.type === WidgetType.DECIMAL && (
            <p className="text-sm text-gray-600 italic mt-2">
              Use for numbers with decimal points (e.g., weight, height, measurements)
            </p>
          )}
        </div>

        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={selectedWidget.label}
            onChange={(e) => {
              const newLabel = e.target.value;
              onUpdate({ 
                label: newLabel,
                fieldName: generateFieldName(selectedWidget.type, newLabel)
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter label"
          />
          {selectedWidget.type === WidgetType.CHECKBOX && (
            <p className="text-xs text-gray-600 mt-1">
              Main question/prompt (shown with blue background when not hidden)
            </p>
          )}
        </div>

        {/* Checkbox Label for CHECKBOX widgets */}
        {selectedWidget.type === WidgetType.CHECKBOX && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Checkbox Label
            </label>
            <input
              type="text"
              value={properties.checkboxLabel || ''}
              onChange={(e) => updateProperty('checkboxLabel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              placeholder="Text next to checkbox (e.g., 'Morning 07:00-10:30')"
              maxLength={50}
            />
            <p className="text-xs text-gray-600 mt-1">
              This text appears next to the checkbox. Leave blank to use the main label.
            </p>
          </div>
        )}

        {/* Field Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name
          </label>
          <input
            type="text"
            value={selectedWidget.fieldName}
            onChange={(e) => onUpdate({ fieldName: e.target.value })}
            maxLength={30}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
              isDuplicateFieldName(selectedWidget.fieldName)
                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Auto-generated from label"
          />
          {isDuplicateFieldName(selectedWidget.fieldName) ? (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠ Duplicate field name - must be unique
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Max 30 characters - Auto-generated but can be customized
            </p>
          )}
        </div>

        {/* Required Checkbox - Hide for special action widgets */}
        {selectedWidget.type !== WidgetType.ACTION_BUTTON && 
         selectedWidget.type !== WidgetType.INSTRUCTION_NOTE && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required-checkbox"
              checked={selectedWidget.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="required-checkbox" className="text-sm font-medium text-gray-700">
              Required field
            </label>
          </div>
        )}

        {/* Hide Label Checkbox - Hide for special action widgets */}
        {selectedWidget.type !== WidgetType.ACTION_BUTTON && 
         selectedWidget.type !== WidgetType.INSTRUCTION_NOTE && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hide-label-checkbox"
              checked={properties.hideLabel || false}
              onChange={(e) => updateProperty('hideLabel', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="hide-label-checkbox" className="text-sm font-medium text-gray-700">
              Hide Label
            </label>
          </div>
        )}

        {/* Group Name for CHECKBOX widgets */}
        {selectedWidget.type === WidgetType.CHECKBOX && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Group Name (optional)
            </label>
            <input
              type="text"
              value={properties.groupName || ''}
              onChange={(e) => updateProperty('groupName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              placeholder="e.g., grp_mealTime"
              maxLength={30}
            />
            <p className="text-xs text-gray-600 mt-1">
              Checkboxes with the same group name are treated as related options
            </p>
          </div>
        )}

        {/* Type-Specific Properties */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Additional Properties
          </h3>
          {renderTypeSpecificProperties()}
        </div>

        {/* Delete Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete this ${selectedWidget.type.replace(/_/g, ' ').toLowerCase()} widget?\n\nLabel: "${selectedWidget.label}"\nField Name: "${selectedWidget.fieldName}"\n\nThis action cannot be undone.`)) {
                onDelete();
              }
            }}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Widget
          </button>
        </div>
      </div>
    </div>
  );
}
