export interface User {
  id: string;
  name: string | null;
  surname: string | null;
  phone: string;
  created_at: string;
}

export interface UserCreatePayload {
  name: string;
  surname: string;
  phone: string;
  password: string;
}

export interface UserLoginPayload {
  phone: string;
  password: string;
}
