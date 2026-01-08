# CNBuilder - CareNotes Form Builder

A visual form builder application that generates CareNotes XML forms with an intuitive drag-and-drop interface.

## Features

- 🎨 Visual drag-and-drop form designer
- 📝 12+ widget types (text inputs, dropdowns, radio buttons, date pickers, etc.)
- 🔄 Drag widgets between rows with smart swapping
- 💾 Save and load forms from Supabase database
- 🔐 Password-protected access
- 📱 Responsive design with Tailwind CSS
- ⚙️ Customizable widget properties (validation, colspan, options, etc.)

## Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Supabase** - PostgreSQL database and authentication
- **@dnd-kit** - Modern drag-and-drop library
- **lucide-react** - Beautiful icon set

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cnbuilder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the project root with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up your Supabase database table:
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Access

**Password:** `carenotes2025`

## Usage

1. Enter the password to access the application
2. Click "New Form" to create a form or "Edit" to modify existing ones
3. Drag widgets from the left panel onto the form canvas
4. Configure widget properties in the right panel
5. Drag widgets between rows to reorganize or swap them
6. Save your form to the database
7. Export as XML (coming soon)

## Widget Types

- Text Single Line
- Text Multi Line
- Text with History
- Date Picker
- Time Picker
- Number Input
- Decimal Input
- Checkbox
- Radio Button List
- Dropdown List
- File Upload
- Select Staff

## Project Structure

```
cnbuilder/
├── app/
│   ├── page.tsx              # Forms list page
│   └── builder/
│       └── page.tsx          # Form builder page
├── components/
│   ├── FormCanvas.tsx        # Main canvas with sections/rows
│   ├── WidgetLibrary.tsx     # Left sidebar with draggable widgets
│   ├── PropertiesPanel.tsx   # Right sidebar for widget config
│   └── PasswordProtect.tsx   # Authentication component
├── lib/
│   └── supabase.ts          # Supabase client and CRUD functions
└── types/
    └── form.ts              # TypeScript type definitions
```

## Development Notes

- Field names are auto-generated and limited to 30 characters
- Widget options are limited to 30 characters each
- Forms are stored in Supabase with sections saved as JSONB in the `widgets` column
- Authentication uses sessionStorage (expires on browser close)

## License

Proprietary - All rights reserved

## Author

Built with ❤️ for CareNotes

