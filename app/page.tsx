"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordProtect from '@/components/PasswordProtect';
import { loadAllForms, deleteForm } from '@/lib/supabase';
import { FileText, Plus, Trash2, FileDown, Edit } from 'lucide-react';

interface Form {
  id: string;
  name: string;
  description?: string;
  updated_at: string;
}

export default function FormsListPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const auth = sessionStorage.getItem('cnbuilder_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadForms();
    } else {
      setLoading(false);
    }
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const { data, error } = await loadAllForms();
      if (error) {
        console.error('Error loading forms:', error);
      } else {
        setForms(data || []);
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

  const handleExportXML = (formId: string) => {
    // TODO: Implement XML export
    alert('XML export functionality coming soon!');
  };

  if (!isAuthenticated) {
    return <PasswordProtect onUnlock={() => {
      setIsAuthenticated(true);
      loadForms();
    }} />;
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

            {/* Right - New Form button and ACG logo */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/builder')}
                className="flex items-center gap-2 bg-[#F0941F] hover:bg-[#F0941F]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New Form
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

      {/* Forms List */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first form</p>
            <button 
              onClick={() => router.push('/builder')}
              className="inline-flex items-center gap-2 bg-[#F0941F] hover:bg-[#F0941F]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Form
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
                    <p className="text-xs text-gray-400">
                      Last updated: {new Date(form.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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