export const CARENOTES_COLORS = {
  // CareNotes system colors (not user-editable)
  system: {
    buttonBorder: '#1a5993',
    darkBlueBackground: '#1a5993',
    alertBackground: '#ffe1e1',
  },
  
  // Form colors (defined by ClaireNotes/users)
  form: {
    labelBackground: '#e7edf9',
    confirmedStatus: '#46f600',
    unconfirmedStatus: '#ff0000',
  },
  
  // ACG brand colors for user-created elements
  acg: {
    buttonBackground: '#EF6024', // Coral
    buttonBorder: '#F0941F', // Orange
    teal: '#196774',
    charcoal: '#363432',
    sage: '#90A19D',
  }
} as const;
