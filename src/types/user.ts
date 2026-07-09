// User domain types

export interface User {
  id: string;
  name: string;
  surname: string;
  phone: string;
  createdAt: string;
}

export interface UserWithSpinStatus extends User {
  hasSpun: boolean;
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

export interface UserRow {
  id: string;
  name: string;
  surname: string;
  phone: string;
  password_hash: string;
  created_at: string;
}
