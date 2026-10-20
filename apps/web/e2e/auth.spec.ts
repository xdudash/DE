import { expect, test } from "@playwright/test";

/**
 * CI has no Supabase project configured, so these tests cover the honest "not set up"
 * state, the routing rules, and the POST-only write routes. The real Google/Apple round
 * trip is verified by hand on a configured preview (docs/development/ACCOUNTS_SETUP.md).
 */
test.describe("sign-in and account, unconfigured deployment", () => {
  test("starting sign-in says it is not set up instead of sending the learner to a provider", async ({ request }) => {
    const res = await request.get("/auth/start?provider=google&over16=1&lang=en", { maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toBe("/en/me?auth=unavailable");
  });

  test("the account area says sign-in is not set up and offers no provider button", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page.getByText("Sign-in is not set up on this deployment yet. Progress stays in this browser.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue with Apple" })).toHaveCount(0);
  });

  test("a notice from the auth routes is shown in the learner's language", async ({ page }) => {
    await page.goto("/en/me?auth=signed-out");
    await expect(page.getByRole("status")).toHaveText("You have signed out.");
  });

  test("the session endpoint reports a signed-out browser without leaking anything", async ({ request }) => {
    const res = await request.get("/api/session");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ configured: false, signedIn: false, saved: false });
  });

  test("sign-out and account deletion accept only POST, so a link or image cannot trigger them", async ({ request }) => {
    expect((await request.get("/auth/sign-out", { maxRedirects: 0 })).status()).toBe(405);
    expect((await request.get("/auth/delete", { maxRedirects: 0 })).status()).toBe(405);
  });

  test("deleting without a session changes nothing and says so", async ({ request }) => {
    const res = await request.post("/auth/delete", {
      form: { lang: "en", confirm: "delete" },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toBe("/en/me?auth=unavailable");
  });

  test("the test sign-in is a POST that is unavailable on an unconfigured deployment", async ({ request }) => {
    expect((await request.get("/auth/test", { maxRedirects: 0 })).status()).toBe(405);
    const res = await request.post("/auth/test", { form: { lang: "en" }, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toBe("/en/me?auth=unavailable");
  });
});
