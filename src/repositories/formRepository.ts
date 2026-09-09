import { initialForms } from "@/database/formSeed";

import type {
  FormDefinition,
  FormIntegration,
  FormQuestion,
} from "@/types/form";

/*
 * ============================================================================
 * FORM REPOSITORY
 * ============================================================================
 *
 * Fuente central de formularios dentro de UNIESAP.
 *
 * Persistencia:
 *
 * Android / iOS → SQLite
 * Web           → localStorage
 *
 * Las pantallas y servicios deberán consumir este repository
 * en lugar de acceder directamente a src/data/forms.ts.
 */

export type FormPersistenceAdapter = {
  loadAll: () => Promise<FormDefinition[] | null>;

  insert: (form: FormDefinition) => Promise<void>;

  replace: (form: FormDefinition) => Promise<void>;

  delete: (id: string) => Promise<boolean>;
};

/*
 * ============================================================================
 * INPUT PARA CREAR FORMULARIO
 * ============================================================================
 *
 * Todavía no conectaremos creación visual de formularios,
 * pero dejamos la arquitectura preparada.
 */
export type CreateFormInput = {
  title: string;

  description: string;

  version: string;

  questions: FormQuestion[];

  status?: FormDefinition["status"];

  integration?: FormIntegration;
};

let persistenceAdapter: FormPersistenceAdapter | null = null;

let hydrationPromise: Promise<void> | null = null;

let hydrated = false;

/*
 * ============================================================================
 * ESTADO EN MEMORIA
 * ============================================================================
 *
 * Esta colección se hidrata desde persistencia
 * al iniciar la aplicación.
 */
export const formRepositoryItems: FormDefinition[] =
  initialForms.map(cloneForm);

/*
 * ============================================================================
 * CONFIGURAR PERSISTENCIA
 * ============================================================================
 *
 * Android/iOS utilizará SQLite.
 * Web utilizará localStorage.
 */
export function configureFormRepositoryPersistence(
  adapter: FormPersistenceAdapter,
): void {
  persistenceAdapter = adapter;
}

/*
 * ============================================================================
 * HIDRATAR FORM REPOSITORY
 * ============================================================================
 *
 * Si no existen formularios persistidos:
 *
 * seed
 *   ↓
 * persistencia
 *
 * Si ya existen:
 *
 * persistencia
 *   ↓
 * memoria
 */
export async function hydrateFormRepository(): Promise<void> {
  if (hydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = hydrateInternal();

  return hydrationPromise;
}

async function hydrateInternal(): Promise<void> {
  const adapter = requirePersistenceAdapter();

  const persisted = await adapter.loadAll();

  /*
   * Storage vacío:
   * persistimos los formularios iniciales.
   */
  if (persisted === null) {
    for (const form of formRepositoryItems) {
      await adapter.insert(cloneForm(form));
    }

    hydrated = true;

    console.log(
      `Repositorio de formularios inicializado con ${formRepositoryItems.length} registro(s).`,
    );

    return;
  }

  /*
   * Storage existente:
   *
   * Antes de reemplazar el estado en memoria ejecutamos una
   * migración ligera de metadatos provenientes del seed.
   *
   * ¿Por qué es necesaria?
   *
   * Los formularios iniciales se persistieron anteriormente
   * en SQLite/localStorage. Por lo tanto, modificar únicamente
   * formSeed.ts NO actualiza automáticamente esas copias.
   *
   * Esta migración NO sobrescribe contenido existente.
   *
   * Solamente completa metadatos de integración que:
   *
   * - ahora existen en el seed;
   * - todavía no existen en la copia persistida.
   *
   * Ejemplo actual:
   *
   * form-003 / Señalización
   *
   * Antes:
   * integration = undefined
   *
   * Ahora:
   * integration.provider = "kobo"
   *
   * También completa koboFieldName faltantes en preguntas
   * conocidas del seed.
   */
  const migratedPersisted = await migrateSeedIntegrationMetadata(
    persisted,

    adapter,
  );

  formRepositoryItems.splice(
    0,

    formRepositoryItems.length,

    ...migratedPersisted.map(cloneForm),
  );

  hydrated = true;

  console.log(
    `Repositorio de formularios hidratado con ${formRepositoryItems.length} registro(s).`,
  );
}

/*
 * ============================================================================
 * MIGRACIÓN DE METADATOS DEL SEED
 * ============================================================================
 *
 * Los formularios del seed solamente se insertan cuando la persistencia
 * está vacía.
 *
 * Una vez que SQLite/localStorage contiene formularios, cambiar el seed
 * no modifica automáticamente esos registros.
 *
 * Esta función permite evolucionar de forma segura metadatos técnicos
 * de formularios iniciales sin borrar datos del usuario.
 *
 * REGLAS:
 *
 * 1. Nunca modifica IDs.
 * 2. Nunca elimina preguntas persistidas.
 * 3. Nunca reemplaza una integración existente.
 * 4. Solamente completa integration del formulario cuando falta.
 * 5. Solamente completa question.integration cuando falta.
 * 6. Persiste exclusivamente formularios que realmente cambiaron.
 *
 * De esta manera podemos activar la integración Kobo de Señalización
 * sin reinstalar la aplicación ni borrar SQLite.
 */
async function migrateSeedIntegrationMetadata(
  persistedForms: FormDefinition[],

  adapter: FormPersistenceAdapter,
): Promise<FormDefinition[]> {
  const migratedForms: FormDefinition[] = [];

  for (const persistedForm of persistedForms) {
    const seedForm = initialForms.find(
      (candidate) => candidate.id === persistedForm.id,
    );

    /*
     * Los formularios creados posteriormente por el usuario
     * pueden no existir en initialForms.
     *
     * En ese caso los conservamos exactamente como están.
     */
    if (!seedForm) {
      migratedForms.push(cloneForm(persistedForm));

      continue;
    }

    const migration = mergeMissingSeedIntegrationMetadata(
      persistedForm,

      seedForm,
    );

    /*
     * Solo escribimos en persistencia cuando existe
     * una diferencia real.
     */
    if (migration.changed) {
      await adapter.replace(migration.form);

      console.log(
        `Metadatos de integración actualizados para formulario ${migration.form.id} (${migration.form.title}).`,
      );
    }

    migratedForms.push(cloneForm(migration.form));
  }

  return migratedForms;
}

/*
 * ============================================================================
 * COMPLETAR INTEGRACIÓN FALTANTE
 * ============================================================================
 *
 * Une únicamente información técnica ausente.
 *
 * NO hace un reemplazo general del formulario persistido.
 */
function mergeMissingSeedIntegrationMetadata(
  persistedForm: FormDefinition,

  seedForm: FormDefinition,
): {
  form: FormDefinition;
  changed: boolean;
} {
  let changed = false;

  /*
   * Trabajamos siempre sobre una copia profunda.
   */
  let mergedForm = cloneForm(persistedForm);

  /*
   * --------------------------------------------------------------------------
   * INTEGRACIÓN DEL FORMULARIO
   * --------------------------------------------------------------------------
   *
   * Si el formulario persistido ya tiene integración:
   *
   * la respetamos.
   *
   * Si no tiene integración y el seed sí:
   *
   * la incorporamos.
   */
  if (!mergedForm.integration && seedForm.integration) {
    mergedForm = {
      ...mergedForm,

      integration: {
        ...seedForm.integration,
      },
    };

    changed = true;
  }

  /*
   * --------------------------------------------------------------------------
   * INTEGRACIÓN DE PREGUNTAS
   * --------------------------------------------------------------------------
   *
   * Relacionamos preguntas por ID estable.
   *
   * Ejemplo:
   *
   * question-008
   * persisted → sin koboFieldName
   * seed      → senalizacion/tipo
   *
   * Resultado:
   *
   * se completa solamente question.integration.
   */
  const mergedQuestions = mergedForm.questions.map((persistedQuestion) => {
    const seedQuestion = seedForm.questions.find(
      (candidate) => candidate.id === persistedQuestion.id,
    );

    if (persistedQuestion.integration || !seedQuestion?.integration) {
      return cloneQuestion(persistedQuestion);
    }

    changed = true;

    return {
      ...cloneQuestion(persistedQuestion),

      integration: {
        ...seedQuestion.integration,
      },
    };
  });

  if (changed) {
    mergedForm = {
      ...mergedForm,

      questions: mergedQuestions,
    };
  }

  return {
    form: mergedForm,

    changed,
  };
}

/*
 * ============================================================================
 * CONSULTAS
 * ============================================================================
 */

/*
 * Devuelve todos los formularios.
 *
 * Siempre devolvemos clones para evitar
 * que la UI modifique el estado interno.
 */
export function getForms(): FormDefinition[] {
  return formRepositoryItems.map(cloneForm);
}

/*
 * Recupera un formulario por ID.
 */
export function getFormById(id: string): FormDefinition | undefined {
  const form = formRepositoryItems.find((item) => item.id === id);

  return form ? cloneForm(form) : undefined;
}

/*
 * Recupera varios formularios
 * usando sus identificadores.
 *
 * Esta función conserva la API
 * que ya utiliza Property.formIds.
 */
export function getFormsByIds(ids: string[]): FormDefinition[] {
  return formRepositoryItems
    .filter((form) => ids.includes(form.id))
    .map(cloneForm);
}

/*
 * ============================================================================
 * CREAR FORMULARIO
 * ============================================================================
 *
 * Todavía no existe una pantalla de creación,
 * pero dejamos lista la operación.
 */
export async function createForm(
  input: CreateFormInput,
): Promise<FormDefinition> {
  const adapter = requirePersistenceAdapter();

  const form: FormDefinition = {
    id: createFormId(),

    title: input.title.trim(),

    description: input.description.trim(),

    version: input.version.trim(),

    status: input.status ?? "active",

    /*
     * Copiamos las preguntas para evitar
     * referencias compartidas.
     */
    questions: input.questions.map(cloneQuestion),

    ...(input.integration
      ? {
          integration: {
            ...input.integration,
          },
        }
      : {}),
  };

  /*
   * Primero actualizamos memoria.
   */
  formRepositoryItems.unshift(form);

  try {
    /*
     * Después persistimos.
     */
    await adapter.insert(form);

    return cloneForm(form);
  } catch (error) {
    /*
     * Si la persistencia falla,
     * revertimos memoria.
     */
    removeFormFromMemory(form.id);

    throw error;
  }
}

/*
 * ============================================================================
 * ACTUALIZAR FORMULARIO
 * ============================================================================
 */
export async function updateForm(
  id: string,

  changes: Partial<FormDefinition>,
): Promise<FormDefinition | undefined> {
  const adapter = requirePersistenceAdapter();

  const index = formRepositoryItems.findIndex((form) => form.id === id);

  if (index === -1) {
    return undefined;
  }

  const previous = cloneForm(formRepositoryItems[index]);

  const updated: FormDefinition = {
    ...previous,

    ...changes,

    /*
     * El ID nunca cambia.
     */
    id: previous.id,

    /*
     * Si se modifican preguntas,
     * guardamos copias profundas.
     */
    questions: changes.questions
      ? changes.questions.map(cloneQuestion)
      : previous.questions.map(cloneQuestion),

    ...(changes.integration
      ? {
          integration: {
            ...changes.integration,
          },
        }
      : previous.integration
        ? {
            integration: {
              ...previous.integration,
            },
          }
        : {}),
  };

  formRepositoryItems[index] = updated;

  try {
    await adapter.replace(updated);

    return cloneForm(updated);
  } catch (error) {
    /*
     * Rollback local.
     */
    formRepositoryItems[index] = previous;

    throw error;
  }
}

/*
 * ============================================================================
 * ELIMINAR FORMULARIO
 * ============================================================================
 *
 * Todavía no conectaremos esta acción
 * a ninguna pantalla.
 */
export async function deleteForm(id: string): Promise<boolean> {
  const adapter = requirePersistenceAdapter();

  const index = formRepositoryItems.findIndex((form) => form.id === id);

  if (index === -1) {
    return false;
  }

  const previous = cloneForm(formRepositoryItems[index]);

  formRepositoryItems.splice(index, 1);

  try {
    const deleted = await adapter.delete(id);

    if (!deleted) {
      throw new Error(
        `No fue posible confirmar la eliminación del formulario ${id}.`,
      );
    }

    return true;
  } catch (error) {
    /*
     * Restauramos el formulario
     * si falla la persistencia.
     */
    formRepositoryItems.splice(index, 0, previous);

    throw error;
  }
}

/*
 * ============================================================================
 * UTILIDADES INTERNAS
 * ============================================================================
 */

/*
 * Devuelve el adapter configurado.
 *
 * Si todavía no existe, significa que
 * la aplicación intentó utilizar FormRepository
 * antes de terminar la inicialización.
 */
function requirePersistenceAdapter(): FormPersistenceAdapter {
  if (!persistenceAdapter) {
    throw new Error(
      "FormRepository todavía no tiene un adaptador de persistencia configurado.",
    );
  }

  return persistenceAdapter;
}

/*
 * Genera un ID local.
 */
function createFormId(): string {
  return `form-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/*
 * Elimina un formulario de memoria
 * durante un rollback.
 */
function removeFormFromMemory(id: string): void {
  const index = formRepositoryItems.findIndex((form) => form.id === id);

  if (index !== -1) {
    formRepositoryItems.splice(index, 1);
  }
}

/*
 * ============================================================================
 * CLONAR FORMULARIO
 * ============================================================================
 *
 * FormDefinition tiene estructuras anidadas:
 *
 * Form
 *   ↓
 * Questions
 *   ↓
 * Options / Integration
 *
 * Por eso aquí necesitamos una copia más profunda
 * que en Company o Report.
 */
function cloneForm(form: FormDefinition): FormDefinition {
  return {
    ...form,

    questions: form.questions.map(cloneQuestion),

    ...(form.integration
      ? {
          integration: {
            ...form.integration,
          },
        }
      : {}),
  };
}

/*
 * Clona una pregunta y sus propiedades anidadas.
 */
function cloneQuestion(question: FormQuestion): FormQuestion {
  return {
    ...question,

    ...(question.options
      ? {
          options: question.options.map((option) => ({
            ...option,
          })),
        }
      : {}),

    ...(question.integration
      ? {
          integration: {
            ...question.integration,
          },
        }
      : {}),
  };
}
