import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Ruler,
  Calendar,
  Pencil,
  Trash2,
  ImageOff,
  Copy,
  FileText,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/lib/theme';
import { getCarById, deleteCar } from '@/lib/api';
import type { CarFrame } from '@/lib/supabase';

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<CarFrame | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await getCarById(id);
    setCar(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = () => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه السيارة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCar(id);
            router.replace('/');
          } catch (e) {
            Alert.alert('خطأ', 'فشل حذف السيارة');
          }
        },
      },
    ]);
  };

  const handleCopyDimensions = () => {
    if (!car) return;
    const text = `${car.make} ${car.model}${car.year ? ` ${car.year}` : ''}\nالعرض: ${car.width_cm} سم\nالارتفاع: ${car.height_cm} سم${car.notes ? `\nملاحظات: ${car.notes}` : ''}`;
    Share.share({ message: text });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowRight size={22} color={Colors.neutral[700]} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>غير موجود</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>لم يتم العثور على هذه السيارة</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight size={22} color={Colors.neutral[700]} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {car.make} {car.model}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image */}
        <View style={styles.imageWrap}>
          {car.image_url ? (
            <Image source={{ uri: car.image_url }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageOff size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
              <Text style={styles.imagePlaceholderText}>لا توجد صورة</Text>
            </View>
          )}
        </View>

        {/* Info chips */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>الماركة</Text>
              <Text style={styles.infoValue}>{car.make}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>الموديل</Text>
              <Text style={styles.infoValue}>{car.model}</Text>
            </View>
          </View>

          {car.year != null && (
            <View style={styles.detailRow}>
              <Calendar size={20} color={Colors.primary[600]} strokeWidth={2} />
              <Text style={styles.detailLabel}>سنة الصنع</Text>
              <Text style={styles.detailValue}>{car.year}</Text>
            </View>
          )}

          {(car.width_cm != null || car.height_cm != null) && (
            <View style={styles.dimensionsCard}>
              <View style={styles.dimensionsHeader}>
                <Ruler size={20} color={Colors.accent[600]} strokeWidth={2} />
                <Text style={styles.dimensionsTitle}>المقاسات</Text>
              </View>
              <View style={styles.dimensionsRow}>
                <View style={styles.dimensionBox}>
                  <Text style={styles.dimensionValue}>
                    {car.width_cm != null ? `${car.width_cm}` : '-'}
                  </Text>
                  <Text style={styles.dimensionUnit}>سم (العرض)</Text>
                </View>
                <View style={styles.dimensionDivider} />
                <View style={styles.dimensionBox}>
                  <Text style={styles.dimensionValue}>
                    {car.height_cm != null ? `${car.height_cm}` : '-'}
                  </Text>
                  <Text style={styles.dimensionUnit}>سم (الارتفاع)</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyDimensions}>
                <Copy size={16} color={Colors.primary[600]} strokeWidth={2} />
                <Text style={styles.copyText}>نسخ المقاسات</Text>
              </TouchableOpacity>
            </View>
          )}

          {car.notes && (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <FileText size={18} color={Colors.neutral[600]} strokeWidth={2} />
                <Text style={styles.notesTitle}>ملاحظات</Text>
              </View>
              <Text style={styles.notesText}>{car.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/car/${car.id}/edit`)}>
          <Pencil size={20} color={Colors.primary[600]} strokeWidth={2} />
          <Text style={styles.editButtonText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={20} color={Colors.error[600]} strokeWidth={2} />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 17,
    color: Colors.neutral[900],
    flex: 1,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[400],
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: Spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  imagePlaceholderText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[400],
  },
  infoSection: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
  },
  infoLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  dimensionsCard: {
    backgroundColor: Colors.accent[50],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent[100],
    padding: Spacing.md,
  },
  dimensionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dimensionsTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    color: Colors.accent[800],
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionBox: {
    flex: 1,
    alignItems: 'center',
  },
  dimensionValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 28,
    color: Colors.accent[800],
  },
  dimensionUnit: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.accent[700],
    marginTop: 4,
  },
  dimensionDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.accent[100],
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  copyText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 13,
    color: Colors.primary[600],
  },
  notesCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  notesTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  notesText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  editButtonText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 15,
    color: Colors.primary[600],
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error[50],
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error[100],
  },
  deleteButtonText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 15,
    color: Colors.error[600],
  },
});
