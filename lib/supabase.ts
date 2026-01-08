import { createClient } from '@supabase/supabase-js';
import { FormSection } from '@/types/form';

interface Form {
  id: string;
  name: string;
  description?: string;
  sections: FormSection[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Save or update a form
export async function saveForm(form: Form & { description?: string }) {
  const { data, error } = await supabase
    .from('forms')
    .upsert({
      id: form.id,
      name: form.name,
      description: form.description || '',
      widgets: form.sections, // save sections array to widgets column
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { data, error };
}

// Load a single form by ID
export async function loadForm(id: string) {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();
  
  if (data) {
    return { 
      data: {
        ...data,
        sections: data.widgets // map widgets column to sections property
      }, 
      error 
    };
  }
  return { data, error };
}

// Load all forms
export async function loadAllForms() {
  const { data, error } = await supabase
    .from('forms')
    .select('id, name, description, updated_at')
    .order('updated_at', { ascending: false });
  
  return { data, error };
}

// Delete a form
export async function deleteForm(id: string) {
  const { data, error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);
  
  return { data, error };
}
