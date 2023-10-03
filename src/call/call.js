/*
 * All primary call operations are defined in this file.
 */


const hiddenClassName = 'hidden';

/**
 * Configures the join form
 * @param {DailyCall} callObject 
 */
export function setupJoinForm(callObject) {
  const joinForm = getJoinForm();
  joinForm.onsubmit = (ev) => {
    ev.preventDefault();

    // Disable join button to avoid double-join attempts
    const btn = joinForm.getElementsByTagName('button')[0];
    btn.disabled = true;

    const inputs = joinForm.getElementsByTagName('input');
    const roomURLInput = inputs[0];
    const nameInput = inputs[1];
 
    try {
      callObject.join({ 
        url: roomURLInput.value,
        userName: nameInput.value,
      });
    } catch (e) {
      console.error('Failed to join Daily room', e);
      showLobby();
    }
  };
}

/**
 * Enables the join form
 */
export function showLobby() {
  const inCall = getInCallEle();
  inCall.classList.add(hiddenClassName);

  const joinForm = getJoinForm();
  const btn = joinForm.getElementsByTagName('button')[0];
  btn.disabled = false;
  lobby.classList.remove(hiddenClassName);
}

/**
 * Configures the microphone toggle button
 * @param {DailyCall} callObject 
 */
export function setupMicToggle(callObject) {
  const btn = getMicBtn();
  btn.onclick = () => {
    const micOn = callObject.localAudio();
    callObject.setLocalAudio(!micOn);
  };
}

/**
 * Updates the mic button label to reflect accurate mic state
 * @param {bool} isOn 
 */
export function updateMicLabel(isOn) {
  const btn = getMicBtn();
  if (isOn) {
    btn.innerText = 'Disable Mic';
  } else {
    btn.innerText = 'Enable Mic';
  }
}

/**
 * Configures the camera toggle button
 * @param {DailyCall} callObject 
 */
export function setupCamToggle(callObject) {
  const btn = getCamBtn();
  btn.onclick = () => {
    const camOn = callObject.localVideo();
    callObject.setLocalVideo(!camOn);
  };
}

/**
 * Updates the cam button to reflect accurate cam state
 * @param {bool} isOn 
 */
export function updateCamLabel(isOn) {
  const btn = getCamBtn();
  if (isOn) {
    btn.innerText = 'Disable Cam';
  } else {
    btn.innerText = 'Enable Cam';
  }
}

/**
 * Sets up the Leave button
 * @param {DailyCall} callObject 
 */
export function setupLeave(callObject) {
  const btn = getLeaveBtn();
  btn.onclick = () => {
    callObject.leave();
  };
}

/**
 * Enables in-call controls
 * @param {DailyCall} callObject 
 */
export function enableControls(callObject) {
  setupMicToggle(callObject);
  setupCamToggle(callObject);
  setupLeave(callObject);
  const incallEle = getInCallEle();
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = false;
  }
}

/**
 * Disables in-call controls
 */
export function disableCallControls() {
  const incallEle = getInCallEle();
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = true;
  }
}

/**
 * Updates a participant's media elements
 * @param {DailyParticipant} participant 
 * @returns 
 */
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

/**
 * Updates the participant's media element with the
 * given track if needed.
 * @param {MediaStreamTrack} newTrack 
 * @param {HTMLElement} parentEle 
 * @param {"video" | "audio"} trackKind 
 * @returns 
 */
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

/**
 * Retrieves a participant's playable tracks
 * @param {DailyParticipant} participant 
 * @returns 
 */
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

/**
 * Adds a participant to the DOM
 * @param {DailyParticipant} participant 
 * @returns 
 */
export function addParticipantEle(participant) {
  // Retrieve parent to which the participant will be attached.
  const participantsEle = document.getElementById('participants');

  // Create new participant element
  const participantEle = document.createElement('div');
  participantEle.id = getParticipantEleID(participant.session_id);
  participantEle.className = 'participant';
  participantsEle.appendChild(participantEle);

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

/**
 * Removes a participant from the DOM
 * @param {string} sessionID 
 */
export function removeParticipantEle(sessionID) {
  const participantEle = getParticipantEle(sessionID);
  removeMedia(participantEle);
  participantEle.remove();
}

/**
 * Removes all participant elements from the DOM
 */
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

/**
 * Retrievecs a participant element, if one exists.
 * @param {string}} sessionID 
 * @returns 
 */
export function getParticipantEle(sessionID) {
  return document.getElementById(getParticipantEleID(sessionID));
}

/**
 * Shows the in-call view (and hides lobby)
 */
export function showInCall() {
  // Hide in-call UI and disable call controls
  const inCall = getInCallEle();
  inCall.classList.remove(hiddenClassName);
  disableCallControls();

  const lobby = getLobbyEle();
  lobby.classList.add(hiddenClassName);
}

export function getInCallEle() {
  return document.getElementById('incall');
}

export function getCallContainerEle() {
  return document.getElementById('callContainer');
}

/**
 * Cleanly removes all media within the given parent.
 * @param {HTMLElement} parentEle 
 */
function removeMedia(parentEle) {
  const videoTag = parentEle.getElementsByTagName('video')[0];
  videoTag.srcObject = null;

  const audioTags = parentEle.getElementsByTagName('audio');
  if (audioTags && audioTags.length > 0) {
    audioTags[0].srcObject = null;
  }
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
  return document.getElementById('joinForm');
}

function getLobbyEle() {
  return document.getElementById('lobby');
}

function getParticipantEleID(sessionID) {
  return `participant-${sessionID}`;
}
