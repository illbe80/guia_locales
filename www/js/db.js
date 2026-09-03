/* ===== SAVEUR — IndexedDB Storage ===== */
const DB = (() => {
  const NAME = 'saveur_db';
  const VERSION = 1;
  let db;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('places')) {
          const store = d.createObjectStore('places', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('added', 'added', { unique: false });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }

  async function getAll() {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('places', 'readonly');
      const req = tx.objectStore('places').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(id) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('places', 'readonly');
      const req = tx.objectStore('places').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(place) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('places', 'readwrite');
      const req = tx.objectStore('places').put(place);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('places', 'readwrite');
      const req = tx.objectStore('places').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return { getAll, get, put, remove };
})();
