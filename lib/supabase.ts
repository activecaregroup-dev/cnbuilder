import { createClient } from '@supabase/supabase-js';
import { FormSection } from '@/types/form';

interface Form {
  id: string;
  name: string;
  description?: string;
  sections: FormSection[];
  created_by?: string;
  author_email?: string;
  author_name?: string;
  isComplete?: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Save or update a form
export async function saveForm(form: Form & { description?: string }) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  const formData: any = {
    id: form.id,
    name: form.name,
    description: form.description || '',
    widgets: form.sections, // save sections array to widgets column
    updated_at: new Date().toISOString(),
    is_complete: form.isComplete || false
  };
  
  // Add creator info only for new forms (when created_by is not set)
  if (user && !form.created_by) {
    formData.created_by = user.id;
    formData.author_email = user.email;
    formData.author_name = user.user_metadata?.full_name || user.email?.split('@')[0];
  }
  
  const { data, error } = await supabase
    .from('forms')
    .upsert(formData)
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
        sections: data.widgets, // map widgets column to sections property
        isComplete: data.is_complete
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
    .select('id, name, description, updated_at, author_name, author_email, is_complete')
    .order('updated_at', { ascending: false });
  
  return { data, error };
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Delete a form
export async function deleteForm(id: string) {
  const { data, error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);
  
  return { data, error };
}
