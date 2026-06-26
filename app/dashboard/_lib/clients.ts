export type SavedClient = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  gstNumber: string | null;
  representativeName: string | null;
  createdAt: string;
};

export type ClientFormValues = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  clientAddress: string;
  gstNumber: string;
  representativeName: string;
};

export type UpsertClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  representativeName?: string | null;
};

export type CreateClientInput = UpsertClientInput;

export type UpdateClientInput = Partial<UpsertClientInput>;

export const emptyClientFormValues: ClientFormValues = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  clientCompany: "",
  clientAddress: "",
  gstNumber: "",
  representativeName: "",
};
