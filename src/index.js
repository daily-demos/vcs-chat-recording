import {
  addParticipantEle,
  disableCallControls,
  enableControls,
  showLobby,
  removeAllParticipantEles,
  removeParticipantEle,
  setupJoinForm,
  showInCall,
  updateCamLabel,
  updateMedia,
  updateMicLabel,
} from './call/call.js';
import {
  addChatMsg,
  clearChat,
  setupChatForm,
  showReaction,
} from './call/chat.js';
import {
  setupRecordToggle,
  updateRecordBtn,
  maybeUpdateRecording,
} from './call/recording.js';

window.addEventListener('DOMContentLoaded', () => {
  const callObject = setupCallObject();
  setupJoinForm(callObject);
});

/**
 * setupCallObject() creates a new instance of Daily's call object
 * and sets up relevant Daily event handlers.
 * @returns {DailyCall}
 */
function setupCallObject() {
  const callObject = window.DailyIframe.createCallObject();

  // Set up relevant event handlers
  callObject
    .on('joined-meeting', (e) => {
      // When the local participant joins the call,
      // set up their call controls and add their video
      // element to the DOM.
      const p = e.participants.local;
      addParticipantEle(e.participants.local);
      updateMedia(p);
      showInCall();
      enableControls(callObject);
      setupChatForm(callObject, maybeUpdateRecording);
      setupRecordToggle(callObject);
    })
    .on('left-meeting', () => {
      // When the local participant leaves the call,
      // disable their call controls and remove
      // all media elements from the DOM.
      disableCallControls();
      showLobby();
      removeAllParticipantEles();
      clearChat();
    })
    .on('recording-started', () => {
      callObject.setMeetingSessionData({
        isRecording: true,
      });
      updateRecordBtn(true);
    })
    .on('recording-stopped', () => {
      callObject.setMeetingSessionData({
        isRecording: false,
      });
      updateRecordBtn(false);
    })
    .on('participant-updated', (e) => {
      // When the local participant is updated,
      // check if their mic and cam are on and
      // update their call controls accordingly.
      const p = e.participant;
      if (!p.local) return;
      updateCamLabel(callObject.localVideo());
      updateMicLabel(callObject.localAudio());
    })
    .on('participant-joined', (e) => {
      // When a remote participant joins, add their
      // video and audio to the DOM.
      addParticipantEle(e.participant);
    })
    .on('participant-left', (e) => {
      // When a remote participant joins, removec their
      // video and audio from the DOM.
      removeParticipantEle(e.participant.session_id);
    })
    .on('track-started', (e) => {
      // When a track starts, update the relevant
      // participant's media elements in the DOM.
      updateMedia(e.participant);
    })
    .on('error', (e) => {
      // If an unrecoverable error is received,
      // allow user to try to re-join the call.
      console.error('An unrecoverable error occurred: ', e);
      showLobby();
    })
    .on('nonfatal-error', (e) => {
      console.error('A nonfatal error occurred', e);
    })
    .on('app-message', (e) => {
      const { data } = e;
      // If the event contains a chat payload,
      // show a new chat message and _possibly_ update the recording
      // (which happens when the local participant is the recording owner)
      if (data.kind === 'chat') {
        const { msg } = data;
        const senderID = e.fromId;
        const sender = callObject.participants()[senderID];
        const name = sender?.user_name || 'Guest';
        addChatMsg(name, msg);
        maybeUpdateRecording(callObject, {
          kind: 'chat',
          name,
          msg,
        });
        return;
      }
      // If the event contains an emoji reaction payload,
      // show a new chat message and _possibly_ update the recording
      // (which happens when the local participant is the recording owner)
      if (data.kind === 'emoji') {
        const { emoji } = data;
        showReaction(emoji);
        maybeUpdateRecording(callObject, {
          kind: 'emoji',
          emoji,
        });
      }
    });

  return callObject;
}
