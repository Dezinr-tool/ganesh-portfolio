export const EA_TOKEN_COOKIE = "ea_token";

export function setSessionCookie(
  response: {
    cookies: { set: (name: string, value: string, options: object) => void };
  },
  token: string,
) {
  response.cookies.set(EA_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: {
  cookies: { set: (name: string, value: string, options: object) => void };
}) {
  response.cookies.set(EA_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
