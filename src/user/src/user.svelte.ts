import { Preferences } from "@capacitor/preferences";
import { GoogleAuth } from "./index";

type ApiResult = Promise<{ success: true } | { success: false; error_message: string }>;

export class User {
  user_key = "user_key";
  GOOGLE_AUTH_CLIENT_ID;

  private init_promise: Promise<void> | null = null;
  private google_auth_initialized = false;

  name: string | null = $state(null);
  id: string | null = $state(null);
  email_address: string | null = $state(null);
  avatar: string | null = $state(null);

  is_loading = $state(false);
  is_initialized = $state(false);

  readonly is_logged_in = $derived(!!this.id);

  constructor(client_id: string) {
    this.GOOGLE_AUTH_CLIENT_ID = client_id;
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.init_promise) return this.init_promise;
    this.is_initialized = false;
    this.init_promise = Preferences.get({ key: this.user_key })
      .then((result) => {
        if (!result.value) return;
        const user_data = JSON.parse(result.value);
        this.name = user_data.name ?? null;
        this.id = user_data.id ?? null;
        this.email_address = user_data.email_address ?? null;
        this.avatar = user_data.avatar ?? null;
      })
      .catch(() => {
        // Ignore malformed stored data; user can re-authenticate.
      })
      .finally(() => {
        this.is_initialized = true;
      });

    return this.init_promise;
  }

  private async initializeGoogleAuth(): Promise<void> {
    if (this.google_auth_initialized) return;
    await GoogleAuth.initialize({ clientId: this.GOOGLE_AUTH_CLIENT_ID });
    this.google_auth_initialized = true;
  }

  async signIn(): ApiResult {
    try {
      if (!navigator.onLine) {
        throw new Error("No internet connection available.");
      }

      this.is_loading = true;
      await this.initialize();
      await this.initializeGoogleAuth();
      const gu = await GoogleAuth.signIn();
      if (!gu) throw new Error("Google sign-in failed");

      if (!gu.authentication) {
        throw new Error("Google authentication data is missing.");
      }

      const id_token = gu.authentication.idToken;
      if (!id_token) throw new Error("Google ID token is missing.");

      this.name = gu.name ?? null;
      this.id = gu.id ?? null;
      this.email_address = gu.email ?? null;
      this.avatar = gu.imageUrl ?? null;

      await Preferences.set({
        key: this.user_key,
        value: JSON.stringify({
          name: this.name,
          id: this.id,
          email_address: this.email_address,
          avatar: this.avatar,
        }),
      });

      this.is_loading = false;
      return { success: true };
    } catch (error) {
      this.is_loading = false;
      const error_message = error instanceof Error ? error.message : JSON.stringify(error);
      if (error_message === "The user canceled the sign-in flow.") {
        return { success: false, error_message: "USER_CANCELED" };
      }

      return { success: false, error_message: `Sign-in Error: ${error_message}` };
    }
  }

  async signOut(): ApiResult {
    try {
      if (!navigator.onLine) {
        throw new Error("No internet connection available.");
      }

      this.is_loading = true;
      await this.initialize();
      await this.initializeGoogleAuth();
      await GoogleAuth.signOut();

      this.id = null;
      this.name = null;
      this.email_address = null;
      this.avatar = null;
      await Preferences.remove({ key: this.user_key });

      this.is_loading = false;
      return { success: true };
    } catch (error) {
      this.is_loading = false;
      const error_message = error instanceof Error ? error.message : JSON.stringify(error);
      return { success: false, error_message: `Sign-out error: ${error_message}` };
    }
  }
}
