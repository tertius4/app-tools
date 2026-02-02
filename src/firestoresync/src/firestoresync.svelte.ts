import type { doc, setDoc, getDoc, Firestore as FirestoreDB } from "@firebase/firestore";
import type { Preferences } from "@capacitor/preferences";

interface SyncDocument {
  last_updated_at: number;
  [key: string]: unknown;
}

interface SyncConfig {
  db: FirestoreDB;
  collection: string;
  docId: string;
  preferencesKey: string;
}

type AsyncResult = Promise<{ success: true } | { success: false; error_message: string }>;
type Result = { success: true } | { success: false; error_message: string };

export class FirestoreSync {
  private firestore_module: { doc: typeof doc; setDoc: typeof setDoc; getDoc: typeof getDoc } | null = null;
  private capacitor_module: { Preferences: typeof Preferences } | null = null;

  private db: FirestoreDB;
  private collection: string;
  private doc_id: string;
  private preferences_key: string;
  private retry_queue: (() => Promise<void>)[] = [];
  private is_online = true;
  private write_chain: Promise<void> = Promise.resolve();

  constructor(config: SyncConfig) {
    this.db = config.db;
    this.collection = config.collection;
    this.doc_id = config.docId;
    this.preferences_key = config.preferencesKey;

    this.setupOnlineListener();
  }

  /**
   * Initialize online/offline listeners with SSR safety.
   */
  private setupOnlineListener(): void {
    const has_window = typeof window !== "undefined" && typeof navigator !== "undefined";
    if (!has_window) {
      this.is_online = true;
      return;
    }

    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());
    this.is_online = navigator.onLine;
  }

  /**
   * Mark connection online and drain queued writes.
   */
  private handleOnline(): void {
    this.is_online = true;
    this.processRetryQueue();
  }

  /**
   * Mark connection offline.
   */
  private handleOffline(): void {
    this.is_online = false;
  }

  /**
   * Retry queued write tasks in order.
   */
  private async processRetryQueue(): Promise<void> {
    while (this.retry_queue.length > 0) {
      const task = this.retry_queue.shift();
      if (task) {
        try {
          await this.enqueueWrite(task);
        } catch (error) {
          console.error("Retry failed, re-queuing:", error);
          this.retry_queue.unshift(task);
          break;
        }
      }
    }
  }

  /**
   * Serialize write tasks to avoid race conditions.
   */
  private enqueueWrite(task: () => Promise<void>): Promise<void> {
    this.write_chain = this.write_chain.then(task).catch((error) => {
      console.error("Write task failed:", error);
    });
    return this.write_chain;
  }

  /**
   * Lazy-load Firestore functions.
   */
  private async getFirestore() {
    if (this.firestore_module) {
      return this.firestore_module;
    }

    const { doc, setDoc, getDoc } = await import("@firebase/firestore");
    this.firestore_module = { doc, setDoc, getDoc };
    return this.firestore_module;
  }

  /**
   * Lazy-load Capacitor Preferences.
   */
  private async getPreferences() {
    if (this.capacitor_module) {
      return this.capacitor_module;
    }

    const { Preferences } = await import("@capacitor/preferences");
    this.capacitor_module = { Preferences };
    return this.capacitor_module;
  }

  /**
   * Sync remote to local, or local to remote if newer.
   */
  async pull(): AsyncResult {
    try {
      const { doc, getDoc } = await this.getFirestore();
      const doc_ref = doc(this.db, this.collection, this.doc_id);
      const doc_snap = await getDoc(doc_ref);

      const preferences_data = await this.getFromPreferences();

      if (!doc_snap.exists()) {
        if (preferences_data) {
          await this.queueFirestoreWrite(preferences_data, true);
        }
        return { success: true };
      }

      const firestore_data = doc_snap.data() as SyncDocument;
      const local_updated_at = preferences_data?.last_updated_at || 0;
      const remote_updated_at = firestore_data.last_updated_at || 0;

      if (!preferences_data || remote_updated_at > local_updated_at) {
        await this.saveToPreferences(firestore_data);
        return { success: true };
      }

      if (local_updated_at > remote_updated_at && preferences_data) {
        await this.queueFirestoreWrite(preferences_data, true);
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      const error_message = error instanceof Error ? error.message : JSON.stringify(error);
      return { success: false, error_message };
    }
  }

  /**
   * Push partial updates with a fresh timestamp.
   */
  async push(data: Partial<SyncDocument>): AsyncResult {
    const data_with_timestamp: SyncDocument = {
      ...data,
      last_updated_at: Date.now(),
    };

    return this.queueFirestoreWrite(data_with_timestamp, false);
  }

  /**
   * Enqueue a write and update local cache, with optional timestamp preserve.
   */
  private async queueFirestoreWrite(data: SyncDocument, preserve_timestamp: boolean): AsyncResult {
    const data_to_write = preserve_timestamp ? data : { ...data, last_updated_at: Date.now() };

    const task = async () => {
      const { doc, setDoc } = await this.getFirestore();
      const doc_ref = doc(this.db, this.collection, this.doc_id);
      await setDoc(doc_ref, data_to_write, { merge: true });
      await this.saveToPreferences(data_to_write as SyncDocument);
    };

    if (this.is_online) {
      try {
        await this.enqueueWrite(task);
        return { success: true };
      } catch (error) {
        this.retry_queue.push(task);
        const error_message = error instanceof Error ? error.message : JSON.stringify(error);
        return { success: false, error_message };
      }
    }

    this.retry_queue.push(task);
    await this.saveToPreferences(data_to_write as SyncDocument);
    return { success: true };
  }

  /**
   * Read cached document from Preferences.
   */
  private async getFromPreferences(): Promise<SyncDocument | null> {
    try {
      const { Preferences } = await this.getPreferences();
      const result = await Preferences.get({ key: this.preferences_key });
      if (!result.value) return null;
      return JSON.parse(result.value) as SyncDocument;
    } catch (error) {
      console.warn("Failed to parse preferences data:", error);
      return null;
    }
  }

  /**
   * Save document to Preferences.
   */
  private async saveToPreferences(data: SyncDocument): Promise<void> {
    const { Preferences } = await this.getPreferences();
    await Preferences.set({
      key: this.preferences_key,
      value: JSON.stringify(data),
    });
  }

  /**
   * Clear cached document from Preferences.
   */
  async clear(): Promise<void> {
    const { Preferences } = await this.getPreferences();
    await Preferences.remove({ key: this.preferences_key });
  }
}
