import { describe, it, expect } from "vitest";
import { translate } from "@/lib/i18n/config";

describe("i18n", () => {
  it("translates English keys", () => {
    expect(translate("en", "auth.signIn")).toBe("Sign in");
    expect(translate("en", "common.appName")).toBe("Notik");
  });

  it("translates Ukrainian keys", () => {
    expect(translate("uk", "auth.signIn")).toBe("Увійти");
    expect(translate("uk", "editor.noNoteSelected")).toBe("Нотатку не обрано");
    expect(translate("uk", "common.untitled")).toBe("Без назви");
  });

  it("falls back to key for missing translations", () => {
    expect(translate("en", "nonexistent.key" as "auth.signIn")).toBe("nonexistent.key");
  });
});
