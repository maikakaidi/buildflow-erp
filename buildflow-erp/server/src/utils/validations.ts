import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().min(2, 'Nom trop court'),
  companySlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  directorFirstName: z.string().min(2),
  directorLastName: z.string().min(2),
  directorEmail: z.string().email('Email invalide'),
  phone: z.string().min(8),
  phoneCode: z.string().default('+227'),
  password: z.string().min(8, 'Mot de passe trop court'),
  confirmPassword: z.string(),
  country: z.string().default('Niger'),
  address: z.string().optional(),
  logo: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  phoneCode: z.string().default('+227'),
  phone: z.string().min(8),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const createCompanySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  directorFirstName: z.string().min(2),
  directorLastName: z.string().min(2),
  directorEmail: z.string().email().optional(),
  phone: z.string().min(8),
  phoneCode: z.string().default('+227'),
  password: z.string().min(8),
  country: z.string().default('Niger'),
  address: z.string().optional(),
  logo: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  phoneCode: z.string().default('+227'),
  phone: z.string().min(8),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});
