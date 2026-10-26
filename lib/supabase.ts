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
  replannable?: boolean;
  confirmable?: boolean;
  tabName?: string;
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
    is_complete: form.isComplete || false,
    replannable: form.replannable || false,
    confirmable: form.confirmable || false,
    tab_name: form.tabName || ''
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

  // If the settings columns haven't been added to the database yet, still save the form itself
  if (error && isMissingSettingsColumn(error)) {
    const withoutSettings = { ...formData };
    delete withoutSettings.replannable;
    delete withoutSettings.confirmable;
    delete withoutSettings.tab_name;
    const retry = await supabase
      .from('forms')
      .upsert(withoutSettings)
      .select()
      .single();
    return { data: retry.data, error: retry.error, settingsNotSaved: !retry.error };
  }

  return { data, error, settingsNotSaved: false };
}

// PostgREST reports an unknown column as PGRST204 ("Could not find the 'x' column")
function isMissingSettingsColumn(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST204' && /replannable|confirmable|tab_name/.test(error.message || '');
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
        isComplete: data.is_complete,
        tabName: data.tab_name || ''
      },
      error 
    };
  }
  return { data, error };
}

// Duplicate a form as a new, in-progress form so a variant can be built from it
export async function duplicateForm(id: string, newName: string) {
  const { data: source, error: loadError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (loadError || !source) {
    return { data: null, error: loadError || new Error('Form not found') };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Give every section, row and widget a fresh id so the copy is fully independent.
  // Field names are kept so the variant stays aligned with the original form.
  const sections: FormSection[] = (source.widgets || []).map((section: FormSection) => ({
    ...section,
    id: crypto.randomUUID(),
    rows: section.rows.map(row => ({
      ...row,
      id: crypto.randomUUID(),
      widgets: row.widgets.map(widget => ({
        ...widget,
        id: crypto.randomUUID(),
        properties: { ...widget.properties }
      }))
    }))
  }));

  // Copy every other column (e.g. description, settings) but reset identity, status and authorship
  const formData: Record<string, unknown> = {
    ...source,
    id: crypto.randomUUID(),
    name: newName,
    widgets: sections,
    is_complete: false,
    updated_at: new Date().toISOString(),
    created_by: user?.id ?? null,
    author_email: user?.email ?? null,
    author_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || null
  };
  // Let the database stamp the copy's own creation time
  delete formData.created_at;

  const { data, error } = await supabase
    .from('forms')
    .insert(formData)
    .select()
    .single();

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
