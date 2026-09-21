export const AUTH_LOGOUT_EVENT = "formium:auth-logout";

export const emitAuthLogout = () => {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
};
