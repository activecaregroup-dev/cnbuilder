"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadAllForms, deleteForm, loadForm, getCurrentUser, signOut } from '@/lib/supabase';
import { FileText, Plus, Trash2, FileDown, Edit, LogOut, User, BookOpen, ArrowLeft } from 'lucide-react';

interface Form {
  id: string;
  name: string;
  description?: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
  is_complete?: boolean;
}

export default function ClosedCompleteFormsPage() {
  const [user, setUser] = useState<any>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
    } else {
      setUser(currentUser);
      loadForms();
    }
  };

  const loadForms = async () => {
    setLoading(true);
    try {
      const { data, error } = await loadAllForms();
      if (error) {
        console.error('Error loading forms:', error);
      } else {
        // Filter to show only complete forms
        setForms((data || []).filter(form => form.is_complete));
      }
    } catch (err) {
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      const { error } = await deleteForm(id);
      if (error) {
        alert('Error deleting form: ' + error.message);
      } else {
        setForms(forms.filter(f => f.id !== id));
      }
    } catch (err) {
      alert('Failed to delete form');
      console.error(err);
    }
  };

  const handleExportXML = async (formId: string) => {
    try {
      const { data, error } = await loadForm(formId);
      if (error || !data) {
        alert('Error loading form: ' + (error?.message || 'Form not found'));
        return;
      }

      const { generateCareNotesXML } = await import('@/lib/xmlGenerator');
      const result = generateCareNotesXML({
        formName: data.name,
        replannable: data.replannable || false,
        confirmable: data.confirmable || false,
        sections: data.sections
      });

      // Create download
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name}.fdl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show developer notes if any
      if (result.notes.length > 0) {
        alert(`XML exported successfully!\n\nDeveloper Notes (${result.notes.length}):\n${result.notes.map(n => n.message).slice(0, 5).join('\n')}${result.notes.length > 5 ? '\n...(see XML for full list)' : ''}`);
      }
    } catch (err) {
      alert('Failed to export XML');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with branding */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left - ClaireNotes branding */}
            <div className="flex items-center gap-4">
              {/* C Logo with refined gradient */}
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F0941F] to-[#EF6024] rounded-lg shadow-sm">
                <span className="text-3xl font-bold text-white">C</span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-[#363432]">
                  Claire<span className="text-[#EF6024]">notes</span>
                </h1>
                <p className="text-[#90A19D] mt-1">Carenotes visual form builder tool</p>
              </div>
            </div>

            {/* Right - User info and sign out */}
            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:block">
                <img
                  src="/acg-logo.png"
                  alt="Active Care Group"
                  className="h-12 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-start gap-2">
            <button 
              onClick={() => router.push('/guide')}
              className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm"
              title="User Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </button>

            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm"
              title="View Active Forms"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Active Forms
            </button>

            <button 
              onClick={() => router.push('/builder')}
              className="flex items-center gap-1.5 bg-[#F0941F] hover:bg-[#F0941F]/90 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Closed Complete Forms</h2>
          <p className="text-gray-600 mt-1">Completed forms ready for use</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed forms yet</h3>
            <p className="text-gray-600 mb-6">Forms marked as complete will appear here</p>
            <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 bg-[#F0941F] hover:bg-[#F0941F]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              View Active Forms
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map(form => (
              <div 
                key={form.id} 
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900 mb-1">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        Last updated: {new Date(form.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {form.author_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {form.author_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => router.push(`/builder?formId=${form.id}`)}
                      className="flex items-center gap-2 bg-[#196774] hover:bg-[#196774]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      title="Edit form"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleExportXML(form.id)}
                      className="flex items-center gap-2 bg-[#F0941F] hover:bg-[#F0941F]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      title="Export as XML"
                    >
                      <FileDown className="w-4 h-4" />
                      Export
                    </button>
                    <button 
                      onClick={() => handleDelete(form.id)}
                      className="flex items-center gap-2 bg-[#EF6024] hover:bg-[#EF6024]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      title="Delete form"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}