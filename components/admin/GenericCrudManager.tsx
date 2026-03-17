import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Card from "../shared/Card";
import FormButton from "../shared/FormButton";
import FormInput from "../shared/FormInput";
import FormPicker from "../shared/FormPicker";
import {
  Colors,
  FontSizes,
  Shadow,
  Spacing,
  useResponsive,
} from "../../constants/theme";
import apiService from "../../services/api";

type PrimitiveValue = string | number | boolean | null;

export type GenericCrudFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "boolean"
  | "select";

export interface GenericCrudOption {
  label: string;
  value: string | number;
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
}

interface GenericCrudEndpointConfig {
  list: string;
  create: string;
  update?: string;
  remove?: string;
}

interface GenericCrudTableColumn<T extends Record<string, any>> {
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
  renderListLabel: (item: T) => string;
  renderListMeta?: (item: T) => string | undefined;
  toCreatePayload?: (
    formValues: Record<string, PrimitiveValue>,
  ) => Record<string, any>;
  toUpdatePayload?: (
    item: T,
    formValues: Record<string, PrimitiveValue>,
  ) => Record<string, any>;
  fromItemToForm?: (item: T) => Record<string, PrimitiveValue>;
}

interface GenericCrudManagerProps<T extends Record<string, any>> {
  config: GenericCrudConfig<T>;
}

type CrudPanelMode = "create" | "edit" | null;

const getDefaultFieldValue = (field: GenericCrudField): PrimitiveValue => {
  if (field.type === "boolean") {
    return false;
  }
  if (field.type === "number") {
    return "";
  }
  return "";
};

export default function GenericCrudManager<T extends Record<string, any>>({
  config,
}: GenericCrudManagerProps<T>) {
  const responsive = useResponsive();
  const [items, setItems] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [panelMode, setPanelMode] = useState<CrudPanelMode>(null);
  const [formValues, setFormValues] = useState<Record<string, PrimitiveValue>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const createDefaultValues = useCallback((): Record<
    string,
    PrimitiveValue
  > => {
    const baseValues = config.fields.reduce<Record<string, PrimitiveValue>>(
      (accumulator, field) => {
        accumulator[field.key] = getDefaultFieldValue(field);
        return accumulator;
      },
      {},
    );
    return {
      ...baseValues,
      ...(config.initialFormValues ?? {}),
    };
  }, [config.fields, config.initialFormValues]);

  const loadItems = useCallback(async () => {
    setScreenError(null);
    try {
      const response = await apiService.get<T[]>(config.endpoints.list);
      setItems(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to load ${config.entityName} list.`;
      setScreenError(message);
    }
  }, [config.endpoints.list, config.entityName]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    await loadItems();
    setFormValues(createDefaultValues());
    setIsLoading(false);
  }, [createDefaultValues, loadItems]);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  }, [loadItems]);

  const startCreate = () => {
    setSelectedItem(null);
    setPanelMode("create");
    setErrors({});
    setFormValues(createDefaultValues());
  };

  const startEdit = (item: T) => {
    setSelectedItem(item);
    setPanelMode("edit");
    setErrors({});

    const mappedValues = config.fromItemToForm
      ? config.fromItemToForm(item)
      : config.fields.reduce<Record<string, PrimitiveValue>>(
          (accumulator, field) => {
            accumulator[field.key] =
              (item[field.key] as PrimitiveValue) ??
              getDefaultFieldValue(field);
            return accumulator;
          },
          {},
        );

    setFormValues({
      ...createDefaultValues(),
      ...mappedValues,
    });
  };

  const closePanel = () => {
    setPanelMode(null);
    setSelectedItem(null);
    setErrors({});
    setFormValues(createDefaultValues());
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    for (const field of config.fields) {
      if (
        (field.createOnly && selectedItem) ||
        (field.updateOnly && !selectedItem)
      ) {
        continue;
      }

      if (!field.required) {
        continue;
      }

      const value = formValues[field.key];
      const isEmptyString =
        typeof value === "string" && value.trim().length === 0;
      const isMissing = value === null || value === undefined || isEmptyString;

      if (isMissing) {
        nextErrors[field.key] = `${field.label} is required`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const coercePayloadValue = (
    field: GenericCrudField,
    value: PrimitiveValue,
  ): any => {
    if (field.type === "number") {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      const coerced = Number(value);
      return Number.isNaN(coerced) ? null : coerced;
    }

    return value;
  };

  const buildDefaultPayload = (): Record<string, any> => {
    return config.fields.reduce<Record<string, any>>((accumulator, field) => {
      if (
        (field.createOnly && selectedItem) ||
        (field.updateOnly && !selectedItem)
      ) {
        return accumulator;
      }

      accumulator[field.key] = coercePayloadValue(field, formValues[field.key]);
      return accumulator;
    }, {});
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    setScreenError(null);
    setIsSubmitting(true);
    try {
      const defaultPayload = buildDefaultPayload();
      if (selectedItem && config.endpoints.update) {
        const payload = config.toUpdatePayload
          ? config.toUpdatePayload(selectedItem, formValues)
          : {
              ...defaultPayload,
              [config.idKey]: selectedItem[config.idKey],
            };

        await apiService.put(config.endpoints.update, payload);
      } else {
        const payload = config.toCreatePayload
          ? config.toCreatePayload(formValues)
          : defaultPayload;

        await apiService.post(config.endpoints.create, payload);
      }

      await loadItems();
      closePanel();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to save ${config.entityName}.`;
      setScreenError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (item: T) => {
    if (!config.endpoints.remove) {
      return;
    }

    setScreenError(null);
    setIsSubmitting(true);
    try {
      const id = item[config.idKey];
      await apiService.delete(`${config.endpoints.remove}/${id}`);
      await loadItems();
      if (selectedItem && selectedItem[config.idKey] === id) {
        closePanel();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to delete ${config.entityName}.`;
      setScreenError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveSelectedItem = panelMode === "edit" ? selectedItem : null;

  const visibleFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (field.createOnly && effectiveSelectedItem) {
        return false;
      }
      if (field.updateOnly && !effectiveSelectedItem) {
        return false;
      }
      return true;
    });
  }, [config.fields, effectiveSelectedItem]);

  const tableColumns: GenericCrudTableColumn<T>[] = useMemo(() => {
    if (config.tableColumns && config.tableColumns.length > 0) {
      return config.tableColumns;
    }

    const allKeys = new Set<string>();
    items.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    const idKey = String(config.idKey);
    const orderedKeys = Array.from(allKeys).sort((a, b) => {
      if (a === idKey) {
        return -1;
      }
      if (b === idKey) {
        return 1;
      }
      return a.localeCompare(b);
    });

    return orderedKeys.map((key): GenericCrudTableColumn<T> => ({ key }));
  }, [config.idKey, config.tableColumns, items]);

  const formatColumnHeader = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderCellValue = (
    item: T,
    columnKey: string,
    render?: (row: T) => string,
  ): string => {
    if (render) {
      return render(item);
    }

    const rawValue = item[columnKey];
    if (rawValue === null || rawValue === undefined) {
      return "";
    }
    if (typeof rawValue === "boolean") {
      return rawValue ? "True" : "False";
    }
    if (typeof rawValue === "object") {
      try {
        return JSON.stringify(rawValue);
      } catch {
        return String(rawValue);
      }
    }
    return String(rawValue);
  };

  const isPanelOpen = panelMode !== null;

  const submitLabel =
    panelMode === "edit"
      ? `Update ${config.entityName}`
      : `Create ${config.entityName}`;
  const panelTitle =
    panelMode === "edit"
      ? `Edit ${config.entityName}`
      : `Create ${config.entityName}`;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>{config.title}</Text>
      {config.subtitle ? (
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      ) : null}

      {screenError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{screenError}</Text>
        </Card>
      ) : null}

      <Card style={styles.tableHeaderCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.sectionTitle}>{config.entityName} Table</Text>
          <View style={styles.tableHeaderActions}>
            <FormButton
              title={`Create ${config.entityName}`}
              onPress={startCreate}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.tableCard} padding="none">
        {items.length === 0 ? (
          <Text style={styles.emptyText}>
            No {config.entityName.toLowerCase()} records found.
          </Text>
        ) : (
          <View style={styles.tableContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              style={styles.horizontalTableScroll}
              contentContainerStyle={styles.horizontalTableScrollContent}
            >
              <View style={styles.table}>
              <View style={styles.tableHeadRow}>
                {tableColumns.map((column) => (
                  <Text
                    key={column.key}
                    style={[styles.tableHeadCell, styles.tableCellMinWidth]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                  >
                    {column.label ?? formatColumnHeader(column.key)}
                  </Text>
                ))}
              </View>

              {items.map((item, rowIndex) => {
                const id = item[config.idKey];
                const isActive =
                  selectedItem &&
                  selectedItem[config.idKey] === id &&
                  panelMode === "edit";

                return (
                  <TouchableOpacity
                    key={String(id)}
                    style={[
                      styles.tableBodyRow,
                      rowIndex % 2 === 1 && styles.tableBodyRowAlt,
                      isActive && styles.tableBodyRowActive,
                    ]}
                    onPress={() => startEdit(item)}
                  >
                    {tableColumns.map((column) => (
                      <Text
                        key={`${String(id)}-${column.key}`}
                        style={[styles.tableBodyCell, styles.tableCellMinWidth]}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                      >
                        {renderCellValue(item, column.key, column.render)}
                      </Text>
                    ))}
                  </TouchableOpacity>
                );
              })}
              </View>
            </ScrollView>
          </View>
        )}
        {isPanelOpen ? (
          <View
            style={[
              styles.sidePanelOverlay,
              responsive.isMobile && styles.sidePanelOverlayFull,
            ]}
          >
            <ScrollView
              style={styles.sidePanelScroll}
              contentContainerStyle={styles.sidePanelContent}
            >
              <View style={styles.sidePanelHeader}>
                <Text style={styles.sectionTitle}>{panelTitle}</Text>
                <FormButton
                  title="Close"
                  variant="secondary"
                  onPress={closePanel}
                />
              </View>

              {visibleFields.map((field) => {
                if (field.type === "boolean") {
                  return (
                    <View key={field.key} style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{field.label}</Text>
                      <Switch
                        value={Boolean(formValues[field.key])}
                        onValueChange={(value) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.key]: value,
                          }))
                        }
                        trackColor={{
                          false: Colors.disabled,
                          true: Colors.primary,
                        }}
                        thumbColor={Colors.background}
                      />
                    </View>
                  );
                }

                if (field.type === "select" && field.options) {
                  return (
                    <FormPicker
                      key={field.key}
                      label={field.label}
                      value={
                        typeof formValues[field.key] === "boolean"
                          ? null
                          : (formValues[field.key] as string | number | null)
                      }
                      options={field.options}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [field.key]: value,
                        }))
                      }
                      placeholder={field.placeholder}
                      error={errors[field.key]}
                      required={field.required}
                    />
                  );
                }

                const keyboardType =
                  field.type === "number"
                    ? "numeric"
                    : field.type === "email"
                      ? "email-address"
                      : "default";

                return (
                  <FormInput
                    key={field.key}
                    label={field.label}
                    value={String(formValues[field.key] ?? "")}
                    onChangeText={(text) =>
                      setFormValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={field.type === "password"}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={errors[field.key]}
                  />
                );
              })}

              <View style={styles.formActions}>
                <FormButton
                  title={submitLabel}
                  onPress={submit}
                  loading={isSubmitting}
                />
                {panelMode === "edit" &&
                config.endpoints.remove &&
                selectedItem ? (
                  <FormButton
                    title={`Delete ${config.entityName}`}
                    onPress={() => remove(selectedItem)}
                    variant="danger"
                    disabled={isSubmitting}
                  />
                ) : null}
                <FormButton
                  title="Cancel"
                  onPress={closePanel}
                  variant="secondary"
                  disabled={isSubmitting}
                />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.adminBackground,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.adminBackground,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: "700",
    color: Colors.text,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  tableHeaderCard: {
    marginBottom: Spacing.md,
  },
  tableHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  tableCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: 520,
    padding: 0,
  },
  tableContainer: {
    flex: 1,
    height: "100%",
  },
  horizontalTableScroll: {
    flex: 1,
  },
  horizontalTableScrollContent: {
    minWidth: "100%",
  },
  table: {
    minWidth: "100%",
    width: "100%",
  },
  tableHeadRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.lightBackground,
  },
  tableHeadCell: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: "700",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableBodyRowAlt: {
    backgroundColor: Colors.secondaryBackground,
  },
  tableBodyRowActive: {
    backgroundColor: Colors.infoBackground,
  },
  tableBodyCell: {
    fontSize: FontSizes.small,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableCellMinWidth: {
    width: 180,
    overflow: "hidden",
  },
  sidePanelOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 480,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    ...Shadow.medium,
  },
  sidePanelOverlayFull: {
    width: "100%",
  },
  sidePanelScroll: {
    flex: 1,
  },
  sidePanelContent: {
    padding: Spacing.lg,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  switchLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  errorCard: {
    backgroundColor: Colors.errorBackground,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.small,
  },
  listItem: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
  },
  listItemTextWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  listItemTitle: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: "600",
  },
  listItemMeta: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    color: Colors.primary,
    fontSize: FontSizes.small,
    fontWeight: "600",
  },
  deleteText: {
    color: Colors.warning,
  },
});
