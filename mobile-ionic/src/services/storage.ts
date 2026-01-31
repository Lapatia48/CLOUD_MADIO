import type { User } from './api';

const KEY = 'user';

export const saveUser = (user: User) => localStorage.setItem(KEY, JSON.stringify(user));

export const getUser = (): User | null => {
  const d = localStorage.getItem(KEY);
  return d ? JSON.parse(d) : null;
};

export const removeUser = () => localStorage.removeItem(KEY);

export const isAuth = () => getUser() !== null;

export const isAdmin = () => {
  const u = getUser();
  return u?.role === 'ADMIN' || u?.role === 'MANAGER';
};
