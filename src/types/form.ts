export type FormQuestionIntegration = {
  /*
   * Nombre técnico del campo
   * utilizado dentro de Kobo.
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
   * Información específica de
   * integraciones externas.
   *
   * Es opcional para permitir que
   * existan preguntas exclusivamente
   * internas de UNIESAP.
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
