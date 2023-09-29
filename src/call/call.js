const hiddenClassName = 'hidden';

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

export function updateMedia(participant) {
  const participantEle = getParticipantEle(participant.session_id);
  if (!participantEle) return;

  const playableTracks = getParticipantTracks(participant);
  if (playableTracks.videoTrack) {
    tryUpdateVideo(playableTracks.videoTrack, participantEle);
  }
  if (playableTracks.audioTrack) {
    tryUpdateAudio(playableTracks.audioTrack, participantEle);
  }
}

function tryUpdateVideo(newTrack, parentEle) {
  maybeUpdateTrack(newTrack, parentEle, 'video');
}

function tryUpdateAudio(newTrack, parentEle) {
  maybeUpdateTrack(newTrack, parentEle, 'audio');
}

function maybeUpdateTrack(newTrack, parentEle, trackKind) {
  const mediaEles = parentEle.getElementsByTagName(trackKind);
  if (!mediaEles || mediaEles.length === 0) return;

  const mediaEle = mediaEles[0];
  const currentSrc = mediaEle.srcObject;
  if (!currentSrc) {
    mediaEle.srcObject = new MediaStream([newTrack]);
    return;
  }
  const currentTrack = currentSrc.getTracks()[0];

  // Replace tracks if IDs are not the same
  if (currentTrack.id !== newTrack) {
    currentSrc.removeTrack(currentTrack);
    currentSrc.addTrack(newTrack);
  }
}

function getParticipantTracks(participant) {
  const mediaTracks = {
    videoTrack: null,
    audioTrack: null,
  };

  const playableState = 'playable';
  const loadingState = 'loading';

  const tracks = participant?.tracks;
  if (!tracks) return mediaTracks;

  const vt = tracks.video;
  const vs = vt?.state;
  if (vt.persistentTrack && (vs === playableState || vs === loadingState)) {
    mediaTracks.videoTrack = vt.persistentTrack;
  }

  // Only get audio track if this is a remote participant
  if (!participant.local) {
    const at = tracks.audio;
    const as = at?.state;
    if (at.persistentTrack && (as === playableState || as === loadingState)) {
      mediaTracks.audioTrack = at.persistentTrack;
    }
  }
  return mediaTracks;
}

export function addParticipantEle(participant, parentEle) {
  const participantEle = document.createElement('div');
  participantEle.id = getParticipantEleID(participant.session_id);
  participantEle.className = 'participant';
  parentEle.appendChild(participantEle);

  // Add video tag
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  participantEle.appendChild(video);

  // If this is a local participant, early-out as
  // we won't need to play their audio.
  if (participant.local) return;

  // Add audio tag
  const audio = document.createElement('audio');
  video.autoplay = true;
  participantEle.appendChild(audio);
}

export function removeParticipantEle(sessionID) {
  const participantEle = getParticipantEle(sessionID);
  removeMedia(participantEle);
  participantEle.remove();
}

export function removeAllParticipantEles() {
  const participantsContainer = document.getElementById('participants');
  const participants =
    participantsContainer.getElementsByClassName('participant');
  while (participants.length > 0) {
    const pEle = participants[0];
    removeMedia(pEle);
    pEle.remove();
  }
}

export function getParticipantEle(sessionID) {
  return document.getElementById(getParticipantEleID(sessionID));
}

export function showCallContainer() {
  const cc = getCallContainer();
  cc.classList.remove(hiddenClassName);
}

export function hideCallContainer() {
  const cc = getCallContainer();
  cc.classList.add(hiddenClassName);
}

export function getCallContainer() {
  return document.getElementById('callcontainer');
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

function getJoinForm() {
  return document.getElementById('join');
}

function removeMedia(parentEle) {
  const videoTag = parentEle.getElementsByTagName('video')[0];
  videoTag.srcObject = null;

  const audioTags = parentEle.getElementsByTagName('audio');
  if (audioTags && audioTags.length > 0) {
    audioTags[0].srcObject = null;
  }
}

function getParticipantEleID(sessionID) {
  return `participant-${sessionID}`;
}
