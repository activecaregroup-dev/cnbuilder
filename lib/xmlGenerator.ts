import { FormSection, FormRow, FormWidget, WidgetType } from '@/types/form';

interface XMLGeneratorOptions {
  formName: string;
  replannable: boolean;
  confirmable: boolean;
  sections: FormSection[];
}

interface DeveloperNote {
  type: 'warning' | 'info' | 'picklist' | 'action';
  message: string;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFieldName(name: string): string {
  // Remove special characters, convert to camelCase
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

function generateFieldXML(widget: FormWidget, groupName?: string): string {
  const fieldName = groupName 
    ? `${groupName}_${widget.fieldName || sanitizeFieldName(widget.label)}`
    : widget.fieldName || sanitizeFieldName(widget.label);
  
  let fieldType = '';
  
  // Map widget types to CareNotes field types
  switch (widget.type) {
    case WidgetType.TEXT_SINGLE_LINE:
      fieldType = 'TextSingleLine';
      break;
    case WidgetType.TEXT_MULTI_LINE:
      fieldType = 'TextMultiLine';
      break;
    case WidgetType.TEXT_WITH_HISTORY:
      fieldType = 'TextMultiLine';
      break;
    case WidgetType.DATE:
      fieldType = 'Date';
      break;
    case WidgetType.TIME:
      fieldType = 'Time';
      break;
    case WidgetType.NUMBER:
      fieldType = 'Number';
      break;
    case WidgetType.DECIMAL:
      fieldType = 'Number';
      break;
    case WidgetType.CHECKBOX:
      fieldType = 'CheckBox';
      break;
    case WidgetType.RADIO_BUTTON_LIST:
      fieldType = 'RadioButtonList';
      break;
    case WidgetType.DROPDOWN_LIST:
      fieldType = 'DropDownList';
      break;
    case WidgetType.SELECT_STAFF:
      fieldType = 'TextSingleLine';
      break;
    case WidgetType.FILE_UPLOAD:
      fieldType = 'TextSingleLine';
      break;
    default:
      fieldType = 'TextSingleLine';
  }
  
  // Build attributes
  const attrs: string[] = [];
  attrs.push(`name="${escapeXML(fieldName)}"`);
  attrs.push(`type="${fieldType}"`);
  attrs.push(`colspan="${widget.colspan || 1}"`);
  
  // Add mandatory if required (not for checkboxes)
  if (widget.properties.required && widget.type !== WidgetType.CHECKBOX) {
    attrs.push(`mandatory="true"`);
  }
  
  // Add checkboxlabel for checkboxes
  if (widget.type === WidgetType.CHECKBOX && widget.properties.checkboxLabel) {
    attrs.push(`checkboxlabel="${escapeXML(widget.properties.checkboxLabel)}"`);
  }
  
  // Add picklistname for radio/dropdown
  if (widget.type === WidgetType.RADIO_BUTTON_LIST || widget.type === WidgetType.DROPDOWN_LIST) {
    const picklistName = widget.properties.picklistName || `${fieldName}_Picklist`;
    attrs.push(`picklistname="${escapeXML(picklistName)}"`);
  }
  
  const fieldTag = `<field ${attrs.join(' ')} />`;
  
  return `    ${fieldTag}`;
}

function generateLabelXML(widget: FormWidget): string {
  const fieldName = widget.fieldName || sanitizeFieldName(widget.label);
  
  const attrs: string[] = [];
  attrs.push(`caption="${escapeXML(widget.label)}"`);
  attrs.push(`fieldname="${escapeXML(fieldName)}"`);
  attrs.push(`colspan="${widget.colspan || 1}"`);
  
  // Add CareNotes styling for labels
  attrs.push(`cellstyle="background:#f7f7f7;border-bottom:1px solid #ccc;"`);
  
  return `    <label ${attrs.join(' ')} />`;
}

function generatePicklistXML(widget: FormWidget): { xml: string; note: DeveloperNote | null } {
  const fieldName = widget.fieldName || sanitizeFieldName(widget.label);
  const picklistName = widget.properties.picklistName || `${fieldName}_Picklist`;
  const options = widget.properties.options || [];
  
  if (options.length === 0) {
    return { 
      xml: '', 
      note: {
        type: 'warning',
        message: `⚠️ Widget "${widget.label}" has no options configured. Picklist "${picklistName}" will be empty.`
      }
    };
  }
  
  const items = options.map((option: string) => `    <item>${escapeXML(option)}</item>`).join('\n');
  
  const xml = `  <picklist name="${escapeXML(picklistName)}">
${items}
  </picklist>`;
  
  const note: DeveloperNote = {
    type: 'picklist',
    message: `Create picklist "${picklistName}" with options: ${options.join(', ')}`
  };
  
  return { xml, note };
}

function generateRowXML(row: FormRow, section: FormSection): { xml: string; picklists: string[]; notes: DeveloperNote[] } {
  const picklists: string[] = [];
  const notes: DeveloperNote[] = [];
  const rowParts: string[] = [];
  
  // Group checkboxes by groupName
  const groupedCheckboxes = new Map<string, FormWidget[]>();
  const ungroupedWidgets: FormWidget[] = [];
  
  row.widgets.forEach(widget => {
    if (widget.type === WidgetType.CHECKBOX && widget.properties.groupName) {
      const group = widget.properties.groupName;
      if (!groupedCheckboxes.has(group)) {
        groupedCheckboxes.set(group, []);
      }
      groupedCheckboxes.get(group)!.push(widget);
    } else {
      ungroupedWidgets.push(widget);
    }
  });
  
  // Process ungrouped widgets
  ungroupedWidgets.forEach(widget => {
    // Skip instruction notes - they become comments
    if (widget.type === WidgetType.INSTRUCTION_NOTE) {
      const instruction = widget.properties.instructions || 'No instructions provided';
      rowParts.push(`    <!-- DEVELOPER NOTE: ${escapeXML(instruction)} -->`);
      notes.push({ type: 'info', message: instruction });
      return;
    }
    
    // Skip action buttons - they're handled separately
    if (widget.type === WidgetType.ACTION_BUTTON) {
      return;
    }
    
    // Add label if not hidden
    if (!widget.properties.hideLabel) {
      rowParts.push(generateLabelXML(widget));
    }
    
    // Add field
    rowParts.push(generateFieldXML(widget));
    
    // Generate picklist if needed
    if (widget.type === WidgetType.RADIO_BUTTON_LIST || widget.type === WidgetType.DROPDOWN_LIST) {
      const { xml, note } = generatePicklistXML(widget);
      if (xml) picklists.push(xml);
      if (note) notes.push(note);
    }
  });
  
  // Process grouped checkboxes (one row per group)
  groupedCheckboxes.forEach((checkboxes, groupName) => {
    // Add a single label for the group (use first checkbox's label)
    if (checkboxes.length > 0 && !checkboxes[0].properties.hideLabel) {
      rowParts.push(generateLabelXML(checkboxes[0]));
    }
    
    // Add all checkboxes in the group
    checkboxes.forEach(checkbox => {
      rowParts.push(generateFieldXML(checkbox, groupName));
    });
  });
  
  const xml = `  <row style="white-space:normal;">
${rowParts.join('\n')}
  </row>`;
  
  return { xml, picklists, notes };
}

function generateSectionXML(section: FormSection): { xml: string; picklists: string[]; notes: DeveloperNote[] } {
  const allPicklists: string[] = [];
  const allNotes: DeveloperNote[] = [];
  const rowXMLs: string[] = [];
  
  section.rows.forEach(row => {
    const { xml, picklists, notes } = generateRowXML(row, section);
    rowXMLs.push(xml);
    allPicklists.push(...picklists);
    allNotes.push(...notes);
  });
  
  const xml = `<section title="${escapeXML(section.title)}" cols="${section.cols || 2}">
${rowXMLs.join('\n')}
</section>`;
  
  return { xml, picklists: allPicklists, notes: allNotes };
}

function generateActionButtonXML(widget: FormWidget): { xml: string; note: DeveloperNote } {
  const buttonId = widget.fieldName || sanitizeFieldName(widget.label);
  const buttonText = widget.label || 'Button';
  const actionDescription = widget.properties.actionDescription || 'No action description provided';
  
  const xml = `<action id="${escapeXML(buttonId)}" text="${escapeXML(buttonText)}" type="Button">
  <event eventname="onclick" javascript="UserDefinedJavascript.${buttonId}_Click();" />
</action>`;
  
  const note: DeveloperNote = {
    type: 'action',
    message: `Button "${buttonText}" (${buttonId}): ${actionDescription}`
  };
  
  return { xml, note };
}

function generateReplanXML(confirmable: boolean): { xml: string; notes: DeveloperNote[] } {
  const notes: DeveloperNote[] = [];
  
  // Replan button
  const replanButton = `<action id="ReplanButton" text="Replan" type="Button">
  <event eventname="onclick" javascript="UserDefinedJavascript.Replan_Click();" />
</action>`;
  
  // Standard replan exclude fields
  const excludeFields = [
    'author',
    'EndDate',
    'EndTime',
    'CommencedDate',
    'CommencedTime',
    'Confirm_Flag_ID',
    'Confirm_Date',
    'Confirm_Time',
    'Confirm_Staff_Name',
    'Confirm_Staff_Job_Title',
    'contributor1',
    'contributor2',
    'contributor3',
    'contributor4',
    'contributor5',
    'coproduction2',
    'ownership2',
    'ownership3',
    'attachment'
  ];
  
  const fieldAttributes = excludeFields
    .map(field => `    <fieldattribute name="${field}" value="ExcludeField" />`)
    .join('\n');
  
  const replanField = `<field name="Replan" type="Replan">
${fieldAttributes}
</field>`;
  
  // Add developer notes
  notes.push({
    type: 'warning',
    message: '⚠️ REVIEW REPLAN EXCLUDE FIELDS - Ensure all date/time fields and confirm fields are excluded from replan copy operation'
  });
  
  if (!confirmable) {
    notes.push({
      type: 'warning',
      message: '⚠️ This form is Replannable but not Confirmable. ACG typically requires confirmation before replan.'
    });
  }
  
  notes.push({
    type: 'info',
    message: 'Remember to add nullable="true" fieldattribute to any mandatory date/time fields that are excluded from replan'
  });
  
  return { 
    xml: `${replanButton}\n${replanField}`,
    notes 
  };
}

function generateConfirmXML(): string {
  return '<webusercontrol name="Confirm" />';
}

function generateViewPropertiesXML(formName: string): { xml: string; note: DeveloperNote } {
  const xml = `<viewproperties>
  <viewtext>
    <text>${escapeXML(formName)}</text>
  </viewtext>
</viewproperties>`;
  
  const note: DeveloperNote = {
    type: 'info',
    message: 'Consider setting view properties dynamically in JavaScript for better control (e.g., displaying date/time fields in the document list)'
  };
  
  return { xml, note };
}

function generateFormComment(): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  });
  
  return `<comment>
  Created: ${dateStr}   By: CNBuilder           Ref: AUTO       Version: 1
  Desc.  : Created with CNBuilder form designer
  Changelog: 
</comment>`;
}

export function generateCareNotesXML(options: XMLGeneratorOptions): { xml: string; notes: DeveloperNote[] } {
  const developerNotes: DeveloperNote[] = [];
  const xmlParts: string[] = [];
  
  // Start form
  xmlParts.push(`<form name="${escapeXML(options.formName)}">`);
  
  // Add form comment
  xmlParts.push(generateFormComment());
  
  // Add replan elements if enabled
  if (options.replannable) {
    const { xml, notes } = generateReplanXML(options.confirmable);
    xmlParts.push(xml);
    developerNotes.push(...notes);
  }
  
  // Add confirm web user control if enabled
  if (options.confirmable) {
    xmlParts.push(generateConfirmXML());
  }
  
  // Add view properties
  const { xml: viewPropsXML, note: viewPropsNote } = generateViewPropertiesXML(options.formName);
  xmlParts.push(viewPropsXML);
  developerNotes.push(viewPropsNote);
  
  // Collect all action buttons from all sections/rows
  const actionButtons: FormWidget[] = [];
  options.sections.forEach(section => {
    section.rows.forEach(row => {
      row.widgets.forEach(widget => {
        if (widget.type === WidgetType.ACTION_BUTTON) {
          actionButtons.push(widget);
        }
      });
    });
  });
  
  // Generate action buttons
  actionButtons.forEach(button => {
    const { xml, note } = generateActionButtonXML(button);
    xmlParts.push(xml);
    developerNotes.push(note);
  });
  
  // Generate all sections
  const allPicklists: string[] = [];
  options.sections.forEach(section => {
    const { xml, picklists, notes } = generateSectionXML(section);
    xmlParts.push(xml);
    allPicklists.push(...picklists);
    developerNotes.push(...notes);
  });
  
  // Add all unique picklists after sections
  const uniquePicklists = [...new Set(allPicklists)];
  uniquePicklists.forEach(picklist => {
    xmlParts.push(picklist);
  });
  
  // Close form
  xmlParts.push('</form>');
  
  // Add developer notes section as XML comments
  if (developerNotes.length > 0) {
    xmlParts.push('\n<!-- ========================================= -->');
    xmlParts.push('<!-- DEVELOPER NOTES -->');
    xmlParts.push('<!-- ========================================= -->');
    
    // Group notes by type
    const warnings = developerNotes.filter(n => n.type === 'warning');
    const picklists = developerNotes.filter(n => n.type === 'picklist');
    const actions = developerNotes.filter(n => n.type === 'action');
    const info = developerNotes.filter(n => n.type === 'info');
    
    if (warnings.length > 0) {
      xmlParts.push('\n<!-- WARNINGS -->');
      warnings.forEach(note => xmlParts.push(`<!-- ${note.message} -->`));
    }
    
    if (picklists.length > 0) {
      xmlParts.push('\n<!-- PICKLISTS TO CREATE -->');
      picklists.forEach(note => xmlParts.push(`<!-- ${note.message} -->`));
    }
    
    if (actions.length > 0) {
      xmlParts.push('\n<!-- ACTION BUTTONS / JAVASCRIPT REQUIRED -->');
      actions.forEach(note => xmlParts.push(`<!-- ${note.message} -->`));
    }
    
    if (info.length > 0) {
      xmlParts.push('\n<!-- ADDITIONAL NOTES -->');
      info.forEach(note => xmlParts.push(`<!-- ${note.message} -->`));
    }
  }
  
  const xml = xmlParts.join('\n');
  
  return {
    xml,
    notes: developerNotes
  };
}
