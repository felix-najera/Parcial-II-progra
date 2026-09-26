
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/database/supabase';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Alumno = {
  id: number;
  nombre: string;
  carnet: string;
  carrera: string;
};

export default function alumnosScreen() {
  const theme = useTheme();

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del formulario que aparece en el Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState<Alumno | null>(null);

  const [nombre, setNombre] = useState('');
  const [carnet, setCarnet] = useState('');
  const [Carrera, setCarrera] = useState('');

  const [guardando, setGuardando] = useState(false);

  const cargarAlumnos = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .order('id');

      if (error) {
        Alert.alert('Ha ocurrido un error', error.message);
        return;
      }

      setAlumnos((data ?? []) as Alumno[]);
    } catch (err) {
      Alert.alert(
        'Ha ocurrido un error',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const abrirNuevo = () => {
    setAlumnoEditando(null);
    setNombre('');
    setCarnet('');
    setCarrera('');
    setModalVisible(true);
  };

  const abrirEdicion = (alumno: Alumno) => {
    setAlumnoEditando(alumno);
    setNombre(alumno.nombre);
    setCarnet(alumno.carnet);
    setCarrera(alumno.carrera);
    setModalVisible(true);
  };

  const guardarAlumno = async () => {
    // Validar que todos los campos tengan información
    if (
      !nombre.trim() ||
      !String(carnet).trim() ||
      !Carrera.trim()
    ) {
      Alert.alert(
        'Datos incompletos',
        'Todos los datos son obligatorios.'
      );
      return;
    }

    setGuardando(true);

    try {
      // Carrera se guarda como TEXTO
      const datos = {
        nombre: nombre.trim(),
        carnet: String(carnet).trim(),
        carrera: Carrera.trim(),
      };

      const resultado = alumnoEditando
        ? await supabase
            .from('alumnos')
            .update(datos)
            .eq('id', alumnoEditando.id)
        : await supabase
            .from('alumnos')
            .insert(datos);

      if (resultado.error) {
        console.log('ERROR SUPABASE:', resultado.error);

        Alert.alert(
          'Error Supabase',
          resultado.error.message
        );

        return;
      }

      // Cerrar modal
      setModalVisible(false);

      // Limpiar formulario
      setNombre('');
      setCarnet('');
      setCarrera('');
      setAlumnoEditando(null);

      // Volver a cargar alumnos
      cargarAlumnos();

    } catch (err) {
      Alert.alert(
        'Ha ocurrido un error',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAlumno = async (alumno: Alumno) => {
    try {
      const { error } = await supabase
        .from('alumnos')
        .delete()
        .eq('id', alumno.id);

      if (error) {
        Alert.alert('Ha ocurrido un error', error.message);
        return;
      }

      setAlumnos((prev) =>
        prev.filter((item) => item.id !== alumno.id)
      );

    } catch (err) {
      Alert.alert(
        'Ha ocurrido un error',
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const confirmarEliminacion = (alumno: Alumno) => {
    // En web usamos confirm()
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      if (
        window.confirm(
          `¿Deseas eliminar "${alumno.nombre}"?`
        )
      ) {
        eliminarAlumno(alumno);
      }

      return;
    }

    Alert.alert(
      'Eliminar Alumno',
      `¿Deseas eliminar "${alumno.nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarAlumno(alumno),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Alumno }) => (
    <ThemedView
      type="backgroundElement"
      style={styles.card}
    >
      <ThemedView
        type="backgroundElement"
        style={styles.cardInfo}
      >
        <ThemedText type="smallBold">
          {item.nombre}
        </ThemedText>

        <ThemedText type="smallBold">
          Carrera: {item.carrera}
        </ThemedText>

        <ThemedText type="smallBold">
          Carnet: {item.carnet}
        </ThemedText>
      </ThemedView>

      <ThemedView
        type="backgroundElement"
        style={styles.cardActions}
      >
        <Pressable
          style={({ pressed }) =>
            pressed && styles.pressed
          }
          onPress={() => abrirEdicion(item)}
        >
          <ThemedView
            type="backgroundSelected"
            style={styles.editButton}
          >
            <ThemedText
              type="small"
              style={styles.editButtonText}
            >
              Editar
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable
          style={({ pressed }) =>
            pressed && styles.pressed
          }
          onPress={() =>
            confirmarEliminacion(item)
          }
        >
          <ThemedView style={styles.deleteButton}>
            <ThemedText
              type="small"
              style={styles.deleteButtonText}
            >
              Eliminar
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">
            Alumnos
          </ThemedText>

          <Pressable
            style={({ pressed }) =>
              pressed && styles.pressed
            }
            onPress={abrirNuevo}
          >
            <ThemedView
              type="backgroundSelected"
              style={styles.newProductButton}
            >
              <ThemedText
                type="small"
                style={styles.editButtonText}
              >
                + Nuevo Alumno
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.emptyText}
          >
            Cargando alumnos…
          </ThemedText>

        ) : alumnos.length === 0 ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.emptyText}
          >
            No hay alumnos registrados.
          </ThemedText>

        ) : (
          <FlatList
            data={alumnos}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderItem}
            contentContainerStyle={
              styles.listContent
            }
          />
        )}

      </SafeAreaView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>

          <ThemedView
            type="backgroundElement"
            style={styles.modalCard}
          >

            <ThemedText type="subtitle">
              {alumnoEditando
                ? 'Editar alumno'
                : 'Nuevo alumno'}
            </ThemedText>

            {/* NOMBRE */}
            <ThemedView
              type="backgroundElement"
              style={styles.field}
            >
              <ThemedText type="smallBold">
                Nombre
              </ThemedText>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme.background,
                    color: theme.text,
                  },
                ]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor={
                  theme.textSecondary
                }
              />
            </ThemedView>

            {/* CARNET */}
            <ThemedView
              type="backgroundElement"
              style={styles.field}
            >
              <ThemedText type="smallBold">
                Carnet
              </ThemedText>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme.background,
                    color: theme.text,
                  },
                ]}
                value={carnet}
                onChangeText={setCarnet}
                placeholder="Ej. 1233"
                placeholderTextColor={
                  theme.textSecondary
                }
              />
            </ThemedView>

            {/* CARRERA */}
            <ThemedView
              type="backgroundElement"
              style={styles.field}
            >
              <ThemedText type="smallBold">
                Carrera
              </ThemedText>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme.background,
                    color: theme.text,
                  },
                ]}
                value={Carrera}
                onChangeText={setCarrera}
                placeholder="Ej. Ingeniería en Sistemas"
                placeholderTextColor={
                  theme.textSecondary
                }
              />
            </ThemedView>

            {/* GUARDAR */}
            <Pressable
              disabled={guardando}
              style={({ pressed }) =>
                pressed && styles.pressed
              }
              onPress={guardarAlumno}
            >
              <ThemedView
                type="backgroundSelected"
                style={styles.saveButton}
              >
                <ThemedText
                  type="small"
                  style={styles.saveButtonText}
                >
                  {guardando
                    ? 'Guardando…'
                    : 'Guardar Alumno'}
                </ThemedText>
              </ThemedView>
            </Pressable>

            {/* CANCELAR */}
            <Pressable
              style={({ pressed }) =>
                pressed && styles.pressed
              }
              onPress={() =>
                setModalVisible(false)
              }
            >
              <ThemedView
                style={styles.cancelButton}
              >
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                >
                  Cancelar
                </ThemedText>
              </ThemedView>
            </Pressable>

          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom:
      BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },

  header: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    alignSelf: 'stretch',
  },

  newProductButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },

  listContent: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },

  cardInfo: {
    flex: 1,
    gap: Spacing.half,
  },

  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },

  editButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },

  editButtonText: {
    fontWeight: '700',
  },

  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.5)',
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },

  field: {
    gap: Spacing.two,
  },

  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },

  saveButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },

  saveButtonText: {
    fontWeight: '700',
  },

  cancelButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
