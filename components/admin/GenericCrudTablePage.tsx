import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../shared/Card';
import FormButton from '../shared/FormButton';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import apiService from '../../services/api';
import { GenericCrudConfig, GenericCrudTableColumn } from './genericCrudTypes';

interface GenericCrudTablePageProps<T extends Record<string, any>> {
  config: GenericCrudConfig<T>;
  resourceKey: string;
  editRoutePath?: string;
}

export default function GenericCrudTablePage<T extends Record<string, any>>({
  config,
  resourceKey,
  editRoutePath = '/admin/create',
}: GenericCrudTablePageProps<T>) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setScreenError(null);
    try {
      const response = await apiService.get<T[]>(config.endpoints.list);
      setItems(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to load ${config.entityName} list.`;
      setScreenError(message);
    }
  }, [config.endpoints.list, config.entityName]);

  React.useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadItems();
      setIsLoading(false);
    };

    initialize();
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  }, [loadItems]);

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
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderCellValue = (item: T, columnKey: string, render?: (row: T) => string): string => {
    if (render) {
      return render(item);
    }

    const rawValue = item[columnKey];
    if (rawValue === null || rawValue === undefined) {
      return '';
    }
    if (typeof rawValue === 'boolean') {
      return rawValue ? 'True' : 'False';
    }
    if (typeof rawValue === 'object') {
      try {
        return JSON.stringify(rawValue);
      } catch {
        return String(rawValue);
      }
    }
    return String(rawValue);
  };

  const openCreate = () => {
    router.push({
      pathname: editRoutePath,
      params: {
        resource: resourceKey,
        backPath: `/admin/social/${resourceKey}`,
      },
    });
  };

  const openEdit = (item: T) => {
    const id = item[config.idKey];
    router.push({
      pathname: editRoutePath,
      params: {
        resource: resourceKey,
        id: String(id),
        backPath: `/admin/social/${resourceKey}`,
      },
    });
  };

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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>{config.title}</Text>
      {config.subtitle ? <Text style={styles.subtitle}>{config.subtitle}</Text> : null}

      {screenError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{screenError}</Text>
        </Card>
      ) : null}

      <Card style={styles.tableHeaderCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.sectionTitle}>{config.entityName} Table</Text>
          <View style={styles.tableHeaderActions}>
            <FormButton title={`Create ${config.entityName}`} onPress={openCreate} />
          </View>
        </View>
      </Card>

      <Card style={styles.tableCard} padding="sm">
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No {config.entityName.toLowerCase()} records found.</Text>
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
                      style={[styles.tableHeadCell, styles.tableCellWidth]}
                      numberOfLines={1}
                      ellipsizeMode="clip"
                    >
                      {column.label ?? formatColumnHeader(column.key)}
                    </Text>
                  ))}
                </View>

                {items.map((item, rowIndex) => {
                  const id = item[config.idKey];

                  return (
                    <TouchableOpacity
                      key={String(id)}
                      style={[styles.tableBodyRow, rowIndex % 2 === 1 && styles.tableBodyRowAlt]}
                      onPress={() => openEdit(item)}
                    >
                      {tableColumns.map((column) => (
                        <Text
                          key={`${String(id)}-${column.key}`}
                          style={[styles.tableBodyCell, styles.tableCellWidth]}
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  tableHeaderCard: {
    marginBottom: Spacing.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tableHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tableCard: {
    minHeight: 520,
    padding: 0,
  },
  tableContainer: {
    flex: 1,
    height: '100%',
  },
  horizontalTableScroll: {
    flex: 1,
  },
  horizontalTableScrollContent: {
    minWidth: '100%',
  },
  table: {
    minWidth: '100%',
    width: '100%',
  },
  tableHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.lightBackground,
  },
  tableHeadCell: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '700',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableBodyRowAlt: {
    backgroundColor: Colors.secondaryBackground,
  },
  tableBodyCell: {
    fontSize: FontSizes.small,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableCellWidth: {
    width: 180,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  errorCard: {
    backgroundColor: Colors.errorBackground,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.small,
  },
});
