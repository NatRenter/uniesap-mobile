export type FormQuestionOption = {
  /*
   * Texto que verá el usuario.
   *
   * Ejemplo:
   * "Buen estado"
   */
  label: string;

  /*
   * Valor interno que almacenaremos.
   *
   * Más adelante este valor será el que
   * podremos transformar para enviarlo a Kobo.
   */
  value: string;
};

export type FormQuestionIntegration = {
  /*
   * Nombre técnico del campo utilizado
   * dentro de Kobo.
   *
   * Ejemplo:
   * datos_generales/responsable
   */
  koboFieldName?: string;
};

export type FormQuestion = {
  id: string;

  label: string;

  type: "text" | "textarea" | "number" | "boolean" | "select" | "photo";

  required?: boolean;

  /*
   * Solo las preguntas de tipo "select"
   * necesitan normalmente esta propiedad.
   *
   * La dejamos opcional para mantener
   * sencillo el modelo actual.
   */
  options?: FormQuestionOption[];

  /*
   * Información específica de integraciones externas.
   *
   * Es opcional porque pueden existir preguntas
   * utilizadas únicamente por UNIESAP.
   */
  integration?: FormQuestionIntegration;
};

export type FormIntegration = {
  provider: "kobo";

  assetUid: string;

  versionUid?: string;

  lastSyncAt?: string;
};

export type FormDefinition = {
  id: string;

  title: string;

  description: string;

  version: string;

  questions: FormQuestion[];

  status: "active" | "inactive";

  integration?: FormIntegration;
};
