import { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Screen } from '@/components/ui/Screen';

import {
  FontSize,
  Spacing,
} from '@/constants/theme';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function NewPropertyScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleSave = () => {
    router.replace({
      pathname: '/empresas/[id]/inmuebles',
      params: {
        id,
      },
    });
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.backText,
              {
                color: colors.primary,
              },
            ]}
          >
            ‹ Cancelar
          </Text>
        </Pressable>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Registrar inmueble
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Registra una sucursal, centro de trabajo o instalación.
        </Text>

        <View style={styles.form}>
          <Field
            label="Nombre del inmueble"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Sucursal San Luis de la Paz"
          />

          <Field
            label="Tipo de inmueble"
            value={type}
            onChangeText={setType}
            placeholder="Ej. Sucursal comercial"
          />

          <Field
            label="Dirección"
            value={street}
            onChangeText={setStreet}
            placeholder="Calle, número, colonia..."
          />

          <Field
            label="Municipio"
            value={city}
            onChangeText={setCity}
            placeholder="Ej. San Luis de la Paz"
          />

          <Field
            label="Estado"
            value={state}
            onChangeText={setState}
            placeholder="Ej. Guanajuato"
          />
        </View>

        <View style={styles.actions}>
          <AppButton onPress={handleSave}>
            Guardar inmueble
          </AppButton>

          <AppButton
            variant="ghost"
            onPress={() => router.back()}
          >
            Cancelar
          </AppButton>
        </View>

        <Text
          style={[
            styles.prototypeNotice,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Prototipo visual: los datos todavía no se almacenan.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>

      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.body,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  form: {
    gap: Spacing.lg,
  },

  label: {
    fontSize: FontSize.small,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});