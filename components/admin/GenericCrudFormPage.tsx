import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../shared/Card';
import FormButton from '../shared/FormButton';
import FormInput from '../shared/FormInput';
import FormPicker from '../shared/FormPicker';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import apiService from '../../services/api';
import { GenericCrudConfig, GenericCrudField, GenericCrudOption, PrimitiveValue } from './genericCrudTypes';

interface GenericCrudFormPageProps<T extends Record<string, any>> {
  config: GenericCrudConfig<T>;
  id?: string;
  backPath?: string;
}

const getDefaultFieldValue = (field: GenericCrudField): PrimitiveValue => {
  if (field.type === 'boolean') {
    return false;
  }
  if (field.type === 'number') {
    return '';
  }
  return '';
};

export default function GenericCrudFormPage<T extends Record<string, any>>({
  config,
  id,
  backPath = '/admin/social',
}: GenericCrudFormPageProps<T>) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [formValues, setFormValues] = useState<Record<string, PrimitiveValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [associationOptions, setAssociationOptions] = useState<Record<string, GenericCrudOption[]>>({});

  const getNestedValue = (source: Record<string, any>, path: string): any => {
    return path.split('.').reduce((value, segment) => {
      if (value == null) {
        return undefined;
      }
      return value[segment];
    }, source as any);
  };

  const createDefaultValues = useCallback((): Record<string, PrimitiveValue> => {
    const baseValues = config.fields.reduce<Record<string, PrimitiveValue>>((accumulator, field) => {
      accumulator[field.key] = getDefaultFieldValue(field);
      return accumulator;
    }, {});

    return {
      ...baseValues,
      ...(config.initialFormValues ?? {}),
    };
  }, [config.fields, config.initialFormValues]);

  React.useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setScreenError(null);

      const defaults = createDefaultValues();

      if (!id) {
        setSelectedItem(null);
        setFormValues(defaults);
        setIsLoading(false);
        return;
      }

      try {
        if (!config.endpoints.getById) {
          throw new Error(`No getById endpoint configured for ${config.entityName}.`);
        }

        const item = await apiService.get<T>(`${config.endpoints.getById}/${id}`);
        setSelectedItem(item);

        const mappedValues = config.fromItemToForm
          ? config.fromItemToForm(item)
          : config.fields.reduce<Record<string, PrimitiveValue>>((accumulator, field) => {
              accumulator[field.key] = (item[field.key] as PrimitiveValue) ?? getDefaultFieldValue(field);
              return accumulator;
            }, {});

        setFormValues({
          ...defaults,
          ...mappedValues,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to load ${config.entityName}.`;
        setScreenError(message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [config.endpoints.getById, config.entityName, config.fields, config.fromItemToForm, createDefaultValues, id]);

  React.useEffect(() => {
    const loadAssociationOptions = async () => {
      const associationFields = config.fields.filter(
        (field) => field.type === 'association' && field.association,
      );

      if (!associationFields.length) {
        setAssociationOptions({});
        return;
      }

      const nextOptions: Record<string, GenericCrudOption[]> = {};

      await Promise.all(
        associationFields.map(async (field) => {
          try {
            const response = await apiService.get<Record<string, any>[]>(field.association!.endpoint);
            nextOptions[field.key] = response
              .map((item) => {
                const rawValue = getNestedValue(item, field.association!.valuePath);
                const rawLabel = getNestedValue(item, field.association!.labelPath);

                if ((typeof rawValue !== 'string' && typeof rawValue !== 'number') || rawLabel == null) {
                  return null;
                }

                return {
                  value: rawValue,
                  label: String(rawLabel),
                };
              })
              .filter((option): option is GenericCrudOption => option !== null);
          } catch {
            nextOptions[field.key] = [];
          }
        }),
      );

      setAssociationOptions(nextOptions);
    };

    loadAssociationOptions();
  }, [config.fields]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    for (const field of config.fields) {
      if ((field.createOnly && selectedItem) || (field.updateOnly && !selectedItem)) {
        continue;
      }
      if (!field.required) {
        continue;
      }

      const value = formValues[field.key];
      const isEmptyString = typeof value === 'string' && value.trim().length === 0;
      const isMissing = value === null || value === undefined || isEmptyString;

      if (isMissing) {
        nextErrors[field.key] = `${field.label} is required`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const coercePayloadValue = (field: GenericCrudField, value: PrimitiveValue): any => {
    if (field.type === 'number') {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      const coerced = Number(value);
      return Number.isNaN(coerced) ? null : coerced;
    }

    return value;
  };

  const buildDefaultPayload = (): Record<string, any> => {
    return config.fields.reduce<Record<string, any>>((accumulator, field) => {
      if ((field.createOnly && selectedItem) || (field.updateOnly && !selectedItem)) {
        return accumulator;
      }

      accumulator[field.key] = coercePayloadValue(field, formValues[field.key]);
      return accumulator;
    }, {});
  };

  const visibleFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (field.createOnly && selectedItem) {
        return false;
      }
      if (field.updateOnly && !selectedItem) {
        return false;
      }
      return true;
    });
  }, [config.fields, selectedItem]);

  const onCancel = () => {
    router.push(backPath);
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    setScreenError(null);
    setIsSubmitting(true);
    try {
      if (selectedItem) {
        if (config.customUpdate) {
          await config.customUpdate(selectedItem, formValues);
        } else if (config.endpoints.update) {
          const defaultPayload = buildDefaultPayload();
          const payload = config.toUpdatePayload
            ? config.toUpdatePayload(selectedItem, formValues)
            : {
                ...defaultPayload,
                [config.idKey]: selectedItem[config.idKey],
              };

          await apiService.put(config.endpoints.update, payload);
        } else {
          throw new Error(`No update handler configured for ${config.entityName}.`);
        }
      } else {
        if (config.customCreate) {
          await config.customCreate(formValues);
        } else {
          const defaultPayload = buildDefaultPayload();
          const payload = config.toCreatePayload
            ? config.toCreatePayload(formValues)
            : defaultPayload;

          await apiService.post(config.endpoints.create, payload);
        }
      }

      router.push(backPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to save ${config.entityName}.`;
      setScreenError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async () => {
    if (!selectedItem || !config.endpoints.remove) {
      return;
    }

    setScreenError(null);
    setIsSubmitting(true);
    try {
      if (config.customDelete) {
        await config.customDelete(selectedItem);
      } else {
        const recordId = selectedItem[config.idKey];
        await apiService.delete(`${config.endpoints.remove}/${recordId}`);
      }
      router.push(backPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete ${config.entityName}.`;
      setScreenError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = selectedItem ? `Update ${config.entityName}` : `Create ${config.entityName}`;
  const title = selectedItem ? `Edit ${config.entityName}` : `Create ${config.entityName}`;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{title}</Text>

      {screenError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{screenError}</Text>
        </Card>
      ) : null}

      <Card>
        {visibleFields.map((field) => {
          if (field.type === 'boolean') {
            return (
              <View key={field.key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{field.label}</Text>
                <Switch
                  value={Boolean(formValues[field.key])}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}
                  trackColor={{ false: Colors.disabled, true: Colors.primary }}
                  thumbColor={Colors.background}
                />
              </View>
            );
          }

          if ((field.type === 'select' && field.options) || field.type === 'association') {
            return (
              <FormPicker
                key={field.key}
                label={field.label}
                value={typeof formValues[field.key] === 'boolean' ? null : (formValues[field.key] as string | number | null)}
                options={field.type === 'association' ? (associationOptions[field.key] ?? []) : field.options ?? []}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}
                placeholder={field.placeholder}
                error={errors[field.key]}
                required={field.required}
                searchable={field.type === 'association'}
              />
            );
          }

          const keyboardType = field.type === 'number' ? 'numeric' : field.type === 'email' ? 'email-address' : 'default';

          return (
            <FormInput
              key={field.key}
              label={field.label}
              value={String(formValues[field.key] ?? '')}
              onChangeText={(text) => setFormValues((prev) => ({ ...prev, [field.key]: text }))}
              keyboardType={keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={field.type === 'password'}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.key]}
            />
          );
        })}

        <View style={styles.formActions}>
          <FormButton title={submitLabel} onPress={submit} loading={isSubmitting} />
          {selectedItem && config.endpoints.remove ? (
            <FormButton title={`Delete ${config.entityName}`} onPress={remove} variant="danger" disabled={isSubmitting} />
          ) : null}
          <FormButton title="Cancel" onPress={onCancel} variant="secondary" disabled={isSubmitting} />
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.adminBackground,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  switchLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  errorCard: {
    backgroundColor: Colors.errorBackground,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.small,
  },
});
