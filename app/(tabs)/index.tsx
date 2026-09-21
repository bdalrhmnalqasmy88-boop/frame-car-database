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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PlusCircle, Search, Car, Ruler, Calendar, WifiOff, ImageOff } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/lib/theme';
import { fetchAllCars, type FetchResult } from '@/lib/api';
import type { CarFrame } from '@/lib/supabase';

export default function HomeScreen() {
  const [result, setResult] = useState<FetchResult>({ cars: [], fromCache: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await fetchAllCars();
    setResult(r);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
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
            <ImageOff size={32} color={Colors.neutral[300]} strokeWidth={1.5} />
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
              <Calendar size={13} color={Colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.metaText}>{item.year}</Text>
            </View>
          )}
          {item.width_cm != null && item.height_cm != null && (
            <View style={styles.metaChip}>
              <Ruler size={13} color={Colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.metaText}>
                {item.width_cm} × {item.height_cm} سم
              </Text>
            </View>
          )}
        </View>
        {item.notes ? (
          <Text style={styles.cardNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>فريم</Text>
            <Text style={styles.headerSubtitle}>قاعدة بيانات مقاسات فريمات السيارات</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
            <PlusCircle size={22} color={Colors.neutral[0]} strokeWidth={2} />
          </Pressable>
        </View>

        <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
          <Search size={20} color={Colors.neutral[400]} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>ابحث عن سيارة أو موديل أو سنة...</Text>
        </Pressable>
      </View>

      {result.fromCache && result.cars.length > 0 && (
        <View style={styles.offlineBanner}>
          <WifiOff size={15} color={Colors.warning[600]} strokeWidth={2} />
          <Text style={styles.offlineText}>عرض دون اتصال - آخر نسخة محفوظة</Text>
        </View>
      )}

      <FlatList
        data={result.cars}
        keyExtractor={(item) => item.id}
        renderItem={renderCar}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Car size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد سيارات بعد</Text>
              <Text style={styles.emptyText}>
                ابدأ بإضافة أول سيارة لقاعدة البيانات
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/add')}>
                <Text style={styles.emptyButtonText}>إضافة سيارة</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 26,
    color: Colors.primary[700],
  },
  headerSubtitle: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary[600],
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[400],
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning[100],
  },
  offlineText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.warning[600],
  },
  list: {
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
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
    padding: Spacing.md,
  },
  cardTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 15,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
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
    fontSize: 11,
    color: Colors.neutral[600],
  },
  cardNotes: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    width: 88,
    height: 88,
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  emptyButtonText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.neutral[0],
  },
});
