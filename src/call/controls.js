import { addChatMsg, showReaction } from "./dom.js";

export function setupJoinForm(callObject) {
  const joinForm = getJoinForm();
  joinForm.onsubmit = (ev) => {
    ev.preventDefault();

    // Disable join button to avoid double-join attempts
    const btn = joinForm.getElementsByTagName('button')[0];
    btn.disabled = true;

    const roomURLInput = joinForm.getElementsByTagName('input')[0];
    try {
      callObject.join({ url: roomURLInput.value });
    } catch (e) {
      console.error('Failed to join Daily room', e);
      enableJoinForm();
    }
  };
}

export function setupChatForm(callObject, updateRecording) {
  const chatForm = getChatForm();
  chatForm.onsubmit = (ev) => {
    ev.preventDefault();
    try {
      const chatInput = chatForm.getElementsByTagName('input')[0];
      const msg = chatInput.value;
      chatForm.reset();
      // Name
      const name = callObject.participants().local.user_name || "Guest";

      callObject.sendAppMessage({ kind: "chat", msg: msg}, '*');
      addChatMsg(name, msg);
      updateRecording(callObject, {
        kind: "chat",
        name: name,
        msg: msg,
      });
    } catch (e) {
      console.error('Failed to send chat message', e);
    }
  };
}

export function setupEmojiReactions(callObject, updateRecording) {
  const reactionBtns = [
    document.getElementById("thumbsup"),
    document.getElementById("thumbsdown"),
    document.getElementById("heart"),
    document.getElementById("boo"),
  ];
  for (let i = 0; i < reactionBtns.length; i += 1) {
    const btn = reactionBtns[i];
    btn.onclick = () => {
      const emoji = btn.innerText;
      callObject.sendAppMessage({kind: "emoji", emoji: emoji})
      showReaction(emoji);
      updateRecording(callObject, {kind: "emoji", emoji: emoji})
    }
  }
}

export function enableJoinForm() {
  const joinForm = getJoinForm();
  const btn = joinForm.getElementsByTagName('button')[0];
  btn.disabled = false;
}

export function setupMicToggle(callObject) {
  const btn = getMicBtn();
  btn.onclick = () => {
    const micOn = callObject.localAudio();
    callObject.setLocalAudio(!micOn);
  };
}

export function updateRecordBtn(recordingInProgress, isRecordingOwner) {
  const btn = getRecordBtn();
  if (recordingInProgress) {
    btn.innerText = "Stop Recording";
    if (!isRecordingOwner) {
      btn.disabled = true;
    }
    return;
  }
  btn.innerText = "Start Recording";
}

export function setupRecordToggle(callObject) {
  const btn = getRecordBtn();
    btn.onclick = () => {
      const state = callObject.meetingSessionState();
      const isRecording = state?.data?.isRecording;
      if (!isRecording) {
        console.log("STARTING recording")
        const host = `${window.location.protocol}//${window.location.host}`;
        const assets = `${host}/assets`
        console.log("assets:", assets)
        callObject.startRecording({
          layout: {
            preset: 'default',
            session_assets: {
              'reaction/up': `${assets}/up.png`,
              'reaction/down': `${assets}/down.png`,
              'reaction/heart': `${assets}/heart.png`,
              'reaction/boo': `${assets}/boo.png`,
            },
          },
        });
        btn.disabled = true;
      } else {
        // There is already a recording
          const lp = callObject.participants().local;
          const ud = lp.userData;
    
          // If this is not the recording owner, early out
          if (!ud.isRecordingOwner) return;
          callObject.stopRecording();
      }
      callObject.setUserData({
        isRecordingOwner: !isRecording,
      });
      callObject.setMeetingSessionData({
        isRecording: !isRecording,
      });  
    }
 
 
}

export function updateMicLabel(isOn) {
  const btn = getMicBtn();
  if (isOn) {
    btn.innerText = 'Disable Mic';
  } else {
    btn.innerText = 'Enable Mic';
  }
}

export function updateCamLabel(isOn) {
  const btn = getCamBtn();
  if (isOn) {
    btn.innerText = 'Disable Cam';
  } else {
    btn.innerText = 'Enable Cam';
  }
}

export function setupCamToggle(callObject) {
  const btn = getCamBtn();
  btn.onclick = () => {
    const camOn = callObject.localVideo();
    callObject.setLocalVideo(!camOn);
  };
}

export function setupLeave(callObject) {
  const btn = getLeaveBtn();
  btn.onclick = () => {
    callObject.leave();
  };
}

export function enableControls(callObject) {
  setupMicToggle(callObject);
  setupCamToggle(callObject);
  setupLeave(callObject);
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = false;
  }
}

export function disableControls() {
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = true;
  }
  enableJoinForm();
}

function getMicBtn() {
  return document.getElementById('mic');
}

function getCamBtn() {
  return document.getElementById('cam');
}

function getLeaveBtn() {
  return document.getElementById('leave');
}

function getRecordBtn() {
  return document.getElementById('record');
}

function getJoinForm() {
  return document.getElementById('join');
}

function getChatForm() {
  return document.getElementById('chatForm');
}