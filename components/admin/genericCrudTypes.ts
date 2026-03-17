export type PrimitiveValue = string | number | boolean | null;

export type GenericCrudFieldType = 'text' | 'email' | 'password' | 'number' | 'boolean' | 'select' | 'association';

export interface GenericCrudOption {
  label: string;
  value: string | number;
}

export interface GenericCrudAssociationConfig {
  endpoint: string;
  valuePath: string;
  labelPath: string;
}

export interface GenericCrudField {
  key: string;
  label: string;
  type: GenericCrudFieldType;
  required?: boolean;
  options?: GenericCrudOption[];
  placeholder?: string;
  createOnly?: boolean;
  updateOnly?: boolean;
  association?: GenericCrudAssociationConfig;
}

interface GenericCrudEndpointConfig {
  list: string;
  getById?: string;
  create: string;
  update?: string;
  remove?: string;
}

export interface GenericCrudTableColumn<T extends Record<string, any>> {
  key: string;
  label?: string;
  render?: (item: T) => string;
}

export interface GenericCrudConfig<T extends Record<string, any>> {
  title: string;
  subtitle?: string;
  entityName: string;
  idKey: keyof T;
  fields: GenericCrudField[];
  tableColumns?: GenericCrudTableColumn<T>[];
  initialFormValues?: Record<string, PrimitiveValue>;
  endpoints: GenericCrudEndpointConfig;
  toCreatePayload?: (formValues: Record<string, PrimitiveValue>) => Record<string, any>;
  toUpdatePayload?: (item: T, formValues: Record<string, PrimitiveValue>) => Record<string, any>;
  fromItemToForm?: (item: T) => Record<string, PrimitiveValue>;
  customCreate?: (formValues: Record<string, PrimitiveValue>) => Promise<void>;
  customUpdate?: (item: T, formValues: Record<string, PrimitiveValue>) => Promise<void>;
  customDelete?: (item: T) => Promise<void>;
}
