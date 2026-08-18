export type FormQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "photo";

  required?: boolean;
};

export type FormDefinition = {
  id: string;

  title: string;
  description: string;

  version: string;

  questions: FormQuestion[];

  status: "active" | "inactive";
};
