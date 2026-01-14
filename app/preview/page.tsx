"use client";

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormSection, FormWidget, WidgetType } from '@/types/form';
import { CARENOTES_BUTTON_CLASSES } from '@/lib/styles';

const PREVIEW_STORAGE_KEY = 'cnbuilder_preview';

interface PreviewPayload {
  formName: string;
  sections: FormSection[];
  formSettings?: {
    replannable?: boolean;
    confirmable?: boolean;
  };
}

export default function PreviewPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem('cnbuilder_authenticated');
    if (auth !== 'true') {
      router.replace('/');
      return;
    }

    try {
      const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (raw) {
        setPayload(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Failed to read preview data', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const hasSections = useMemo(() => payload?.sections && payload.sections.length > 0, [payload]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading preview...
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 text-gray-700">
        <p>No preview data found. Open the builder and click Preview to generate a snapshot.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-sm font-medium"
        >
          Return to forms
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ClaireNotes Preview Toolbar - at very top */}
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-300">
        <h1 className="text-xl font-semibold text-gray-900">
          {payload.formName || 'Form Preview'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => router.push('/builder')}
            className="px-4 py-2 bg-acg-teal text-white text-sm hover:bg-opacity-90"
          >
            Open in Builder
          </button>
        </div>
      </div>

      {/* Thick dashed border separator */}
      <div className="border-b-4 border-dashed border-gray-400"></div>

      {/* CareNotes UI starts here */}
      <CareNotesHeader />

      {/* Patient Information Bar */}
      <PatientInfoBar formName={payload.formName || 'Untitled Form'} />

      {/* Form content */}
      <div className="p-6">
        {!hasSections && (
          <div className="border border-dashed border-gray-300-lg bg-white p-6 text-center text-gray-600">
            No sections to preview. Add widgets in the builder, then click Preview again.
          </div>
        )}

        <div className="space-y-6">
          {payload.sections.map((section) => (
            <PreviewSection key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CareNotesHeader() {
  return (
    <div className="w-full shadow-sm">
      {/* Top button bar */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex gap-1">
        <button className={CARENOTES_BUTTON_CLASSES}>
          Cancel
        </button>
        <button className={CARENOTES_BUTTON_CLASSES}>
          Edit
        </button>
      </div>
      
      {/* Blue patient info bar */}
      <div className="bg-carenotes-blue px-4 py-3 flex items-center justify-between text-white">
        <div className="text-lg font-semibold">
          TESTPATIENT, Sean (Mr)
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="italic">
              <span className="font-normal">Born</span> 08/08/1978 (47y) <span className="font-normal">Gender</span> Male
            </div>
            <div className="font-normal">
              <span className="font-normal">NHS No.</span> 012 345 6789
            </div>
          </div>
          <div className="text-yellow-400 text-xl">
            🔔
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientInfoBar({ formName }: { formName: string }) {
  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-300">
      {/* Row 1 - GP, CareNotes ID, Blank */}
      <div className="grid grid-cols-3 gap-0">
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            GP
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700">Dr. House</div>
        </div>
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            CareNotes ID
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700">11-29-95</div>
        </div>
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            &nbsp;
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700"></div>
        </div>
      </div>

      {/* Row 2 - Consultant, Gender, Care Type */}
      <div className="grid grid-cols-3 gap-0">
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            Consultant
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700"></div>
        </div>
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            Gender
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700">Male</div>
        </div>
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            Care Type
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700">Non-CPA</div>
        </div>
      </div>

      {/* Row 3 - Primary Worker, Legal Status, Form Name */}
      <div className="grid grid-cols-3 gap-0">
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            Primary Worker
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700"></div>
        </div>
        <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
          <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
            Legal Status
          </label>
          <div className="flex-1 px-2 py-1 text-sm text-gray-700"></div>
        </div>
        <div className="flex items-center justify-center bg-carenotes-blue border border-carenotes-blue px-2 py-1">
          <span className="text-sm font-semibold text-white">{formName}</span>
        </div>
      </div>

      {/* Row 4 - Alert (full width) */}
      <div className="flex items-center gap-0 border border-carenotes-blue bg-white">
        <label className="bg-carenotes-alert px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
          Alert
        </label>
        <div className="flex-1 px-2 py-1 text-xs text-red-600">
          07/10/25: Physical Health - Allergic to weasels
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ section }: { section: FormSection }) {
  const columns = Math.max(1, section.cols || 1);
  const truncatedTitle = (section.title || 'Untitled section').substring(0, 60);

  return (
    <div>
      {/* Section header tab - fixed width */}
      <div className="bg-carenotes-blue px-3 py-1.5 text-white inline-block text-center" style={{ width: '300px' }}>
        <span className="text-sm font-semibold">{truncatedTitle}</span>
      </div>
      
      {/* Section content with border */}
      <div className="border border-carenotes-blue shadow-sm bg-white overflow-hidden">
        {section.rows.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No rows in this section.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {section.rows.map((row) => {
              // Filter out hidden instruction notes
              const visibleWidgets = row.widgets.filter(w => w.type !== WidgetType.INSTRUCTION_NOTE);
              
              return (
                <div key={row.id} className="p-3">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {visibleWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="col-span-1"
                        style={{ gridColumn: `span ${Math.min(columns, Math.max(1, widget.colspan || 1))}` }}
                      >
                        <PreviewWidget widget={widget} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewWidget({ widget }: { widget: FormWidget }) {
  const properties = widget.properties || {};
  const showLabel = !properties.hideLabel && ![WidgetType.LABEL, WidgetType.ACTION_BUTTON, WidgetType.INSTRUCTION_NOTE].includes(widget.type);
  const label = widget.label || widget.type.replace(/_/g, ' ');

  switch (widget.type) {
    case WidgetType.TEXT_SINGLE_LINE:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="text"
            disabled
            placeholder={properties.placeholder || ''}
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.TEXT_MULTI_LINE:
    case WidgetType.TEXT_WITH_HISTORY:
      return (
        <div className="flex gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <textarea
            disabled
            rows={properties.rows || 3}
            className="flex-1 h-20 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed resize-none"
          />
        </div>
      );

    case WidgetType.DATE:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input type="date" disabled className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed" />
        </div>
      );

    case WidgetType.TIME:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input type="time" disabled className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed" />
        </div>
      );

    case WidgetType.NUMBER:
    case WidgetType.DECIMAL:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="number"
            disabled
            min={properties.min}
            max={properties.max}
            step={widget.type === WidgetType.DECIMAL ? '0.01' : '1'}
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.CHECKBOX: {
      const checkboxLabel = properties.checkboxLabel || label;
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 px-2 py-1">
            <label className="flex items-center gap-1.5 cursor-not-allowed">
              <input type="checkbox" disabled className="w-4 h-4 border-gray-300 cursor-not-allowed" />
              <span className="text-sm text-gray-700">{checkboxLabel}</span>
            </label>
          </div>
        </div>
      );
    }

    case WidgetType.RADIO_BUTTON_LIST: {
      const options: string[] = properties.options || [];
      return (
        <div className="flex gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 flex items-center gap-4 px-2 py-1">
            {options.length > 0 ? (
              options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input type="radio" disabled className="w-4 h-4 cursor-not-allowed" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No options</span>
            )}
          </div>
        </div>
      );
    }

    case WidgetType.DROPDOWN_LIST: {
      const options: string[] = properties.options || [];
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select disabled className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed">
            <option value="">Select...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case WidgetType.FILE_UPLOAD:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="flex-1 px-2 py-1 border-dashed text-sm text-gray-400">
            File upload (read-only)
          </div>
        </div>
      );

    case WidgetType.SELECT_STAFF:
      return (
        <div className="flex items-center gap-0 w-full border border-carenotes-blue bg-white">
          {showLabel && (
            <label className="bg-carenotes-label px-2 py-1 text-xs font-normal text-gray-900 w-32 shrink-0 border-r border-carenotes-blue">
              {label}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="text"
            disabled
            placeholder="Staff selector (read-only)"
            className="flex-1 h-7 m-0 px-2 py-1 text-sm border-0 bg-white text-gray-400 cursor-not-allowed"
          />
        </div>
      );

    case WidgetType.ACTION_BUTTON:
      return (
        <div className="flex items-center justify-center">
          <button
            disabled
            className="w-full px-4 py-2 bg-[#F0941F] border-2 border-[#EF6024] text-white text-sm font-semibold cursor-not-allowed"
          >
            {label}
          </button>
        </div>
      );

    case WidgetType.INSTRUCTION_NOTE:
      return null;

    case WidgetType.LABEL:
      return (
        <div
          className="px-3 py-2 text-sm font-semibold border border-carenotes-blue"
          style={{ color: properties.textColor || '#000000', fontWeight: properties.fontWeight || 'normal' }}
        >
          {label}
        </div>
      );

    default:
      return (
        <div className="border border-carenotes-blue bg-white p-3">
          <p className="text-sm text-gray-600">Unsupported widget type.</p>
        </div>
      );
  }
}
