const visibleMessages = [];
const visibleReactions = [];

export function setupRecordToggle(callObject) {
  const btn = getRecordBtn();
  btn.onclick = () => {
    btn.disabled = true;

    const state = callObject.meetingSessionState();
    const isRecording = state?.data?.isRecording;
    if (!isRecording) {
      startRecording(callObject);
    } else {
      stopRecording(callObject);
    }
    callObject.setUserData({
      isRecordingOwner: !isRecording,
    });
    callObject.setMeetingSessionData({
      isRecording: !isRecording,
    });
  };
}

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

function stopRecording(callObject) {
  // There is already a recording
  const lp = callObject.participants().local;
  const ud = lp.userData;

  // If this is not the recording owner, early out
  if (!ud.isRecordingOwner) return;
  callObject.stopRecording();
}
export function updateRecordBtn(recordingInProgress, isRecordingOwner) {
  const btn = getRecordBtn();
  if (!recordingInProgress) {
    btn.innerText = 'Start Recording';
    btn.disabled = false;
    return;
  }
  btn.innerText = 'Stop Recording';
  if (!isRecordingOwner) {
    btn.disabled = true;
  } else {
    btn.disabled = false;
  }
}

export function updateRecording(callObject, data) {
  const lp = callObject.participants().local;

  if (!lp?.userData?.isRecordingOwner) return;
  console.log('updating recording: ', data);
  if (data.kind === 'chat') {
    const chatLine = `${data.name}: ${data.msg}`;
    visibleMessages.push(chatLine);
    const maxDisplayed = 5;
    while (visibleMessages.length > maxDisplayed) {
      visibleMessages.shift();
    }
    callObject.updateRecording({
      layout: {
        preset: 'custom',
        composition_params: {
          showTextOverlay: true,
          'text.align_horizontal': 'right',
          'text.align_vertical': 'bottom',
          'text.offset_x_gu': -1,
          'text.offset_y_gu': 0.5,
          'text.fontSize_gu': 1.2,
          'text.fontFamily': 'Exo',
          'text.color': 'rgba(255, 255, 255, 0.95)',
          'videoSettings.showParticipantLabels': false,
          'text.content': visibleMessages.join('\r\n'),
        },
      },
    });
    return;
  }
  if (data.kind === 'emoji') {
    const { emoji } = data;
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
        return;
    }

    callObject.updateRecording({
      layout: {
        preset: 'custom',
        composition_params: {
          showImageOverlay: true,
          'image.position': 'top-left',
          'image.enableFade': true,
          'image.assetName': assetName,
          'image.opacity': 0.9,
          'image.height_gu': 5,
        },
      },
    });
  }
}

function getRecordBtn() {
  return document.getElementById('record');
}
