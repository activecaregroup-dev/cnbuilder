"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { FormSection, FormRow, FormWidget, WidgetType } from '@/types/form';
import FormCanvas from '@/components/FormCanvas';
import WidgetLibrary from '@/components/WidgetLibrary';
import PropertiesPanel from '@/components/PropertiesPanel';
import { Save, FileDown, FilePlus, ArrowLeft } from 'lucide-react';
import { saveForm, loadForm } from '@/lib/supabase';

// Helper function to generate unique field names (max 30 chars)
function generateFieldName(widgetType: WidgetType, label: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  const cleanLabel = label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  // Calculate max label length (30 - timestamp - random - 2 underscores)
  const maxLabelLength = 30 - timestamp.length - random.length - 2;
  const truncatedLabel = cleanLabel.substring(0, maxLabelLength);
  
  return `${truncatedLabel}_${timestamp}_${random}`;
}

function FormBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get('formId');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formName, setFormName] = useState("Untitled Form");
  const [currentFormId, setCurrentFormId] = useState<string | null>(formId);
  const [formSettings, setFormSettings] = useState({ replannable: false, confirmable: false });
  const [sections, setSections] = useState<FormSection[]>([]);
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [propertiesPanelVisible, setPropertiesPanelVisible] = useState(false);

  // Configure drag sensors with higher activation distance
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // Require 10px movement before drag starts
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with default section if none exist
    if (sections.length === 0) {
      setSections([
        {
          id: crypto.randomUUID(),
          title: "Section 1",
          cols: 2,
          rows: []
        }
      ]);
    }
    
    // Check authentication
    const auth = sessionStorage.getItem('cnbuilder_authenticated');
    if (auth !== 'true') {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);

    // Load form if formId is provided
    if (formId) {
      loadExistingForm(formId);
    }
  }, [formId, router]);

  const loadExistingForm = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await loadForm(id);
      if (error) {
        console.error('Error loading form:', error);
        alert('Failed to load form');
      } else if (data) {
        setFormName(data.name || 'Untitled Form');
        setSections(data.sections || []);
        setCurrentFormId(data.id);
      }
    } catch (err) {
      console.error('Failed to load form:', err);
      alert('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;

    // Check if this is a widget from the library (not reordering existing widgets)
    const isFromLibrary = Object.values(WidgetType).includes(active.id as WidgetType);
    
    // Handle moving existing widgets between rows
    if (!isFromLibrary) {
      const activeId = active.id as string;
      const overIdStr = String(over.id);
      
      // Determine if dropped on row space vs specific widget
      let targetRowId: string | null = null;
      let targetWidgetId: string | null = null;
      let isDropOnEmptySpace = false;
      
      if (overIdStr.startsWith('row-')) {
        // Dropped on row space (not on a widget)
        targetRowId = overIdStr.replace('row-', '');
        isDropOnEmptySpace = true;
      } else {
        // Dropped on a widget - will swap
        targetWidgetId = overIdStr;
        sections.forEach(section => {
          section.rows.forEach(row => {
            if (row.widgets.some(w => w.id === overIdStr)) {
              targetRowId = row.id;
            }
          });
        });
      }
      
      if (!targetRowId) return;
      
      // Find source row and widget
      let widgetToMove: FormWidget | null = null;
      let sourceRowId: string | null = null;
      
      sections.forEach(section => {
        section.rows.forEach(row => {
          const foundWidget = row.widgets.find(w => w.id === activeId);
          if (foundWidget) {
            sourceRowId = row.id;
            widgetToMove = foundWidget;
          }
        });
      });
      
      // Don't do anything if widget not found or dropping on itself
      if (!widgetToMove || activeId === targetWidgetId) return;
      
      if (isDropOnEmptySpace) {
        // Dropped on empty row space - just move the widget (no swap)
        const updatedSections = sections.map(section => ({
          ...section,
          rows: section.rows.map(row => {
            if (row.id === sourceRowId) {
              // Remove from source row
              return {
                ...row,
                widgets: row.widgets.filter(w => w.id !== activeId)
              };
            } else if (row.id === targetRowId) {
              // Add to target row
              return {
                ...row,
                widgets: [...row.widgets, widgetToMove!]
              };
            }
            return row;
          })
        }));
        
        setSections(updatedSections);
        return;
      }
      
      // Dropped on a specific widget - swap them
      let widgetToSwap: FormWidget | null = null;
      sections.forEach(section => {
        section.rows.forEach(row => {
          if (row.id === targetRowId && targetWidgetId) {
            widgetToSwap = row.widgets.find(w => w.id === targetWidgetId) || null;
          }
        });
      });
      
      if (!widgetToSwap) return;
      
      // Perform the swap
      const updatedSections = sections.map(section => ({
        ...section,
        rows: section.rows.map(row => {
          if (row.id === sourceRowId && row.id === targetRowId) {
            // Same row - swap positions of two widgets
            return {
              ...row,
              widgets: row.widgets.map(w => {
                if (w.id === activeId) return widgetToSwap!;
                if (w.id === widgetToSwap?.id) return widgetToMove!;
                return w;
              })
            };
          } else if (row.id === sourceRowId) {
            // Remove dragged widget, add swapped widget
            const withoutDragged = row.widgets.filter(w => w.id !== activeId);
            return {
              ...row,
              widgets: [...withoutDragged, widgetToSwap!]
            };
          } else if (row.id === targetRowId) {
            // Remove swapped widget, add dragged widget
            const withoutSwapped = row.widgets.filter(w => w.id !== widgetToSwap!.id);
            return {
              ...row,
              widgets: [...withoutSwapped, widgetToMove!]
            };
          }
          return row;
        })
      }));
      
      setSections(updatedSections);
      return;
    }

    const widgetType = active.id as WidgetType;
    const label = active.data.current?.label || widgetType.replace(/_/g, ' ');
    
    // Generate field name from widget type and label
    const fieldName = generateFieldName(widgetType, label);

    const newWidget: FormWidget = {
      id: crypto.randomUUID(),
      type: widgetType,
      label: label,
      fieldName: fieldName,
      required: false,
      colspan: 1,
      properties: {},
    };

    // Check if dropping onto a specific row
    const overIdStr = String(over.id);
    if (overIdStr.startsWith('row-')) {
      const rowId = overIdStr.replace('row-', '');
      
      const updatedSections = sections.map(section => ({
        ...section,
        rows: section.rows.map(row => {
          if (row.id === rowId) {
            return {
              ...row,
              widgets: [...row.widgets, newWidget]
            };
          }
          return row;
        })
      }));
      
      setSections(updatedSections);
      return;
    }

    // Check if dropping onto a specific section
    if (overIdStr.startsWith('section-')) {
      const sectionId = overIdStr.replace('section-', '');
      
      const updatedSections = sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            rows: [
              ...section.rows,
              {
                id: crypto.randomUUID(),
                widgets: [newWidget]
              }
            ]
          };
        }
        return section;
      });
      
      setSections(updatedSections);
      return;
    }

    // Fallback: dropping on canvas - create new row in first section
    if (over.id === 'form-canvas') {
      // If no section exists, create one
      if (sections.length === 0) {
        const newSection: FormSection = {
          id: crypto.randomUUID(),
          title: "Section 1",
          cols: 2,
          rows: [{
            id: crypto.randomUUID(),
            widgets: [newWidget]
          }]
        };
        setSections([newSection]);
        return;
      }

      // Add to first section, create new row
      const updatedSections = sections.map((section, index) => {
        if (index === 0) {
          return {
            ...section,
            rows: [
              ...section.rows,
              {
                id: crypto.randomUUID(),
                widgets: [newWidget]
              }
            ]
          };
        }
        return section;
      });
      
      setSections(updatedSections);
    }
  };

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: crypto.randomUUID(),
      title: `Section ${sections.length + 1}`,
      cols: 2,
      rows: []
    };
    setSections([...sections, newSection]);
  };

  const handleAddRow = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: [
            ...section.rows,
            {
              id: crypto.randomUUID(),
              widgets: []
            }
          ]
        };
      }
      return section;
    }));
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<FormSection>) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const handleRowDelete = (sectionId: string, rowId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.filter(row => row.id !== rowId)
        };
      }
      return section;
    }));
    
    if (selectedRowId === rowId) {
      setSelectedRowId(null);
    }
  };

  const handleSectionDelete = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
    
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSelectedRowId(null);
      setSelectedWidgetId(null);
    }
  };

  const handleWidgetSelect = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
  };

  const handleWidgetUpdate = (updates: Partial<FormWidget>, widgetId?: string) => {
    const targetWidgetId = widgetId || selectedWidgetId;
    if (!targetWidgetId) return;

    setSections(sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        widgets: row.widgets.map(widget =>
          widget.id === targetWidgetId ? { ...widget, ...updates } : widget
        )
      }))
    })));
  };

  const handleWidgetDelete = () => {
    if (!selectedWidgetId) return;

    setSections(sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        widgets: row.widgets.filter(widget => widget.id !== selectedWidgetId)
      }))
    })));
    
    setSelectedWidgetId(null);
  };

  const handleSaveForm = async () => {
    setSaving(true);
    try {
      const formData = {
        id: currentFormId || crypto.randomUUID(),
        name: formName,
        description: '',
        sections: sections
      };

      const { data, error } = await saveForm(formData);
      
      if (error) {
        alert('Error saving form: ' + error.message);
      } else {
        if (!currentFormId && data) {
          setCurrentFormId(data.id);
          // Update URL to include formId
          router.replace(`/builder?formId=${data.id}`);
        }
        alert('Form saved successfully!');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleExportXML = () => {
    console.log('Export button clicked!');
    console.log('Exporting XML for:', { name: formName, sections });
    alert('XML export functionality coming soon!');
  };

  const handleNewForm = () => {
    console.log('New Form button clicked!');
    if (sections.length > 0 && sections.some(s => s.rows.length > 0)) {
      if (!confirm('Are you sure? This will clear the current form.')) {
        return;
      }
    }
    setSections([
      {
        id: crypto.randomUUID(),
        title: "Section 1",
        cols: 2,
        rows: []
      }
    ]);
    setSelectedSectionId(null);
    setSelectedRowId(null);
    setSelectedWidgetId(null);
    setFormName('Untitled Form');
    setCurrentFormId(null);
    router.replace('/builder');
    console.log('Form reset complete');
  };

  const handleFormNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormName(e.target.value);
  };

  const handleFormNameFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Clear "Untitled Form" when clicking in
    if (formName === "Untitled Form") {
      setFormName("");
    }
  };

  // Find selected widget across all sections and rows
  const selectedWidget = selectedWidgetId 
    ? sections
        .flatMap(s => s.rows)
        .flatMap(r => r.widgets)
        .find(w => w.id === selectedWidgetId) || null
    : null;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 relative z-50">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Back to Forms"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <input
          id="form-name-input"
          type="text"
          value={formName}
          onChange={handleFormNameChange}
          onFocus={handleFormNameFocus}
          className="text-xl font-bold border-b-2 border-gray-300 focus:border-blue-500 outline-none px-2 py-1 flex-1 max-w-md bg-transparent text-gray-900"
          placeholder="Form Name"
        />
        
        {/* Replan and Confirmation Checkboxes */}
        <div className="flex items-center gap-4 px-4 border-l border-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.replannable}
              onChange={(e) => setFormSettings({ ...formSettings, replannable: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Replan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.confirmable}
              onChange={(e) => setFormSettings({ ...formSettings, confirmable: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Confirmation</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleNewForm}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New Form
        </button>
        <button
          type="button"
          onClick={handleSaveForm}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Form'}
        </button>
        <button
          type="button"
          onClick={handleExportXML}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export XML
        </button>
      </div>

      {/* Three-Column Layout - Only render after mount to avoid hydration issues */}
      {mounted ? (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="flex flex-1 overflow-hidden">
            <WidgetLibrary />
            
            <div className={`flex-1 ml-48 ${propertiesPanelVisible ? 'mr-80' : 'mr-0'}`}>
              <FormCanvas
                sections={sections}
                onAddSection={handleAddSection}
                onAddRow={handleAddRow}
                onSectionUpdate={handleSectionUpdate}
                onSectionDelete={handleSectionDelete}
                onRowDelete={handleRowDelete}
                onWidgetSelect={handleWidgetSelect}
                onWidgetUpdate={handleWidgetUpdate}
                selectedSectionId={selectedSectionId}
                selectedRowId={selectedRowId}
                selectedWidgetId={selectedWidgetId}
                onSectionSelect={(sectionId) => {
                  setSelectedSectionId(sectionId);
                  setSelectedRowId(null);
                  setSelectedWidgetId(null);
                }}
                onRowSelect={setSelectedRowId}
              />
            </div>

            <PropertiesPanel
              selectedWidget={selectedWidget}
              sections={sections}
              onUpdate={handleWidgetUpdate}
              onDelete={handleWidgetDelete}
              selectedSectionId={selectedSectionId}
              onSectionUpdate={handleSectionUpdate}
              isVisible={propertiesPanelVisible}
              onToggle={() => setPropertiesPanelVisible(!propertiesPanelVisible)}
            />
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-blue-100 border-2 border-blue-500 rounded px-3 py-2 shadow-lg">
                Dragging...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      )}
    </div>
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <FormBuilderPageContent />
    </Suspense>
  );
}
