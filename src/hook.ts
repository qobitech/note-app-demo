import { useEffect, useState } from 'react'
import { IDBPDatabase, openDB } from 'idb'

export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

interface IUseSync<T = undefined> {
  saveOfflineUpdate: (update: T[]) => Promise<void>
  getOfflineUpdates: () => Promise<T[]>
  clearOfflineUpdates: () => Promise<void>
  offlineData: T[] | undefined
  syncToServer: (syncFunction: (updates: T[]) => Promise<void>) => Promise<void>
}

const version = 3

export const useSync = <T extends { id: string } = any>(): IUseSync<T> => {
  const [offlineData, setOfflineData] = useState<T[]>([])

  const saveOfflineUpdate = async (updates: T[]) => {
    let db: IDBPDatabase<unknown> | null = null
    try {
      db = await openDB('Demo-SyncDB', version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('updates')) {
            db.createObjectStore('updates', { keyPath: 'id' })
          }
        }
      })

      if (db) {
        const tx = db.transaction('updates', 'readwrite')
        const store = tx.objectStore('updates')

        for (const update of updates) {
          await store.put(update)
        }

        await tx.done // Wait for the transaction to complete

        const allUpdates = await db.getAll('updates')
        setOfflineData(allUpdates)
      }
    } catch (error) {
      console.error('Failed to save offline update:', error)
      // Handle the error appropriately (e.g., show a user notification)
    } finally {
      if (db) {
        db.close()
      }
    }
  }

  const getOfflineUpdates = async (): Promise<T[]> => {
    try {
      const db = await openDB('Demo-SyncDB', version, {
        upgrade(db) {
          // Ensure the 'updates' object store is created if it doesn't exist
          if (!db.objectStoreNames.contains('updates')) {
            db.createObjectStore('updates', {
              keyPath: 'id',
              autoIncrement: false
            })
            console.log('Updates object store created during initialization')
          }
        }
      })
      const data = await db.getAll('updates')
      setOfflineData(data)
      return data
    } catch (error) {
      console.error('Error retrieving offline updates:', error)

      // Clear offline data state in case of error
      setOfflineData([])

      return []
    }
  }

  const clearOfflineUpdates = async () => {
    const db = await openDB('Demo-SyncDB', version)
    await db.clear('updates')
    setOfflineData([])
  }

  const syncToServer = async (
    syncFunction: (updates: T[]) => Promise<void>
  ) => {
    const updates = await getOfflineUpdates()
    if (updates.length === 0) return

    try {
      await syncFunction(updates)
      await clearOfflineUpdates() // Only clear if successful
      console.log('Sync successful!')
    } catch (error) {
      console.error('Sync failed, will retry later', error)
    }
  }

  return {
    saveOfflineUpdate,
    getOfflineUpdates,
    clearOfflineUpdates,
    offlineData,
    syncToServer
  }
}
