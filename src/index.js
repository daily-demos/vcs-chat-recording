import {
  disableControls,
  enableControls,
  enableJoinForm,
  setupChatForm,
  setupEmojiReactions,
  setupJoinForm,
  setupRecordToggle,
  updateCamLabel,
  updateMicLabel,
  updateRecordBtn,
} from './call/controls.js';
import {
  addChatMsg,
  addParticipantEle,
  hideCallContainer,
  removeAllParticipantEles,
  removeParticipantEle,
  showCallContainer,
  showReaction,
  updateMedia,
} from './call/dom.js';

window.addEventListener('DOMContentLoaded', () => {
  const callObject = setupCallObject();
  setupJoinForm(callObject);
});

let visibleMessages = [];
let toastKey = 0;

/**
 * setupCallObject() creates a new instance of Daily's call object
 * and sets up relevant Daily event handlers.
 * @returns {DailyCall}
 */
function setupCallObject() {
  const callObject = window.DailyIframe.createCallObject();

  const participantParentEle = document.getElementById('participants');

  // Set up relevant event handlers
  callObject
    .on('joined-meeting', (e) => {
      // When the local participant joins the call,
      // set up their call controls and add their video
      // element to the DOM.
      const p = e.participants.local;
      addParticipantEle(e.participants.local, participantParentEle);
      updateMedia(p);
      showCallContainer();
      enableControls(callObject);
      setupChatForm(callObject, updateRecording);
      setupEmojiReactions(callObject, updateRecording)
      setupRecordToggle(callObject);
    })
    .on('left-meeting', () => {
      // When the local participant leaves the call,
      // disable their call controls and remove
      // all media elements from the DOM.
      disableControls();
      hideCallContainer();
      removeAllParticipantEles();
    })
    .on('recording-started', (e) => {
      const isRecordingOwner = !!callObject.participants().local.userData?.isRecordingOwner;
      updateRecordBtn(true, isRecordingOwner)
    })
    .on('recording-stopped', (e) => {
      const isRecordingOwner = !!callObject.participants().local.userData?.isRecordingOwner;
      updateRecordBtn(false, isRecordingOwner)
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
      addParticipantEle(e.participant, participantParentEle);
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
      enableJoinForm();
    })
    .on('nonfatal-error', (e) => {
      console.error('A nonfatal error occurred', e);
    })
    .on('app-message', (e) => {
      const data = e.data;
      console.log("got app message:", e);
      if (data.kind === "chat") {
        const msg = data.msg;
        const senderID = e.fromId;
        const sender = callObject.participants()[senderID];
        const name = sender?.user_name || "Guest";
        addChatMsg(name, msg);
        updateRecording(callObject, {
          kind: "chat",
          name: name,
          msg: msg,
        })
        return;
      } 
      if (data.kind === "emoji") {
        const emoji = data.emoji;
        showReaction(emoji);
        updateRecording(callObject, {
          kind: "emoji",
          emoji: emoji,
        })
      }
    });

  return callObject;
}

function updateRecording(callObject, data) {
  const lp = callObject.participants().local;

  if (!lp?.userData?.isRecordingOwner) return;
  console.log("updating recording: ", data);
  if (data.kind === "chat") {
    const chatLine = `${data.name}: ${data.msg}`;
    visibleMessages.push(chatLine);
    const maxDisplayed = 5;
    while (visibleMessages.length > maxDisplayed) {
      visibleMessages.shift();
    };
      callObject.updateRecording({
        layout: {
          preset: "custom",
          composition_params: {
            "showTextOverlay": true,
            "text.align_horizontal": "right",
            "text.align_vertical": "bottom",
            "text.offset_x_gu": -1,
            "text.offset_y_gu": 0.5,
            "text.fontSize_gu": 1.2,
            "text.fontFamily": "Exo",
            "text.color": "rgba(255, 255, 255, 0.95)",
            "videoSettings.showParticipantLabels": false,
            "text.content": visibleMessages.join("\r\n"),
          }
        }
      });
      return;
  }
  if (data.kind === "emoji") {
    const emoji = data.emoji;
    let assetName = "";
    // Get asset name
    switch (emoji) {
      case '❤️': 
        assetName = "reactions/heart"
        break;
      case '👍': 
        assetName = "reactions/up"
        break;
      case '👎': 
        assetName = "reactions/down"
        break;
      case '🎃': 
        assetName = "reactions/boo"
        break;
    }

    toastKey += 1;
    callObject.updateRecording({
      layout: {
        preset: "custom",
        composition_params: {
          "toast.duration_secs": 2,
          "toast.key": toastKey,
          "toast.icon.assetName": assetName,
          "toast.showIcon": true,
          "toast.color": "rgba(0, 0, 0, 0)",
        }
      }
    });
  }
}
