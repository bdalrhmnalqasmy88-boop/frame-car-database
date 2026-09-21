import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Ruler, Calendar, WifiOff, ImageOff, X, Car } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/lib/theme';
import { searchCars, type FetchResult } from '@/lib/api';
import type { CarFrame } from '@/lib/supabase';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FetchResult>({ cars: [], fromCache: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q: string) => {
    const r = await searchCars(q);
    setResult(r);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 300);
    return () => clearTimeout(timeout);
  }, [query, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(query);
  };

  const renderCar = ({ item }: { item: CarFrame }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/car/${item.id}`)}
      android_ripple={{ color: Colors.neutral[200] }}>
      <View style={styles.cardImageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <ImageOff size={28} color={Colors.neutral[300]} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.make} {item.model}
        </Text>
        <View style={styles.cardMeta}>
          {item.year != null && (
            <View style={styles.metaChip}>
              <Calendar size={12} color={Colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.metaText}>{item.year}</Text>
            </View>
          )}
          {item.width_cm != null && item.height_cm != null && (
            <View style={styles.metaChip}>
              <Ruler size={12} color={Colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.metaText}>
                {item.width_cm} × {item.height_cm}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>بحث</Text>
        <View style={styles.searchInputWrap}>
          <Search size={20} color={Colors.neutral[400]} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم أو الموديل أو السنة..."
            placeholderTextColor={Colors.neutral[400]}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={Colors.neutral[400]} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {result.fromCache && result.cars.length > 0 && (
        <View style={styles.offlineBanner}>
          <WifiOff size={15} color={Colors.warning[600]} strokeWidth={2} />
          <Text style={styles.offlineText}>عرض دون اتصال</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={result.cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCar}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Car size={40} color={Colors.neutral[300]} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptyText}>
                {query ? `لم نجد نتائج لـ "${query}"` : 'ابدأ بالكتابة للبحث'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 22,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[900],
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  offlineText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.warning[600],
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: Spacing.md,
  },
  cardImageWrap: {
    width: 100,
    height: 100,
    backgroundColor: Colors.neutral[100],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  metaText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.neutral[600],
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
});
