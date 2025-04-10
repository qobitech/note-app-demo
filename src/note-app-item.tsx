import { FC } from 'react'
import styled from 'styled-components'
import moment from 'moment'
import { INote } from './note-app'

interface ISavedNoteItem {
  note: INote
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined
}

const SavedNoteItem: FC<ISavedNoteItem> = ({ note, onClick }) => {
  return (
    <SavedNoteItemClass
      key={moment(note.timeStamp).fromNow()}
      onClick={onClick}
    >
      <h5 className="header">{note.title || note.text}</h5>
      <p className="time-stamp">
        {new Date(note.timeStamp).toDateString()}&nbsp;&nbsp;{' '}
        <span className="time">{moment(note.timeStamp).fromNow()}</span>
      </p>
    </SavedNoteItemClass>
  )
}

export default SavedNoteItem

const SavedNoteItemClass = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  border: 1px solid #eaeaea;
  border-radius: 5px;
  gap: 10px;
  box-sizing: border-box;
  .header {
    font-size: 14px;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
  .time-stamp {
    font-size: 10px;
    opacity: 0.8;
    margin: 0;
  }
  .time {
    opacity: 0.6;
  }
`
