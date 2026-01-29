// Audio caching utility using IndexedDB
const DB_NAME = 'LumiCareAudioCache';
const STORE_NAME = 'audioFiles';
const DB_VERSION = 1;

interface CachedAudio {
    url: string;
    blob: Blob;
    timestamp: number;
}

class AudioCacheManager {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'url' });
                }
            };
        });
    }

    async cacheAudio(url: string): Promise<Blob> {
        // Check if already cached
        const cached = await this.getFromCache(url);
        if (cached) {
            console.log('🎵 Audio loaded from cache');
            return cached;
        }

        // Fetch and cache
        console.log('🎵 Fetching audio from server...');
        const response = await fetch(url);
        const blob = await response.blob();

        await this.saveToCache(url, blob);
        console.log('✅ Audio cached successfully');
        return blob;
    }

    private async getFromCache(url: string): Promise<Blob | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(url);

            request.onsuccess = () => {
                const result = request.result as CachedAudio | undefined;
                resolve(result ? result.blob : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    private async saveToCache(url: string, blob: Blob): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const data: CachedAudio = {
                url,
                blob,
                timestamp: Date.now()
            };
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async createAudioElement(url: string): Promise<HTMLAudioElement> {
        const blob = await this.cacheAudio(url);
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        audio.loop = true;
        return audio;
    }
}

export const audioCacheManager = new AudioCacheManager();
