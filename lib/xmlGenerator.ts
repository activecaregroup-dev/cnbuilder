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

// Replan exclusions: metadata only (audit, completion, confirmation, status).
// Clinical/user-entered fields must never be excluded so they carry forward on Replan.
const REPLAN_EXCLUDE_AUTHOR = ['author', 'Author', 'dateCreated', 'DateCreated'];

const REPLAN_EXCLUDE_COMPLETED_BY = ['completedBy', 'CompletedBy', 'completedByID', 'CompletedByID'];

const REPLAN_EXCLUDE_COMPLETE_DATES = [
  'completeDate', 'CompleteDate', 'completeTime', 'CompleteTime',
  'completedDate', 'CompletedDate', 'completedTime', 'CompletedTime'
];

const REPLAN_EXCLUDE_COMPLETE_FLAGS = [
  'CompleteFlagID', 'completeFlagID', 'CompleteFlag', 'completeFlag',
  'Completed', 'completed', 'IsCompleted', 'isCompleted'
];

const REPLAN_EXCLUDE_CONFIRM_FLAGS = [
  'Confirm', 'confirm', 'ConfirmFlagID', 'confirmFlagID', 'Confirm_Flag_ID',
  'ConfirmFlag', 'confirmFlag', 'Confirmed', 'confirmed', 'IsConfirmed', 'isConfirmed'
];

const REPLAN_EXCLUDE_CONFIRM_AUDIT = [
  'ConfirmedBy', 'confirmedBy', 'ConfirmedByID', 'confirmedByID',
  'ConfirmBy', 'confirmBy', 'ConfirmByID', 'confirmByID',
  'ConfirmedDate', 'confirmedDate', 'ConfirmDate', 'confirmDate',
  'ConfirmedTime', 'confirmedTime', 'ConfirmTime', 'confirmTime'
];

const REPLAN_EXCLUDE_STATUS = [
  'Status', 'status', 'StatusID', 'statusID',
  'DocumentStatus', 'documentStatus', 'DocumentStatusID', 'documentStatusID',
  'RecordStatus', 'recordStatus', 'RecordStatusID', 'recordStatusID'
];

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// XML comments must not contain "--" or end with "-"
function commentSafe(str: string): string {
  return str.replace(/-{2,}/g, match => match.split('').join(' ')).replace(/-$/, '- ');
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

function getFieldName(widget: FormWidget): string {
  return widget.fieldName || sanitizeFieldName(widget.label);
}

function isRequired(widget: FormWidget): boolean {
  return Boolean(widget.required || widget.properties?.required);
}

// House style used across ACG CareNotes forms
const LABEL_CELLSTYLE = 'vertical-align:middle; padding:14px 16px; line-height:1.6; font-size:14px; color:#2c3e50; white-space:normal; word-wrap:break-word;';
const LABEL_CELLSTYLE_TOP = 'vertical-align:top; padding:14px 16px; line-height:1.6; font-size:14px; color:#2c3e50; white-space:normal; word-wrap:break-word;';
const FIELD_CELLSTYLE = 'padding:14px 16px;';
const FIELD_CELLSTYLE_TOP = 'vertical-align:top; padding:14px 16px;';
const FIELD_STYLE = 'width:95%;';
const DEFAULT_LABEL_WIDGET_COLOR = '#2c3e50';

// Designer grid columns map onto XML columns so every widget keeps its exact width.
// Each designer column becomes `scale` XML columns (8 XML cols for 1/2/4-column designs),
// so a widget spanning c designer columns becomes label (1) + field (c * scale - 1).
function getColumnScale(designCols: number): number {
  return Math.max(2, Math.round(8 / designCols));
}

function getDesignCols(section: FormSection): number {
  return Math.max(1, section.cols || 2);
}

function getXMLSectionCols(section: FormSection): number {
  const designCols = getDesignCols(section);
  return designCols * getColumnScale(designCols);
}

function getWidgetXMLSpan(widget: FormWidget, designCols: number): number {
  const designSpan = Math.min(designCols, Math.max(1, widget.colspan || 1));
  return designSpan * getColumnScale(designCols);
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

function isMandatory(widget: FormWidget): boolean {
  // IMPORTANT: RadioButtonList fields MUST be mandatory in CareNotes; checkboxes are never mandatory
  if (widget.type === WidgetType.RADIO_BUTTON_LIST) return true;
  if (widget.type === WidgetType.CHECKBOX) return false;
  return isRequired(widget);
}

function isTopAligned(widget: FormWidget): boolean {
  return widget.type === WidgetType.TEXT_MULTI_LINE || widget.type === WidgetType.TEXT_WITH_HISTORY;
}

function getPicklistName(widget: FormWidget): string {
  return widget.properties.picklistName || `UDP_${getFieldName(widget)}`;
}

function collectFormFieldNames(sections: FormSection[]): string[] {
  return sections
    .flatMap(section => section.rows)
    .flatMap(row => row.widgets)
    .filter(widget => ![WidgetType.INSTRUCTION_NOTE, WidgetType.ACTION_BUTTON, WidgetType.LABEL].includes(widget.type))
    .map(getFieldName);
}

function getFieldType(type: WidgetType): string {
  switch (type) {
    case WidgetType.TEXT_SINGLE_LINE: return 'TextSingleLine';
    case WidgetType.TEXT_MULTI_LINE: return 'TextMultiLine';
    case WidgetType.TEXT_WITH_HISTORY: return 'TextMultiLine';
    case WidgetType.DATE: return 'Date';
    case WidgetType.TIME: return 'Time';
    case WidgetType.NUMBER: return 'Number';
    case WidgetType.DECIMAL: return 'Decimal';
    case WidgetType.CHECKBOX: return 'CheckBox';
    case WidgetType.RADIO_BUTTON_LIST: return 'RadioButtonList';
    case WidgetType.DROPDOWN_LIST: return 'DropDownList';
    case WidgetType.SELECT_STAFF: return 'SelectStaff';
    case WidgetType.FILE_UPLOAD: return 'TextSingleLine';
    default: return 'TextSingleLine';
  }
}

function generateFieldXML(widget: FormWidget, fieldColspan: number): string {
  const props = widget.properties || {};
  const attrs: string[] = [];
  attrs.push(`name="${escapeXML(getFieldName(widget))}"`);
  attrs.push(`type="${getFieldType(widget.type)}"`);

  if (isMandatory(widget)) {
    attrs.push(`mandatory="true"`);
  }

  // Read-only uses the readonly attribute, never disabled, so values still post back on save
  if (props.readOnly && isReadOnlyCompatibleType(widget.type)) {
    attrs.push(`readonly="true"`);
  }

  // Picklists are referenced by name only - values are maintained inside CareNotes
  if (widget.type === WidgetType.RADIO_BUTTON_LIST || widget.type === WidgetType.DROPDOWN_LIST) {
    attrs.push(`picklistname="${escapeXML(getPicklistName(widget))}"`);
  }

  // Radio options render side by side, as in the designer
  if (widget.type === WidgetType.RADIO_BUTTON_LIST) {
    attrs.push(`repeatlayout="Flow"`);
    attrs.push(`repeatdirection="Horizontal"`);
  }

  if (widget.type === WidgetType.CHECKBOX) {
    attrs.push(`checkboxlabel="${escapeXML(props.checkboxLabel || widget.label)}"`);
  }

  if ((widget.type === WidgetType.TEXT_SINGLE_LINE || widget.type === WidgetType.TEXT_MULTI_LINE) && props.maxLength) {
    attrs.push(`maxlength="${props.maxLength}"`);
  }

  if (widget.type === WidgetType.NUMBER || widget.type === WidgetType.DECIMAL) {
    if (props.min !== undefined && props.min !== null && props.min !== '') attrs.push(`min="${props.min}"`);
    if (props.max !== undefined && props.max !== null && props.max !== '') attrs.push(`max="${props.max}"`);
  }

  attrs.push(`colspan="${fieldColspan}"`);
  attrs.push(`cellstyle="${isTopAligned(widget) ? FIELD_CELLSTYLE_TOP : FIELD_CELLSTYLE}"`);

  // Field inner style: checkboxes size themselves; multi-line fields keep the designed row height
  if (widget.type === WidgetType.TEXT_MULTI_LINE || widget.type === WidgetType.TEXT_WITH_HISTORY) {
    const rows = widget.type === WidgetType.TEXT_MULTI_LINE ? (props.rows || 3) : 3;
    attrs.push(`style="${FIELD_STYLE} min-height:${rows * 22}px;"`);
  } else if (widget.type !== WidgetType.CHECKBOX) {
    attrs.push(`style="${FIELD_STYLE}"`);
  }

  return `    <field ${attrs.join(' ')} />`;
}

function generateLabelXML(widget: FormWidget): string {
  // Mandatory fields are marked with a leading asterisk, as in the designer
  const caption = isMandatory(widget) ? `*${widget.label}` : widget.label;
  const cellstyle = isTopAligned(widget) ? LABEL_CELLSTYLE_TOP : LABEL_CELLSTYLE;
  return `    <label caption="${escapeXML(caption)}" fieldname="${escapeXML(getFieldName(widget))}" colspan="1" cellstyle="${cellstyle}" />`;
}

// LABEL widget: styled text occupying exactly its designed width, no field
function generateTextLabelXML(widget: FormWidget, colspan: number): string {
  const props = widget.properties || {};
  const color = props.textColor && props.textColor !== '#000000' ? props.textColor : DEFAULT_LABEL_WIDGET_COLOR;
  const styles = ['padding:14px 16px', 'text-align:left', 'line-height:1.6', 'font-size:14px', `color:${color}`];
  if (props.fontWeight === 'bold') {
    styles.push('font-weight:bold');
  }
  styles.push('white-space:normal', 'word-wrap:break-word');
  return `    <label caption="${escapeXML(widget.label)}" colspan="${colspan}" cellstyle="${styles.join('; ')};" />`;
}

function generateActionXML(widget: FormWidget, colspan: number): string {
  const buttonId = widget.fieldName || `btn_${widget.id.substring(0, 8)}`;
  return `    <action id="${escapeXML(buttonId)}" text="${escapeXML(widget.label || 'Button')}" type="Button" class="button" colspan="${colspan}" cellstyle="${FIELD_CELLSTYLE}">
      <event eventname="onclick" javascript="return UserDefinedJavascript.${escapeXML(buttonId)}_Click();" />
    </action>`;
}

function generatePicklistNote(widget: FormWidget): DeveloperNote {
  const picklistName = getPicklistName(widget);
  const options: string[] = widget.properties.options || [];

  // Remove duplicates (case-insensitive) and trim whitespace, preserving the user's order
  const uniqueOptions = Array.from(
    new Map(
      options
        .filter(opt => opt && opt.trim())
        .map(opt => [opt.trim().toLowerCase(), opt.trim()] as [string, string])
    ).values()
  );

  if (uniqueOptions.length === 0) {
    return {
      type: 'warning',
      message: `⚠️ Widget "${widget.label}" has no options configured. Picklist "${picklistName}" will be empty.`
    };
  }

  return {
    type: 'picklist',
    message: `Create picklist "${picklistName}" with options in this order (index 0 first): ${uniqueOptions.map((opt, i) => `[${i}] ${opt}`).join(', ')}`
  };
}

function collectWidgetNotes(widget: FormWidget): DeveloperNote[] {
  const notes: DeveloperNote[] = [];
  const props = widget.properties || {};
  const fieldName = getFieldName(widget);

  switch (widget.type) {
    case WidgetType.ACTION_BUTTON: {
      const buttonId = widget.fieldName || `btn_${widget.id.substring(0, 8)}`;
      notes.push({
        type: 'action',
        message: `Button "${widget.label}" (${buttonId}): define UserDefinedJavascript.${buttonId}_Click (ES5). ${props.actionDescription || 'No action description provided'}`
      });
      break;
    }
    case WidgetType.TIME:
      notes.push({
        type: 'action',
        message: `Time field "${fieldName}": populate current time on click/focus when blank, double-click forces refresh to now (unless click-only is required).`
      });
      break;
    case WidgetType.RADIO_BUTTON_LIST:
    case WidgetType.DROPDOWN_LIST:
      notes.push(generatePicklistNote(widget));
      break;
    case WidgetType.TEXT_WITH_HISTORY:
      notes.push({
        type: 'action',
        message: `Text with history "${fieldName}": exported as TextMultiLine. Previous entries (date, time, author) must be appended via JS/DSDL and kept read-only.`
      });
      break;
    case WidgetType.FILE_UPLOAD:
      notes.push({
        type: 'warning',
        message: `⚠️ File upload "${fieldName}": exported as TextSingleLine placeholder. Use the CareNotes attachment control for real uploads.`
      });
      break;
    case WidgetType.CHECKBOX:
      if (props.groupName) {
        notes.push({
          type: 'info',
          message: `Checkbox "${fieldName}" belongs to group "${props.groupName}".`
        });
      }
      break;
  }

  if (props.placeholder && widget.type === WidgetType.TEXT_SINGLE_LINE) {
    notes.push({
      type: 'action',
      message: `Field "${fieldName}": set placeholder text "${props.placeholder}" via JS on form initialise.`
    });
  }

  if (props.additionalInstructions) {
    notes.push({
      type: 'info',
      message: `${widget.label}: ${props.additionalInstructions}`
    });
  }

  return notes;
}

function generateRowXML(row: FormRow, section: FormSection): { xml: string; notes: DeveloperNote[]; instructions: string[] } {
  const notes: DeveloperNote[] = [];
  const instructions: string[] = [];
  const designCols = getDesignCols(section);
  const sectionCols = getXMLSectionCols(section);

  // A designer row wraps onto a new line when full, exactly like the canvas grid
  const xmlRows: string[] = [];
  let currentRowParts: string[] = [];
  let currentRowColspan = 0;

  const closeCurrentRow = () => {
    if (currentRowParts.length > 0) {
      // Pad row so its colspan total exactly matches the section cols
      if (currentRowColspan < sectionCols) {
        currentRowParts.push(`    <label caption="" colspan="${sectionCols - currentRowColspan}" />`);
      }

      xmlRows.push(`  <row>
${currentRowParts.join('\n')}
  </row>`);

      currentRowParts = [];
      currentRowColspan = 0;
    }
  };

  row.widgets.forEach(widget => {
    // Instruction notes are developer comments only and take no space in the form
    if (widget.type === WidgetType.INSTRUCTION_NOTE) {
      const instruction = widget.properties.instructions || 'No instructions provided';
      instructions.push(instruction);
      notes.push({ type: 'info', message: instruction });
      return;
    }

    const span = getWidgetXMLSpan(widget, designCols);

    if (currentRowColspan + span > sectionCols) {
      closeCurrentRow();
    }

    if (widget.type === WidgetType.LABEL) {
      currentRowParts.push(generateTextLabelXML(widget, span));
    } else if (widget.type === WidgetType.ACTION_BUTTON) {
      currentRowParts.push(generateActionXML(widget, span));
    } else if (widget.properties.hideLabel && widget.type === WidgetType.CHECKBOX) {
      // Checkbox without a label: the checkbox (with its checkboxlabel) fills the widget width
      currentRowParts.push(generateFieldXML(widget, span));
    } else {
      if (widget.properties.hideLabel) {
        currentRowParts.push(`    <label caption="" fieldname="${escapeXML(getFieldName(widget))}" colspan="1" />`);
      } else {
        currentRowParts.push(generateLabelXML(widget));
      }
      currentRowParts.push(generateFieldXML(widget, span - 1));
    }

    currentRowColspan += span;
    notes.push(...collectWidgetNotes(widget));
  });

  closeCurrentRow();

  // Add instruction comments at the start if any (outside of <row> elements)
  if (instructions.length > 0 && xmlRows.length > 0) {
    const instructionComments = instructions.map(inst =>
      `  <!-- DEVELOPER NOTE: ${commentSafe(inst)} -->`
    ).join('\n');
    xmlRows.unshift(instructionComments);
  }

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
  const sectionCols = getXMLSectionCols(section);

  section.rows.forEach(row => {
    const { xml, notes, instructions } = generateRowXML(row, section);
    allNotes.push(...notes);

    // If this row has instructions but no content, store them for the next row
    if (!xml) {
      pendingInstructions.push(...instructions);
      return;
    }

    // If we have pending instructions from previous empty rows, add them before this row
    if (pendingInstructions.length > 0) {
      const instructionComments = pendingInstructions.map(inst =>
        `  <!-- DEVELOPER NOTE: ${commentSafe(inst)} -->`
      ).join('\n');
      rowXMLs.push(instructionComments);
      pendingInstructions = [];
    }

    rowXMLs.push(xml);
  });

  // If there are still pending instructions at the end of the section, add them
  if (pendingInstructions.length > 0) {
    const instructionComments = pendingInstructions.map(inst =>
      `  <!-- DEVELOPER NOTE: ${commentSafe(inst)} -->`
    ).join('\n');
    rowXMLs.push(instructionComments);
  }

  const xml = `<section title="${escapeXML(section.title)}" cols="${sectionCols}">
${rowXMLs.join('\n')}
</section>`;

  return { xml, notes: allNotes };
}

function generateReplanButtonXML(): string {
  return `<action id="ReplanButton" text="Replan" type="Button">
  <event eventname="onclick" javascript="return UserDefinedJavascript.Replan_Click();" />
</action>`;
}

function generateReplanFieldXML(formFieldNames: string[], confirmable: boolean): { xml: string; notes: DeveloperNote[] } {
  const notes: DeveloperNote[] = [];
  const formFieldsLower = new Set(formFieldNames.map(name => name.toLowerCase()));

  // A real CompletedBy field on the form must carry forward and save normally
  const hasRealCompletedBy = formFieldsLower.has('completedby') || formFieldsLower.has('completedbyid');

  const groups = [
    REPLAN_EXCLUDE_AUTHOR,
    hasRealCompletedBy ? [] : REPLAN_EXCLUDE_COMPLETED_BY,
    REPLAN_EXCLUDE_COMPLETE_DATES,
    REPLAN_EXCLUDE_COMPLETE_FLAGS,
    REPLAN_EXCLUDE_CONFIRM_FLAGS,
    REPLAN_EXCLUDE_CONFIRM_AUDIT,
    REPLAN_EXCLUDE_STATUS
  ];

  // Never exclude a field the user placed on the form, even if its name matches a metadata name
  const keptFields: string[] = [];
  const groupXML = groups.map((group, index) => {
    if (index === 1 && hasRealCompletedBy) {
      return '  <!-- Do not exclude CompletedBy or CompletedByID because CompletedBy is a real field on this form -->';
    }
    return group
      .filter(name => {
        if (formFieldsLower.has(name.toLowerCase())) {
          keptFields.push(name);
          return false;
        }
        return true;
      })
      .map(name => `  <fieldattribute name="${name}" value="ExcludeField" />`)
      .join('\n');
  }).filter(Boolean);

  const xml = `<field name="Replan" type="Replan">
${groupXML.join('\n\n')}
</field>`;

  if (keptFields.length > 0) {
    notes.push({
      type: 'warning',
      message: `⚠️ Not excluded from Replan because they are real form fields: ${Array.from(new Set(keptFields)).join(', ')}`
    });
  }

  if (!confirmable) {
    notes.push({
      type: 'warning',
      message: '⚠️ This form is Replannable but not Confirmable. ACG typically requires confirmation before replan.'
    });
  }

  notes.push({
    type: 'action',
    message: 'Replan JS (ES5 only) must define UserDefinedJavascript.Replan_Click: set the Replan flag, store a short-lived session token, unlock all fields, then click the normal CareNotes Save button. Use a form-specific PREFIX_ReplanInProgress / PREFIX_ConfirmedAtLoad / PREFIX_ActiveReplannedCopy namespace.'
  });

  notes.push({
    type: 'action',
    message: 'Replanned copy detection must be token-only with expiry (never compare the new copy\'s CN_Object_ID to the source token). Confirmed originals stay confirmed and locked; replanned copies open editable and unconfirmed.'
  });

  notes.push({
    type: 'info',
    message: 'Replan excludes metadata only (author, completion, confirmation and status fields). All clinical and user-entered fields carry forward.'
  });

  return { xml, notes };
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

  developerNotes.push({
    type: 'info',
    message: 'Each row must have total colspan (labels + fields) equal to section cols. Labels and fields both count toward the total.'
  });

  developerNotes.push({
    type: 'info',
    message: 'All JavaScript must be ES5-safe (no let/const, arrow functions, template literals, optional chaining or padStart) and live under window.UserDefinedJavascript. Preserve and call any previous OnAfterFormInitialise / OnBeforeCheckData handlers.'
  });

  const readOnlyFields = sections
    .flatMap(section => section.rows)
    .flatMap(row => row.widgets)
    .filter(widget => widget.properties?.readOnly && isReadOnlyCompatibleType(widget.type))
    .map(getFieldName);

  if (readOnlyFields.length > 0) {
    developerNotes.push({
      type: 'info',
      message: `Read-only fields (${readOnlyFields.join(', ')}) use readonly="true". Do not disable them - disabled fields do not post back on save.`
    });
  }

  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push(`<form name="${escapeXML(formName)}" title="${escapeXML(formName)}">`);
  xmlParts.push(generateFormComment());

  // Replan button must come before the Confirm control
  if (replannable) {
    xmlParts.push(generateReplanButtonXML());
  }

  if (confirmable) {
    xmlParts.push(generateConfirmXML());
  }

  if (replannable) {
    const { xml, notes } = generateReplanFieldXML(collectFormFieldNames(sections), confirmable);
    xmlParts.push(xml);
    developerNotes.push(...notes);
  }

  // Add view properties
  const { xml: viewPropsXML, note: viewPropsNote } = generateViewPropertiesXML(formName);
  xmlParts.push(viewPropsXML);
  developerNotes.push(viewPropsNote);

  // Generate all sections
  sections.forEach(section => {
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
      xmlParts.push(`<!-- This form should be placed in the "${commentSafe(tabName)}" tab -->`);
    }

    // Group notes by type
    const warnings = developerNotes.filter(n => n.type === 'warning');
    const picklists = developerNotes.filter(n => n.type === 'picklist');
    const actions = developerNotes.filter(n => n.type === 'action');
    const info = developerNotes.filter(n => n.type === 'info');

    if (warnings.length > 0) {
      xmlParts.push('\n<!-- WARNINGS -->');
      warnings.forEach(note => xmlParts.push(`<!-- ${commentSafe(note.message)} -->`));
    }

    if (picklists.length > 0) {
      xmlParts.push('\n<!-- PICKLISTS TO CREATE IN CARENOTES SYSTEM ADMINISTRATION -->');
      picklists.forEach(note => xmlParts.push(`<!-- ${commentSafe(note.message)} -->`));
    }

    if (actions.length > 0) {
      xmlParts.push('\n<!-- ACTION BUTTONS / JAVASCRIPT REQUIRED -->');
      actions.forEach(note => xmlParts.push(`<!-- ${commentSafe(note.message)} -->`));
    }

    if (info.length > 0) {
      xmlParts.push('\n<!-- ADDITIONAL NOTES -->');
      info.forEach(note => xmlParts.push(`<!-- ${commentSafe(note.message)} -->`));
    }
  }

  const xml = xmlParts.join('\n');

  return {
    xml,
    notes: developerNotes
  };
}
