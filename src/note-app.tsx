import { useState, useEffect, useRef, useCallback } from 'react'
import { useNetworkStatus, useSync } from './hook'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import SavedNoteItem from './note-app-item'

export interface INote {
  id: string
  text: string
  title: string
  timeStamp: number
}

const defaultNote: Omit<INote, 'id'> = {
  text: '',
  title: '',
  timeStamp: Date.now()
}

const NotesApp = () => {
  const [note, setNote] = useState<INote>({ ...defaultNote, id: uuidv4() }) // Stores the current note being typed
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false) // Stores the list of saved notes

  const debounceTimeout = useRef<number | null>(null) // Reference to track debounce timing
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null) // Reference text area
  const isOnline = useNetworkStatus() // Custom hook to check internet status
  const {
    saveOfflineUpdate,
    getOfflineUpdates,
    clearOfflineUpdates,
    offlineData
  } = useSync<INote>() // Custom hook to manage offline storage

  /**
   * Saves a note to the server.
   * If the request fails, the error is thrown so it can be handled properly.
   */
  const saveNote = async (note: INote) => {
    setSyncInProgress(true)
    try {
      await fetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify(note),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(() => {
          setSyncInProgress(false)
        })
        .catch(() => {
          setSyncInProgress(false)
        })
    } catch (error) {
      setSyncInProgress(false)
      console.error('Error saving note to server:', error)
      throw error // Allow the caller to handle the failure
    }
  }

  /**
   * Handles saving a note.
   * - If online, it tries to save the note to the server.
   * - If the request fails, or if offline, it saves the note locally.
   */
  const handleSaveNote = async (id: string, value: string) => {
    if (!value.trim()) return // Prevent saving empty notes

    const filteredNotes = offlineData?.filter((i) => i.id !== note.id) || []
    const updatedNote = { ...note, [id]: value, timeStamp: Date.now() }
    const modifiedNotes = [updatedNote, ...filteredNotes]

    if (isOnline) {
      try {
        await saveNote(updatedNote) // Try saving online
        await saveOfflineUpdate(modifiedNotes)
      } catch {
        await saveOfflineUpdate(modifiedNotes) // If it fails, still store offline
      }
    } else {
      await saveOfflineUpdate(modifiedNotes) // Save offline directly if offline
    }
  }

  const handleNewNote = useCallback(() => {
    setNote({ ...defaultNote, id: uuidv4() })
    if (textAreaRef?.current) textAreaRef.current.autofocus = true
  }, [])

  const handleEditNote = useCallback((note: INote) => {
    setNote(note)
    if (textAreaRef?.current) textAreaRef.current.autofocus = true
  }, [])

  /**
   * Handles user input with debouncing to prevent excessive API calls.
   * - Updates the note state immediately.
   * - Waits 500ms before attempting to save (only if online).
   */
  const handleDebouncedSaveNote = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setNote((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current) // Clear any existing timeout
    }

    debounceTimeout.current = window.setTimeout(async () => {
      await handleSaveNote(e.target.id, e.target.value) // Save after delay
    }, 500)
  }

  /**
   * When the app comes back online, this effect runs.
   * - It checks for any offline notes.
   * - If there are unsynced notes, it tries to save them in bulk.
   * - If the save is successful, it clears the offline storage.
   */
  useEffect(() => {
    if (isOnline) {
      ;(async () => {
        const offlineNotes = await getOfflineUpdates()
        console.log(offlineNotes, 'juju')
        if (offlineNotes.length > 0) {
          try {
            await Promise.all(offlineNotes.map(saveNote)) // Sync all offline notes
            await clearOfflineUpdates() // Clear them after successful sync
          } catch {
            console.error('Failed to sync offline notes, keeping them stored')
          }
        }
      })()
    }
  }, [isOnline])

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])

  return (
    <ContainerClass>
      <StatusClass>
        <p className={`status-sync ${isOnline ? 'online' : 'offline'}`}>
          Status: {isOnline ? 'Online' : 'Offline'}
        </p>
        <p className="status-sync">{syncInProgress ? 'Syncing...' : ''}</p>
      </StatusClass>
      <NoteClass onSubmit={(e) => e.preventDefault()}>
        <HeaderClass>
          <h1>Note App</h1>
          <button
            onClick={() => {
              handleNewNote()
            }}
            className="btn-new"
          >
            New Note +
          </button>
        </HeaderClass>
        <input
          value={note.title}
          placeholder="Title"
          className="text-input"
          onChange={handleDebouncedSaveNote}
          id="title"
        />
        <textarea
          value={note.text}
          onChange={handleDebouncedSaveNote}
          placeholder="Write a note..."
          className="text-area"
          ref={textAreaRef}
          id="text"
          autoFocus
        />
        <button
          onClick={async () => {
            await handleSaveNote('text', note.text)
          }}
          className="btn"
        >
          Save Note
        </button>
      </NoteClass>
      <SavedNoteClass>
        <h2>Saved Notes</h2>
        {!offlineData?.length ? (
          <p className="no-notes">No notes saved</p>
        ) : (
          <SavedNoteGridClass>
            {offlineData.map((n) => (
              <SavedNoteItem
                key={n.id}
                note={n}
                onClick={() => {
                  handleEditNote(n)
                }}
              />
            ))}
          </SavedNoteGridClass>
        )}
      </SavedNoteClass>
    </ContainerClass>
  )
}

export default NotesApp

const ContainerClass = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto;
  width: 700px;
  gap: 30px;
  padding: 30px 0;
`
const NoteClass = styled.form`
  display: flex;
  flex-direction: column;
  margin: auto;
  width: 100%;
  gap: 30px;
  padding: 20px;
  box-sizing: border-box;
  border: 1px solid #eaeaea;
  border-radius: 5px;
  .text-area {
    padding: 7px;
    outline: none;
    min-height: 70px;
  }
  .text-input {
    padding: 7px;
    outline: none;
  }

  .btn {
    outline: none;
    border: none;
    padding: 2px 5px;
  }
  .btn-new {
    outline: none;
    border: 1px solid #eaeaea;
    cursor: pointer;
    border-radius: 5px;
    font-size: 12px;
    padding: 2px 5px;
  }
`
const SavedNoteClass = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto;
  width: 100%;
  gap: 30px;
  padding: 20px;
  box-sizing: border-box;
  border: 1px solid #eaeaea;
  border-radius: 5px;
  .no-notes {
    font-size: 11px;
    opacity: 0.7;
  }
  h2 {
    font-size: 21px;
  }
`
const HeaderClass = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const SavedNoteGridClass = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40%, 1fr));
  gap: 19px;
`
const StatusClass = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  .status-sync {
    font-size: 11px;
    &.online {
      color: green;
    }
    &.offline {
      color: red;
    }
  }
`
