"use client";

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormSection, FormRow, FormWidget, WidgetType } from '@/types/form';
import { GripVertical, Plus, Minus, StickyNote } from 'lucide-react';

interface FormCanvasProps {
  sections: FormSection[];
  onAddSection: () => void;
  onAddRow: (sectionId: string) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<FormSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onRowDelete: (sectionId: string, rowId: string) => void;
  onWidgetSelect: (widgetId: string) => void;
  onWidgetUpdate: (updates: Partial<FormWidget>, widgetId?: string) => void;
  selectedSectionId: string | null;
  selectedRowId: string | null;
  selectedWidgetId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onRowSelect: (rowId: string | null) => void;
}

interface SortableWidgetProps {
  widget: FormWidget;
  isSelected: boolean;
  onSelect: () => void;
  onColspanChange: (delta: number) => void;
  maxCols: number;
}

interface RowDropZoneProps {
  row: FormRow;
  rowIndex: number;
  sectionId: string;
  sectionCols: number;
  isSelected: boolean;
  selectedWidgetId: string | null;
  onRowSelect: (rowId: string | null) => void;
  onRowDelete: (sectionId: string, rowId: string) => void;
  onWidgetSelect: (widgetId: string) => void;
  handleColspanChange: (widgetId: string, delta: number, maxCols: number) => void;
}

interface SectionDropZoneProps {
  section: FormSection;
  isSelected: boolean;
  selectedRowId: string | null;
  selectedWidgetId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<FormSection>) => void;
  onRowSelect: (rowId: string | null) => void;
  onWidgetSelect: (widgetId: string) => void;
  onAddRow: (sectionId: string) => void;
  onRowDelete: (sectionId: string, rowId: string) => void;
  handleColspanChange: (widgetId: string, delta: number, maxCols: number) => void;
}

function SectionDropZone({ section, isSelected, selectedRowId, selectedWidgetId, onSectionSelect, onSectionDelete, onSectionUpdate, onRowSelect, onWidgetSelect, onAddRow, onRowDelete, handleColspanChange }: SectionDropZoneProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { sectionId: section.id }
  });

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== section.title) {
      onSectionUpdate(section.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(section.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        mb-4
        ${isSelected ? 'outline outline-2 outline-blue-500' : ''}
        ${isOver ? 'outline outline-2 outline-blue-400' : ''}
      `}
      onClick={() => onSectionSelect(section.id)}
    >
      {/* Section Header Tab */}
      <div className="inline-flex items-center gap-6 bg-blue-800 px-4 py-2 text-white font-semibold text-sm">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setEditedTitle(section.title);
                setIsEditingTitle(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold bg-blue-900 text-white border border-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white"
            autoFocus
          />
        ) : (
          <h2 
            className="text-sm font-semibold text-white cursor-pointer hover:text-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
          >
            {section.title} <span className="text-xs opacity-75">({section.cols} cols)</span>
          </h2>
        )}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRow(section.id);
            }}
            className="h-5 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Add Row
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete ${section.title}?`)) {
                onSectionDelete(section.id);
              }
            }}
            className="w-5 h-5 flex items-center justify-center text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            −
          </button>
        </div>
      </div>

      {/* Section Content Area */}
      <div className="border border-gray-300 bg-white p-3">
        {section.rows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No rows yet. Click "Add Row" to start.
          </div>
        ) : (
          <div>
            {section.rows.map((row, rowIndex) => (
            <RowDropZone
              key={row.id}
              row={row}
              rowIndex={rowIndex}
              sectionId={section.id}
              sectionCols={section.cols}
              isSelected={selectedRowId === row.id}
              selectedWidgetId={selectedWidgetId}
              onRowSelect={onRowSelect}
              onRowDelete={onRowDelete}
              onWidgetSelect={onWidgetSelect}
              handleColspanChange={handleColspanChange}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function RowDropZone({ row, rowIndex, sectionId, sectionCols, isSelected, selectedWidgetId, onRowSelect, onRowDelete, onWidgetSelect, handleColspanChange }: RowDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `row-${row.id}`,
    data: { rowId: row.id }
  });

  const rowBgColor = rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white';

  return (
    <div
      ref={setNodeRef}
      className={`
        border-b border-gray-200 py-1 transition-colors relative
        ${isSelected ? 'bg-blue-50' : 'bg-white'}
        ${isOver ? 'bg-green-50' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onRowSelect(row.id);
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this row?')) {
            onRowDelete(sectionId, row.id);
          }
        }}
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-sm bg-red-500 text-white rounded hover:bg-red-600 z-10"
      >
        −
      </button>
      <SortableContext
        items={row.widgets.map(w => w.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${sectionCols}, 1fr)` }}
        >
          {row.widgets.map((widget) => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              isSelected={selectedWidgetId === widget.id}
              onSelect={() => onWidgetSelect(widget.id)}
              onColspanChange={(delta) => handleColspanChange(widget.id, delta, sectionCols)}
              maxCols={sectionCols}
            />
          ))}
        </div>
      </SortableContext>
      
      {row.widgets.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Drop widgets here
        </div>
      )}
    </div>
  );
}

function SortableWidget({ widget, isSelected, onSelect, onColspanChange, maxCols }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.colspan}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`
        bg-white rounded-sm border flex
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        ${isDragging ? 'opacity-50 z-50' : 'opacity-100'}
      `}
    >
      {/* Drag Handle - Left Side */}
      <div
        {...listeners}
        {...attributes}
        className="w-4 bg-gray-200 rounded-l-sm cursor-move hover:bg-gray-300 flex items-center justify-center border-r border-gray-300"
      >
        <GripVertical className="w-3 h-3 text-gray-500" />
      </div>

      {/* Widget Content */}
      <div className="flex-1 p-1.5 relative group">
        {/* Colspan Controls - Top Right */}
        <div className="absolute top-1 right-[9px] flex items-center gap-0.5 bg-gray-100 rounded px-1 py-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onColspanChange(-1);
            }}
            disabled={widget.colspan <= 1}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-30 text-xs px-0.5"
          >
            −
          </button>
          <span className="text-[10px] text-gray-600 px-0.5">
            {widget.colspan}/{maxCols}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onColspanChange(1);
            }}
            disabled={widget.colspan >= maxCols}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-30 text-xs px-0.5"
          >
            +
          </button>
        </div>

        {renderWidgetPreview(widget)}
      </div>
    </div>
  );
}

function renderWidgetPreview(widget: FormWidget) {
  const properties = widget.properties || {};

  switch (widget.type) {
    case WidgetType.TEXT_SINGLE_LINE:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="text"
            disabled
            placeholder={properties.placeholder || 'Enter text'}
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
            maxLength={properties.maxLength}
          />
        </div>
      );

    case WidgetType.TEXT_MULTI_LINE:
      return (
        <div className="flex gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <textarea
            disabled
            rows={properties.rows || 3}
            placeholder="Enter text"
            className="flex-1 h-20 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed resize-none"
            maxLength={properties.maxLength}
          />
        </div>
      );

    case WidgetType.TEXT_WITH_HISTORY:
      return (
        <div className="flex gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 flex flex-col gap-1 px-2 py-1">
            {/* Current input area */}
            <textarea
              disabled
              placeholder="Enter new notes..."
              className="m-0 px-2 py-0.5 text-sm border border-black rounded-sm bg-white text-gray-400 cursor-not-allowed resize-none"
              style={{ height: '60px' }}
            />
            {/* History display */}
            <div className="flex flex-col">
              <div className="text-sm text-gray-700 border-b border-dotted border-gray-400">
                <div>Previous note</div>
                <div className="py-0.5">---------------------------06 Jan 2026 14:30, John Smith</div>
              </div>
              <div className="text-sm text-gray-700 border-b border-dotted border-gray-400">
                <div>Earlier entry</div>
                <div className="py-0.5">---------------------------05 Jan 2026 09:15, Sarah Jones</div>
              </div>
            </div>
          </div>
        </div>
      );

    case WidgetType.DATE:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="date"
            disabled
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.TIME:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="time"
            disabled
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.NUMBER:
    case WidgetType.DECIMAL:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="number"
            disabled
            placeholder="0"
            min={properties.min}
            max={properties.max}
            step={widget.type === WidgetType.DECIMAL ? '0.01' : '1'}
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.CHECKBOX:
      const checkboxLabel = properties.checkboxLabel || widget.label;
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 px-2 py-1">
            <label className="flex items-center gap-1.5 cursor-not-allowed">
              <input
                type="checkbox"
                disabled
                className="w-4 h-4 border-gray-300 rounded cursor-not-allowed"
              />
              <span className="text-sm text-gray-700">
                {checkboxLabel}
                {properties.groupName && (
                  <span 
                    className="inline-block w-2 h-2 bg-purple-500 rounded-full ml-1.5 align-middle cursor-help" 
                    title={`Group: ${properties.groupName}`}
                  />
                )}
              </span>
            </label>
          </div>
        </div>
      );

    case WidgetType.RADIO_BUTTON_LIST:
      const radioOptions = properties.options || [];
      return (
        <div className="flex gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 flex items-center gap-4 px-2 py-1">
            {radioOptions.length > 0 ? (
              radioOptions.map((option: string, index: number) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    disabled
                    name={widget.id}
                    className="w-4 h-4 cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No options configured</span>
            )}
          </div>
        </div>
      );

    case WidgetType.DROPDOWN_LIST:
      const dropdownOptions = properties.options || [];
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select
            disabled
            className="w-56 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 cursor-not-allowed"
          >
            <option value="">Select...</option>
            {dropdownOptions.length > 0 ? (
              dropdownOptions.map((option: string, index: number) => (
                <option key={index} value={option}>{option}</option>
              ))
            ) : (
              <option value="">No options configured</option>
            )}
          </select>
        </div>
      );

    case WidgetType.FILE_UPLOAD:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-gray-50 text-gray-400 flex items-center">
            Choose file...
          </div>
        </div>
      );

    case WidgetType.SELECT_STAFF:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <label className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select
            disabled
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          >
            <option>Select staff member...</option>
          </select>
        </div>
      );

    case WidgetType.ACTION_BUTTON:
      return (
        <div className="flex items-center justify-center w-full p-2">
          <button 
            disabled 
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium text-sm cursor-not-allowed"
          >
            {widget.label || 'Button'}
          </button>
        </div>
      );

    case WidgetType.INSTRUCTION_NOTE:
      return (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3 border-dashed w-full">
          <div className="flex items-start gap-2">
            <StickyNote className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-yellow-900 mb-1">Developer Instructions</div>
              <div className="text-xs text-yellow-800 whitespace-pre-wrap">
                {properties.instructions || 'Add instructions in properties panel...'}
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-0 w-full">
          {!properties.hideLabel && (
            <span className="bg-blue-50 px-2 py-1 text-sm font-semibold text-gray-700 w-32 shrink-0 border-r border-gray-300">
              {widget.label}
            </span>
          )}
          <div className="flex-1 px-2 py-1">
            <span className="text-xs text-gray-500">
              {String(widget.type).replace(/_/g, ' ')}
            </span>
            {widget.required && (
              <span className="text-xs text-red-500 ml-2">* Required</span>
            )}
          </div>
        </div>
      );
  }
}

export default function FormCanvas({
  sections,
  onAddSection,
  onAddRow,
  onSectionUpdate,
  onSectionDelete,
  onRowDelete,
  onWidgetSelect,
  onWidgetUpdate,
  selectedSectionId,
  selectedRowId,
  selectedWidgetId,
  onSectionSelect,
  onRowSelect,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  const handleColspanChange = (widgetId: string, delta: number, maxCols: number) => {
    const widget = sections
      .flatMap(s => s.rows)
      .flatMap(r => r.widgets)
      .find(w => w.id === widgetId);
    
    if (!widget) return;
    
    const newColspan = Math.max(1, Math.min(maxCols, widget.colspan + delta));
    onWidgetUpdate({ colspan: newColspan }, widgetId);
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-h-screen bg-white relative p-8
        ${isOver ? 'bg-blue-50' : ''}
      `}
    >
      {sections.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 text-lg">
            Drag widgets here to start building your form
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <SectionDropZone
              key={section.id}
              section={section}
              isSelected={selectedSectionId === section.id}
              selectedRowId={selectedRowId}
              selectedWidgetId={selectedWidgetId}
              onSectionSelect={onSectionSelect}
              onSectionDelete={onSectionDelete}
              onSectionUpdate={onSectionUpdate}
              onRowSelect={onRowSelect}
              onWidgetSelect={onWidgetSelect}
              onAddRow={onAddRow}
              onRowDelete={onRowDelete}
              handleColspanChange={handleColspanChange}
            />
          ))}
          
          {/* Add Section Button */}
          <button
            onClick={onAddSection}
            className="w-full py-2 border-2 border-dashed border-gray-400 text-gray-500 rounded text-sm hover:border-gray-500 hover:text-gray-600 transition-colors"
          >
            + Add Section
          </button>
        </div>
      )}
    </div>
  );
}
