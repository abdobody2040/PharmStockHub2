
import { z } from "zod";

export const ROLES = {
  ceo: "ceo",
  marketer: "marketer",
  salesManager: "salesManager",
  stockManager: "stockManager",
  admin: "admin",
  medicalRep: "medicalRep",
} as const;

export type RoleType = keyof typeof ROLES;

export const ROLE_PERMISSIONS = {
  ceo: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageSpecialties: true
  },
  marketer: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false
  },
  salesManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false
  },
  stockManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: true,
    canManageSpecialties: false
  },
  admin: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageSpecialties: true
  },
  medicalRep: {
    canViewAll: false,
    canAddItems: false,
    canEditItems: false,
    canRemoveItems: false,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false
  }
} as const;

export const roleSchema = z.enum([
  ROLES.ceo,
  ROLES.marketer,
  ROLES.salesManager,
  ROLES.stockManager,
  ROLES.admin,
  ROLES.medicalRep
]);

export function getRoleName(role: RoleType): string {
  switch (role) {
    case ROLES.ceo:
      return "CEO";
    case ROLES.marketer:
      return "Marketer";
    case ROLES.salesManager:
      return "Sales Manager";
    case ROLES.stockManager:
      return "Stock Manager";
    case ROLES.admin:
      return "Admin";
    case ROLES.medicalRep:
      return "Medical Representative";
    default:
      return role;
  }
}

export function hasPermission(role: RoleType, permission: keyof typeof ROLE_PERMISSIONS.ceo): boolean {
  return ROLE_PERMISSIONS[role][permission] === true;
}
