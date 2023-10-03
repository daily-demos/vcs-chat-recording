/*
 * This file is responsible for all recording operations.
 * This includes starting/stopping the recording,
 * managing "Record" button state,
 * and updating VCS text and image overlays for chat and emojis.
 */

import rand from "./util.js";

const visibleMessages = [];
let reactionTimeout;

/**
 * Reflects recording state, such as whether
 * the local participant is the owner of an ongoing recording
 */
export const recordingState = {
  isRecordingOwner: false,
};

/**
 * Sets up the Record button to toggle recording on/off.
 * @param {DailyCall} callObject 
 */
export function setupRecordToggle(callObject) {
  const btn = getRecordBtn();
  btn.onclick = () => {
    btn.disabled = true;

    const state = callObject.meetingSessionState();
    const isRecording = state?.data?.isRecording;
    if (!isRecording) {
      startRecording(callObject);
    } else if (recordingState.isRecordingOwner) {
      callObject.stopRecording();
    }
    recordingState.isRecordingOwner = !isRecording;

    callObject.setMeetingSessionData({
      isRecording: !isRecording,
    });
  };
}

/**
 * Starts the Daily recording
 * @param {DailyCall} callObject
 */
function startRecording(callObject) {
  const assets =
    'https://raw.githubusercontent.com/daily-demos/vcs-chat-recording/ls/wip/src/assets';
  callObject.startRecording({
    layout: {
      preset: 'custom',
      session_assets: {
        'images/up': `${assets}/up.png`,
        'images/down': `${assets}/down.png`,
        'images/heart': `${assets}/heart.png`,
        'images/boo': `${assets}/boo.png`,
      },
    },
  });
}

/**
 * Enables and disables the button and adjusts its label
 * as needed based on whether a recording is in progress
 * and whether the local participant is the recording owner.
 * @param {bool} recordingInProgress
 * @returns
 */
export function updateRecordBtn(recordingInProgress) {
  const btn = getRecordBtn();
  if (!recordingInProgress) {
    btn.innerText = 'Start Recording';
    btn.disabled = false;
    btn.className = "light-btn"
    return;
  }
  btn.innerText = 'Stop Recording';
  btn.className = "teal-btn"
  if (recordingState.isRecordingOwner) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}

/**
 * Updates the Daily recording to display the data provided,
 * which should be either a chat message or an emoji reaction object.
 * @param {DailyCall} callObject
 * @param {*} data
 * @returns
 */
export function updateRecording(callObject, data) {
  // If this local participant is not the owner of the recording,
  // do nothing.
  if (!recordingState.isRecordingOwner) return;

  // Deduce appropriate layout update based on the kind of
  // element we're showing.
  let layout;
  if (data.kind === 'chat') {
    layout = getChatRecordingLayout(data.name, data.msg);
  } else if (data.kind === 'emoji') {
    layout = getReactionRecordingLayout(data.emoji);

    // Reset the timeout to clear the reaction
    if (reactionTimeout) {
      window.clearTimeout(reactionTimeout);
    }
    reactionTimeout = window.setTimeout(() => {
      console.log('clearing reaction');
      callObject.updateRecording({ layout: getClearReactionLayout() });
    }, 1000);
  }

  // If a layout was found, update the recording with it.
  if (layout) {
    console.log('updating recording');
    callObject.updateRecording({ layout });
  }
}

/**
 * Returns appropriate VCS layout for recording a new
 * chat message, and manages the visible chat messages buffer.
 * @param {string} name
 * @param {string} chatMsg
 * @returns
 */
function getChatRecordingLayout(name, chatMsg) {
  const chatLine = `${name}: ${chatMsg}`;
  visibleMessages.push(chatLine);
  const maxDisplayed = 15;
  while (visibleMessages.length > maxDisplayed) {
    visibleMessages.shift();
  }
  // Specify VCS text overlay options
  const vcsLayout = {
    preset: 'custom',
    composition_params: {
      showTextOverlay: true,
      'text.align_horizontal': 'right',
      'text.align_vertical': 'bottom',
      'text.offset_x_gu': -1,
      'text.offset_y_gu': 0.5,
      'text.fontSize_gu': 1,
      'text.fontFamily': 'Exo',
      'text.color': 'rgba(255, 255, 255, 0.95)',
      'videoSettings.showParticipantLabels': false,
      'text.content': visibleMessages.join('\r\n'),
    },
  };
  return vcsLayout;
}

/**
 * Returns appropriate VCS layout for recording a new
 * reaction emoji, and manages reaction visibility timing.
 * @param {string} emoji
 * @returns
 */
function getReactionRecordingLayout(emoji) {
  let assetName = '';
  // Get asset name
  switch (emoji) {
    case '❤️':
      assetName = 'heart';
      break;
    case '👍':
      assetName = 'up';
      break;
    case '👎':
      assetName = 'down';
      break;
    case '🎃':
      assetName = 'boo';
      break;
    default:
      console.error('Unrecognized emoji: ', emoji);
      return null;
  }

  // Randomize some display parameters to 
  // make each new reaction look distinct,
  // allowing for satisfying "reaction spam"
  const imageHeight = rand(2, 5);
  const imageOpacity = rand(5, 10) / 10;
  const vcsLayout = {
    preset: 'custom',
    composition_params: {
      showImageOverlay: true,
      'image.position': 'top-left',
      'image.enableFade': true,
      'image.assetName': assetName,
      'image.opacity': imageOpacity,
      'image.height_gu': imageHeight,
    },
  };
  return vcsLayout;
}

function getClearReactionLayout() {
  return {
    preset: 'custom',
    composition_params: {
      showImageOverlay: false,
    },
  };
}

function getRecordBtn() {
  return document.getElementById('record');
}