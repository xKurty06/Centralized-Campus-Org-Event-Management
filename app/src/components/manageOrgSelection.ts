'use client';

export const MANAGE_SELECTED_ORG_KEY = 'manage-selected-org-id';

export function getSelectedManageOrgId(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(MANAGE_SELECTED_ORG_KEY) ?? '';
}

export function setSelectedManageOrgId(orgId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(MANAGE_SELECTED_ORG_KEY, orgId);
}

export function manageRequestHeaders(token?: string | null): Record<string, string> {
  const selectedOrgId = getSelectedManageOrgId();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedOrgId ? { 'X-Manage-Org-Id': selectedOrgId } : {}),
  };
}
