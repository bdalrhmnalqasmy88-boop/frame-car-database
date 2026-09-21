import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowRight, Camera, ImagePlus, Save, X } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/lib/theme';
import { getCarById, updateCar } from '@/lib/api';
import type { CarFrame } from '@/lib/supabase';

export default function EditCarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const car = await getCarById(id);
      if (car) {
        setMake(car.make);
        setModel(car.model);
        setYear(car.year?.toString() || '');
        setWidth(car.width_cm?.toString() || '');
        setHeight(car.height_cm?.toString() || '');
        setNotes(car.notes || '');
        setCurrentImageUrl(car.image_url);
      }
      setLoading(false);
    })();
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setCurrentImageUrl(null);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('يلزم إذن الكاميرا لالتقاط الصور');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setCurrentImageUrl(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!make.trim() || !model.trim()) {
      setError('الماركة والموديل مطلوبان');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSaving(true);
    try {
      await updateCar(id, {
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year) : null,
        width_cm: width ? parseFloat(width) : null,
        height_cm: height ? parseFloat(height) : null,
        image_url: imageUri ? imageUri : undefined,
        notes: notes.trim() || null,
      }, imageUri);

      Alert.alert('تم الحفظ', 'تم تحديث البيانات بنجاح', [
        { text: 'حسناً', onPress: () => router.replace(`/car/${id}`) },
      ]);
    } catch (e) {
      setError('فشل تحديث البيانات محلياً. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
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

  const displayImage = imageUri || currentImageUrl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowRight size={22} color={Colors.neutral[700]} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تعديل السيارة</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled">
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.imageSection}>
            {displayImage ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: displayImage }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => { setImageUri(null); setCurrentImageUrl(null); }}>
                  <X size={16} color={Colors.neutral[0]} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerRow}>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={takePhoto}>
                  <Camera size={22} color={Colors.primary[600]} strokeWidth={2} />
                  <Text style={styles.imagePickerText}>التقاط صورة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  <ImagePlus size={22} color={Colors.primary[600]} strokeWidth={2} />
                  <Text style={styles.imagePickerText}>اختيار صورة</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.label}>الماركة *</Text>
              <TextInput
                style={styles.input}
                value={make}
                onChangeText={setMake}
                placeholder="Toyota"
                placeholderTextColor={Colors.neutral[400]}
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>الموديل *</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="Hilux"
                placeholderTextColor={Colors.neutral[400]}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>سنة الصنع</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="2020"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.label}>العرض (سم)</Text>
              <TextInput
                style={styles.input}
                value={width}
                onChangeText={setWidth}
                placeholder="120"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>الارتفاع (سم)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="30"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ملاحظات</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="تفاصيل عن الانحناءات أو الحواف..."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={4}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.neutral[0]} />
            ) : (
              <>
                <Save size={20} color={Colors.neutral[0]} strokeWidth={2} />
                <Text style={styles.saveButtonText}>حفظ التعديلات</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    color: Colors.neutral[900],
  },
  form: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  errorBanner: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
    color: Colors.error[700],
    textAlign: 'center',
  },
  imageSection: {
    marginBottom: Spacing.lg,
  },
  imagePreviewWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imagePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  imagePickerText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.primary[600],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  field: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs + 2,
  },
  input: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: 'Cairo-Regular',
    fontSize: 15,
    color: Colors.neutral[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    color: Colors.neutral[0],
  },
});
