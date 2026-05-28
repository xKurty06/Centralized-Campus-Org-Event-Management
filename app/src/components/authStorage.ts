"use client";

import { clearSelectedManageOrgId } from "./manageOrgSelection";

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("auth_token");
  window.localStorage.removeItem("auth_user");
  window.sessionStorage.removeItem("auth_token");
  window.sessionStorage.removeItem("auth_user");
  clearSelectedManageOrgId();
  document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "auth_session=; Path=/; Max-Age=0; SameSite=Lax";
}
