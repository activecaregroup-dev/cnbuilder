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
          className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-medium"
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

      {/* Form content */}
      <div className="p-6">
        {!hasSections && (
          <div className="border border-dashed border-gray-300 rounded-lg bg-white p-6 text-center text-gray-600">
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

function PreviewSection({ section }: { section: FormSection }) {
  const columns = Math.max(1, section.cols || 1);

  return (
    <div className="border border-gray-200 shadow-sm rounded bg-white overflow-hidden">
      <div className="bg-carenotes-blue px-3 py-2 text-white flex items-center justify-between">
        <span className="text-sm font-semibold">{section.title || 'Untitled section'}</span>
        <span className="text-xs opacity-80">{columns} cols</span>
      </div>
      {section.rows.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">No rows in this section.</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {section.rows.map((row) => (
            <div key={row.id} className="p-3">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {row.widgets.map((widget) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewWidget({ widget }: { widget: FormWidget }) {
  const properties = widget.properties || {};
  const showLabel = !properties.hideLabel && ![WidgetType.LABEL, WidgetType.ACTION_BUTTON, WidgetType.INSTRUCTION_NOTE].includes(widget.type);
  const label = widget.label || widget.type.replace(/_/g, ' ');

  const container = (content: React.ReactNode) => (
    <div className="border border-gray-200 rounded bg-white shadow-sm">
      {showLabel && (
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 text-sm font-semibold text-gray-700">
          {label}
          {widget.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      <div className="p-3 bg-gray-50">{content}</div>
    </div>
  );

  switch (widget.type) {
    case WidgetType.TEXT_SINGLE_LINE:
      return container(
        <input
          type="text"
          disabled
          placeholder={properties.placeholder || 'Read-only'}
          className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500"
        />
      );

    case WidgetType.TEXT_MULTI_LINE:
    case WidgetType.TEXT_WITH_HISTORY:
      return container(
        <textarea
          disabled
          rows={properties.rows || 3}
          placeholder={widget.type === WidgetType.TEXT_WITH_HISTORY ? 'History is read-only' : 'Read-only'}
          className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500 resize-none"
        />
      );

    case WidgetType.DATE:
      return container(
        <input type="date" disabled className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500" />
      );

    case WidgetType.TIME:
      return container(
        <input type="time" disabled className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500" />
      );

    case WidgetType.NUMBER:
    case WidgetType.DECIMAL:
      return container(
        <input
          type="number"
          disabled
          min={properties.min}
          max={properties.max}
          step={widget.type === WidgetType.DECIMAL ? '0.01' : '1'}
          className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500"
        />
      );

    case WidgetType.CHECKBOX: {
      const checkboxLabel = properties.checkboxLabel || label;
      return container(
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" disabled className="w-4 h-4 border-gray-300 rounded" />
          <span>
            {checkboxLabel}
            {properties.groupName && (
              <span className="ml-2 text-xs text-gray-500">({properties.groupName})</span>
            )}
          </span>
        </label>
      );
    }

    case WidgetType.RADIO_BUTTON_LIST: {
      const options: string[] = properties.options || [];
      return container(
        options.length ? (
          <div className="flex flex-wrap gap-4">
            {options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" disabled className="w-4 h-4" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No options configured.</p>
        )
      );
    }

    case WidgetType.DROPDOWN_LIST: {
      const options: string[] = properties.options || [];
      return container(
        <select disabled className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-700">
          <option value="">Select...</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case WidgetType.FILE_UPLOAD:
      return container(
        <div className="px-2 py-2 border border-dashed border-gray-300 rounded bg-white text-sm text-gray-500">
          File upload (read-only preview)
        </div>
      );

    case WidgetType.SELECT_STAFF:
      return container(
        <input
          type="text"
          disabled
          placeholder="Staff selector (read-only)"
          className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-500"
        />
      );

    case WidgetType.ACTION_BUTTON:
      return (
        <div className="flex items-center justify-center">
          <button
            disabled
            className="w-full px-4 py-2 bg-[#F0941F] border-2 border-[#EF6024] text-white rounded text-sm font-semibold cursor-not-allowed"
          >
            {label}
          </button>
        </div>
      );

    case WidgetType.INSTRUCTION_NOTE:
      return (
        <div className="bg-yellow-50 border border-yellow-400 rounded p-3 text-sm text-yellow-900">
          <div className="font-semibold mb-1">Developer Instructions</div>
          <div className="whitespace-pre-wrap">{properties.instructions || 'No instructions provided.'}</div>
        </div>
      );

    case WidgetType.LABEL:
      return (
        <div
          className="px-3 py-2 text-sm font-semibold rounded border border-gray-200"
          style={{ color: properties.textColor || '#000000', fontWeight: properties.fontWeight || 'normal' }}
        >
          {label}
        </div>
      );

    default:
      return container(<p className="text-sm text-gray-600">Unsupported widget type.</p>);
  }
}
