export enum WidgetType {
  TEXT_SINGLE_LINE = "TEXT_SINGLE_LINE",
  TEXT_MULTI_LINE = "TEXT_MULTI_LINE",
  TEXT_WITH_HISTORY = "TEXT_WITH_HISTORY",
  DATE = "DATE",
  TIME = "TIME",
  NUMBER = "NUMBER",
  DECIMAL = "DECIMAL",
  CHECKBOX = "CHECKBOX",
  RADIO_BUTTON_LIST = "RADIO_BUTTON_LIST",
  DROPDOWN_LIST = "DROPDOWN_LIST",
  FILE_UPLOAD = "FILE_UPLOAD",
  SELECT_STAFF = "SELECT_STAFF",
  ACTION_BUTTON = "ACTION_BUTTON",
  INSTRUCTION_NOTE = "INSTRUCTION_NOTE",
}

export interface FormWidget {
  id: string;
  type: WidgetType;
  label: string;
  fieldName: string;
  required: boolean;
  colspan: number;
  properties: any;
}

export interface FormRow {
  id: string;
  widgets: FormWidget[];
}

export interface FormSection {
  id: string;
  title: string;
  cols: number;
  rows: FormRow[];
}

export interface Form {
  id: string;
  name: string;
  description: string;
  sections: FormSection[];
  createdAt: Date;
  updatedAt: Date;
}
