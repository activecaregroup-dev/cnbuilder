import { FormSection, FormRow, FormWidget, WidgetType } from '@/types/form';

interface XMLGeneratorOptions {
  formName: string;
  replannable: boolean;
  confirmable: boolean;
  sections: FormSection[];
  tabName?: string;
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

function calculateRowColspan(widgets: FormWidget[]): number {
  // Group checkboxes by groupName
  const groupedCheckboxes = new Map<string, FormWidget[]>();
  const ungroupedWidgets: FormWidget[] = [];
  
  widgets.forEach(widget => {
    if (widget.type === WidgetType.INSTRUCTION_NOTE || widget.type === WidgetType.ACTION_BUTTON || widget.type === WidgetType.LABEL) {
      return; // Skip these
    }
    
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
  
  let total = 0;
  
  // Count ungrouped widgets
  // Each widget contributes: label (1 col) + field (widget.colspan - 1 cols) = widget.colspan total
  ungroupedWidgets.forEach(widget => {
    const widgetColspan = widget.colspan || 2; // Default to 2 if not specified
    total += widgetColspan; // Widget's total colspan (label + field)
  });
  
  // Count grouped checkboxes (one shared label + all checkbox fields)
  groupedCheckboxes.forEach((checkboxes, groupName) => {
    // Add one label for the group (always 1 column)
    if (checkboxes.length > 0) {
      total += 1; // Label takes 1 column
    }
    
    // Add each checkbox field (each takes widget.colspan - 1 columns)
    checkboxes.forEach(checkbox => {
      const fieldColspan = Math.max(1, (checkbox.colspan || 2) - 1);
      total += fieldColspan;
    });
  });
  
  return total;
}

function calculateSectionMaxColspan(section: FormSection): number {
  let maxColspan = section.cols || 2; // Start with current section cols
  
  section.rows.forEach(row => {
    const rowTotal = calculateRowColspan(row.widgets);
    if (rowTotal > maxColspan) {
      maxColspan = rowTotal;
    }
  });
  
  return maxColspan;
}

function calculateRowAdjustment(widgets: FormWidget[], sectionCols: number): { needsAdjustment: boolean; adjustmentAmount: number; lastWidgetId: string | null } {
  const contentWidgets = widgets.filter(w => 
    w.type !== WidgetType.INSTRUCTION_NOTE && w.type !== WidgetType.ACTION_BUTTON && w.type !== WidgetType.LABEL
  );
  
  if (contentWidgets.length === 0) {
    return { needsAdjustment: false, adjustmentAmount: 0, lastWidgetId: null };
  }
  
  const currentTotal = calculateRowColspan(contentWidgets);
  
  if (currentTotal === sectionCols) {
    return { needsAdjustment: false, adjustmentAmount: 0, lastWidgetId: null };
  }
  
  if (currentTotal < sectionCols) {
    const diff = sectionCols - currentTotal;
    const lastWidget = contentWidgets[contentWidgets.length - 1];
    return { needsAdjustment: true, adjustmentAmount: diff, lastWidgetId: lastWidget.id };
  }
  
  return { needsAdjustment: false, adjustmentAmount: 0, lastWidgetId: null };
}

function isReadOnlyCompatibleType(type: WidgetType): boolean {
  return [
    WidgetType.TEXT_SINGLE_LINE,
    WidgetType.TEXT_MULTI_LINE,
    WidgetType.NUMBER,
    WidgetType.DECIMAL,
    WidgetType.DATE,
    WidgetType.TIME
  ].includes(type);
}

function generateFieldXML(widget: FormWidget, groupName?: string, colspanOverride?: number): string {
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
  
  // Use override if provided, otherwise calculate field colspan
  // Field colspan = widget's total colspan - 1 (since label takes 1 column)
  const fieldColspan = colspanOverride !== undefined 
    ? colspanOverride 
    : Math.max(1, (widget.colspan || 2) - 1); // Minimum field colspan is 1
  
  // Build attributes
  const attrs: string[] = [];
  attrs.push(`name="${escapeXML(fieldName)}"`);
  attrs.push(`type="${fieldType}"`);
  attrs.push(`colspan="${fieldColspan}"`); // Use the calculated colspan
  
  // Add mandatory if required (not for checkboxes)
  // IMPORTANT: RadioButtonList fields MUST be mandatory in CareNotes
  if (widget.type === WidgetType.RADIO_BUTTON_LIST) {
    attrs.push(`mandatory="true"`);
  } else if (widget.properties.required && widget.type !== WidgetType.CHECKBOX) {
    attrs.push(`mandatory="true"`);
  }
  
  // Add checkboxlabel for checkboxes - ALWAYS add it
  if (widget.type === WidgetType.CHECKBOX) {
    const checkboxLabel = widget.properties.checkboxLabel || widget.label;
    attrs.push(`checkboxlabel="${escapeXML(checkboxLabel)}"`);
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
  attrs.push(`colspan="1"`); // Label always takes 1 column
  
  // Add CareNotes styling for labels
  attrs.push(`cellstyle="background:#f7f7f7;border-bottom:1px solid #ccc;"`);
  
  return `    <label ${attrs.join(' ')} />`;
}

function generateLabelXMLWithoutFieldname(widget: FormWidget): string {
  const attrs: string[] = [];
  attrs.push(`caption="${escapeXML(widget.label)}"`);
  attrs.push(`colspan="1"`); // Label always takes 1 column
  
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
  
  // Remove duplicates (case-insensitive) and trim whitespace
  const uniqueOptions = Array.from(
    new Map(
      options
        .filter((opt: string) => opt && opt.trim()) // Remove empty/null options
        .map((opt: string) => [opt.trim().toLowerCase(), opt.trim()]) // Use lowercase as key, trimmed value as value
    ).values()
  ) as string[];
  
  const items = uniqueOptions.map((option: string) => `    <item>${escapeXML(option)}</item>`).join('\n');
  
  const xml = `  <picklist name="${escapeXML(picklistName)}">
${items}
  </picklist>`;
  
  const note: DeveloperNote = {
    type: 'picklist',
    message: `Create picklist "${picklistName}" with options: ${uniqueOptions.join(', ')}`
  };
  
  return { xml, note };
}

function generateRowXML(row: FormRow, section: FormSection): { xml: string; notes: DeveloperNote[]; instructions: string[] } {
  const notes: DeveloperNote[] = [];
  const instructions: string[] = [];
  const sectionCols = section.cols || 2;
  
  // Arrays to hold multiple XML rows if widgets don't fit in one row
  const xmlRows: string[] = [];
  let currentRowParts: string[] = [];
  let currentRowColspan = 0;
  let currentRowReadOnlyComments: string[] = [];
  
  // Helper function to close current row and start a new one
  const closeCurrentRow = () => {
    if (currentRowParts.length > 0) {
      // Pad row if it doesn't fill all section columns
      if (currentRowColspan < sectionCols) {
        const paddingColspan = sectionCols - currentRowColspan;
        currentRowParts.push(`    <label caption="" colspan="${paddingColspan}" />`);
      }
      
      // Build row XML
      const readOnlySection = currentRowReadOnlyComments.length > 0 ? currentRowReadOnlyComments.join('\n') : '';
      const rowContent = readOnlySection
        ? `${readOnlySection}\n${currentRowParts.join('\n')}`
        : currentRowParts.join('\n');
      
      xmlRows.push(`  <row style="white-space:normal;">
${rowContent}
  </row>`);
      
      // Reset for next row
      currentRowParts = [];
      currentRowColspan = 0;
      currentRowReadOnlyComments = [];
    }
  };
  
  // Process each widget
  row.widgets.forEach(widget => {
    // Handle instruction notes - collect separately, don't add to rows
    if (widget.type === WidgetType.INSTRUCTION_NOTE) {
      const instruction = widget.properties.instructions || 'No instructions provided';
      instructions.push(instruction);
      notes.push({ type: 'info', message: instruction });
      return;
    }
    
    // Handle LABEL widgets - they span full width of section
    if (widget.type === WidgetType.LABEL) {
      // Close current row if it has content
      closeCurrentRow();
      
      const hiddenFieldName = widget.fieldName || `lbl_${widget.id.substring(0, 8)}`;
      let inlineStyle = '';
      if (widget.properties.textColor || widget.properties.fontWeight) {
        const styles = [];
        if (widget.properties.textColor && widget.properties.textColor !== '#000000') {
          styles.push(`color: ${widget.properties.textColor}`);
        }
        if (widget.properties.fontWeight === 'bold') {
          styles.push('font-weight: bold');
        }
        if (styles.length > 0) {
          inlineStyle = ` style="${styles.join('; ')};"`;
        }
      }
      
      currentRowParts.push(`    <label caption="${escapeXML(widget.label)}" fieldname="${escapeXML(hiddenFieldName)}" colspan="${sectionCols}"${inlineStyle} />`);
      currentRowParts.push(`    <field name="${escapeXML(hiddenFieldName)}" type="Hidden" />`);
      currentRowColspan = sectionCols; // Mark row as full
      
      if (widget.properties.additionalInstructions) {
        notes.push({
          type: 'info',
          message: `${widget.label}: ${widget.properties.additionalInstructions}`
        });
      }
      
      // Close row immediately after LABEL widget
      closeCurrentRow();
      return;
    }
    
    // Handle ACTION_BUTTON - they span full width of section
    if (widget.type === WidgetType.ACTION_BUTTON) {
      // Close current row if it has content
      closeCurrentRow();
      
      const actionDescription = widget.properties.actionDescription || 'No action description provided';
      const buttonId = widget.fieldName || `btn_${widget.id.substring(0, 8)}`;
      const buttonText = escapeXML(widget.label);
      
      // Style the button element - add height and line-height to ensure text isn't cut off vertically
      const buttonStyle = 'width:auto;min-width:150px;padding:8px 16px;height:auto;min-height:36px;line-height:20px;background-color:#FFE5CC;';
      
      currentRowParts.push(`    <action id="${escapeXML(buttonId)}" text="${buttonText}" type="Button" colspan="${sectionCols}" style="${buttonStyle}">`);
      currentRowParts.push(`      <event eventname="onclick" javascript="UserDefinedJavascript.${escapeXML(buttonId)}_Click();" />`);
      currentRowParts.push(`    </action>`);
      currentRowColspan = sectionCols; // Mark row as full
      
      notes.push({
        type: 'action',
        message: `Button "${widget.label}" (${buttonId}): ${actionDescription}`
      });
      
      // Close row immediately after ACTION_BUTTON
      closeCurrentRow();
      return;
    }
    
    // For regular widgets, each widget always generates label (1 col) + field (1 col) = 2 cols minimum
    // The widget's colspan property is ignored for row-splitting purposes
    const labelColspan = 1;
    const fieldColspan = 1;
    const widgetTotalColspan = labelColspan + fieldColspan; // Always 2
    
    // Check if adding this widget would exceed section cols
    if (currentRowColspan + widgetTotalColspan > sectionCols) {
      // Close current row and start new one
      closeCurrentRow(); 
    }
    
    // Add label (always 1 column)
    if (widget.properties.hideLabel) {
      currentRowParts.push(`    <label caption="" colspan="${labelColspan}" />`);
    } else {
      currentRowParts.push(generateLabelXML(widget));
    }
    
    // Add field (always 1 column for standard widgets)
    currentRowParts.push(generateFieldXML(widget, undefined, fieldColspan));
    
    // Track colspan - add the actual columns we just used
    currentRowColspan += widgetTotalColspan;
    
    // Add read-only comment if needed
    if (widget.properties.readOnly && isReadOnlyCompatibleType(widget.type)) {
      const fieldName = widget.fieldName || sanitizeFieldName(widget.label);
      currentRowReadOnlyComments.push(`    <!-- DEVELOPER NOTE: Field "${escapeXML(fieldName)}" should be set to read-only via JavaScript using: GetControl("${escapeXML(fieldName)}").disabled = true; in the OnLoad event -->`);
    }
    
    // Store additional instructions in notes
    if (widget.properties.additionalInstructions) {
      notes.push({
        type: 'info',
        message: `${widget.label}: ${widget.properties.additionalInstructions}`
      });
    }
    
    // Add picklist note for documentation
    if (widget.type === WidgetType.RADIO_BUTTON_LIST || widget.type === WidgetType.DROPDOWN_LIST) {
      const { note } = generatePicklistXML(widget);
      if (note) notes.push(note);
    }
  });
  
  // Close any remaining row
  closeCurrentRow();
  
  // Add instruction comments at the start if any
  if (instructions.length > 0) {
    const instructionComments = instructions.map(inst => 
      `  <!-- DEVELOPER NOTE: ${escapeXML(inst)} -->`
    ).join('\n');
    xmlRows.unshift(instructionComments);
  }
  
  // Return all XML rows concatenated
  return {
    xml: xmlRows.join('\n'),
    notes,
    instructions
  };
}

function generateSectionXML(section: FormSection): { xml: string; notes: DeveloperNote[] } {
  const allNotes: DeveloperNote[] = [];
  const rowXMLs: string[] = [];
  let pendingInstructions: string[] = [];
  
  // DO NOT auto-adjust section columns - respect user's setting
  // Widgets will be split into multiple rows if they don't fit
  const sectionCols = section.cols || 2;
  
  section.rows.forEach(row => {
    const { xml, notes, instructions } = generateRowXML(row, section);
    
    // If this row has instructions but no content, store them for the next row
    if (!xml && instructions.length > 0) {
      pendingInstructions.push(...instructions);
      allNotes.push(...notes);
      return;
    }
    
    // If we have pending instructions from previous empty rows, add them before this row
    if (pendingInstructions.length > 0 && xml) {
      const instructionComments = pendingInstructions.map(inst => 
        `  <!-- DEVELOPER NOTE: ${escapeXML(inst)} -->`
      ).join('\n');
      rowXMLs.push(instructionComments);
      pendingInstructions = [];
    }
    
    if (xml) {
      rowXMLs.push(xml);
      allNotes.push(...notes);
    }
  });
  
  // If there are still pending instructions at the end of the section, add them
  if (pendingInstructions.length > 0) {
    const instructionComments = pendingInstructions.map(inst => 
      `  <!-- DEVELOPER NOTE: ${escapeXML(inst)} -->`
    ).join('\n');
    rowXMLs.push(instructionComments);
  }
  
  const xml = `<section title="${escapeXML(section.title)}" cols="${sectionCols}">
${rowXMLs.join('\n')}
</section>`;
  
  return { xml, notes: allNotes };
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
  const { formName, sections, replannable, confirmable, tabName } = options;
  const developerNotes: DeveloperNote[] = [];
  const xmlParts: string[] = [];
  
  // Add general colspan warning at start
  developerNotes.push({
    type: 'info',
    message: 'Each row must have total colspan (labels + fields) equal to section cols. Labels and fields both count toward the total.'
  });
  
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
  
  // Note: ACTION_BUTTON widgets are now generated as button fields within sections
  // They are processed during row generation with type="Button"
  
  // Generate all sections
  options.sections.forEach(section => {
    const { xml, notes } = generateSectionXML(section);
    xmlParts.push(xml);
    developerNotes.push(...notes);
  });
  
  // Close form (picklists are NOT embedded - they must be created in CareNotes System Administration)
  xmlParts.push('</form>');
  
  // Add developer notes section as XML comments
  // Always add section if there are notes OR if tab name is specified
  if (developerNotes.length > 0 || tabName) {
    xmlParts.push('\n<!-- ========================================= -->');
    xmlParts.push('<!-- DEVELOPER NOTES -->');
    xmlParts.push('<!-- ========================================= -->');
    
    // Add tab name if specified
    if (tabName) {
      xmlParts.push('\n<!-- TAB INFORMATION -->');
      xmlParts.push(`<!-- This form should be placed in the "${tabName}" tab -->`);  
    }
    
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
      xmlParts.push('\n<!-- PICKLISTS TO CREATE IN CARENOTES SYSTEM ADMINISTRATION -->');
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
