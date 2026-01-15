"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import { ArrowLeft, FileText, Plus, Save, FileDown, Eye, Trash2 } from 'lucide-react';

export default function UserGuidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Forms
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#363432]">
                Claire<span className="text-[#EF6024]">notes</span> User Guide
              </h1>
              <p className="text-[#90A19D] mt-1">Learn how to use the CareNotes Form Builder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#EF6024]" />
              Getting Started
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The CareNotes Form Builder is a visual tool for creating custom forms that can be imported into the CareNotes healthcare platform. 
              This guide will walk you through the process of creating, editing, and exporting forms.
            </p>
          </section>

          {/* Creating Forms */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#F0941F]" />
              Creating a New Form
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
              <li>Click the <strong className="text-[#F0941F]">New Form</strong> button on the home page or in the builder</li>
              <li>Enter a name for your form in the top toolbar</li>
              <li>Choose whether the form should be <strong>Replannable</strong> or <strong>Confirmable</strong> using the checkboxes</li>
              <li>Start adding widgets from the left panel to build your form</li>
            </ol>
          </section>

          {/* Widget Library */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Widget Library</h2>
            <p className="text-gray-700 mb-4">The widget library on the left contains all available form elements. Drag and drop widgets onto the canvas to add them to your form:</p>
            <div className="grid grid-cols-2 gap-4 ml-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Text Input Widgets</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Single Line Text</li>
                  <li>• Multi-line Text</li>
                  <li>• Text with History</li>
                  <li>• Number / Decimal</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Date & Time</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Date Picker</li>
                  <li>• Time Picker</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Selection Widgets</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Checkbox</li>
                  <li>• Radio Button List (must be mandatory)</li>
                  <li>• Dropdown List</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Other Widgets</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• File Upload</li>
                  <li>• Staff Selector</li>
                  <li>• Action Button</li>
                  <li>• Label</li>
                  <li>• Instruction Note (for developers)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Working with Sections */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sections and Layout</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>Sections:</strong> Forms are organized into sections. Each section has:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>A title that appears as a tab in CareNotes</li>
                <li>A column count (controls grid layout)</li>
                <li>Multiple rows containing widgets</li>
              </ul>
              <p><strong>Rows:</strong> Within each section, widgets are arranged in rows. Use the <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">+ Add Row</kbd> button to add more rows.</p>
              <p><strong>Column Span:</strong> Each widget has a colspan value that determines how many columns it occupies. Use the +/- buttons to adjust.</p>
            </div>
          </section>

          {/* Properties Panel */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Properties Panel</h2>
            <p className="text-gray-700 mb-4">Click on any widget, row, or section to view and edit its properties in the right panel:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Widget Properties:</strong> Label, field name, required flag, placeholder text, options (for dropdowns/radio buttons)</li>
              <li><strong>Field Name:</strong> Auto-generated but can be customized (max 30 characters). Click "Regenerate" for a deterministic name</li>
              <li><strong>Options:</strong> For radio buttons and dropdowns, add options that will become picklists in CareNotes</li>
              <li><strong>Read-only:</strong> Certain widgets can be marked as read-only (via JavaScript in exported XML)</li>
            </ul>
          </section>

          {/* Preview */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-gray-700" />
              Previewing Your Form
            </h2>
            <p className="text-gray-700 mb-4">Click the <strong>Preview</strong> button in the toolbar to see how your form will appear in CareNotes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>The preview shows the CareNotes interface with patient information bar</li>
              <li>All widgets are displayed as read-only</li>
              <li>Instruction notes are hidden in preview (they're for developers only)</li>
              <li>Section tabs appear at the top of each section</li>
            </ul>
          </section>

          {/* Saving */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Save className="w-6 h-6 text-[#196774]" />
              Saving Your Form
            </h2>
            <p className="text-gray-700 mb-4">Click the <strong className="text-[#196774]">Save Form</strong> button to save your work:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Forms are saved to your CareNotes Builder account</li>
              <li>Your name is recorded as the form author</li>
              <li>The form appears in your forms list on the home page</li>
              <li>You can edit saved forms at any time by clicking the <strong>Edit</strong> button</li>
            </ul>
          </section>

          {/* Exporting */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileDown className="w-6 h-6 text-[#90A19D]" />
              Exporting to XML
            </h2>
            <p className="text-gray-700 mb-4">Once your form is complete, export it as XML to import into CareNotes:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
              <li>Click the <strong className="text-[#90A19D]">Export XML</strong> button (in toolbar or on form card)</li>
              <li>A <code className="bg-gray-100 px-2 py-1 rounded text-sm">.fdl</code> file will be downloaded</li>
              <li>Review any developer notes in the alert popup</li>
              <li>Import the FDL file into CareNotes System Administration</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> Picklists referenced in radio buttons and dropdowns must be created manually in CareNotes System Administration. 
                The developer notes will list all picklists that need to be created.
              </p>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h2>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Radio Button Lists:</strong> Must always be mandatory in CareNotes because users cannot blank them once selected. The builder automatically marks them as mandatory in exported XML.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Field Names:</strong> Must be unique and max 30 characters. The builder enforces this automatically.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Column Totals:</strong> Each row's total colspan (labels + fields) must equal the section's column count for CareNotes to accept the form.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-700">
              For questions or support with the CareNotes Form Builder, please contact:{' '}
              <a href="mailto:claire.tasker@activecaregroup.co.uk" className="text-[#196774] hover:underline font-medium">
                claire.tasker@activecaregroup.co.uk
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
