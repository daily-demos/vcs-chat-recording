import { getInCallEle } from './call.js';

export function setupChatForm(callObject, updateRecording) {
  setupEmojiReactions(callObject, updateRecording);
  const chatForm = getChatForm();
  chatForm.onsubmit = (ev) => {
    ev.preventDefault();
    try {
      const chatInput = chatForm.getElementsByTagName('input')[0];
      const msg = chatInput.value;
      chatForm.reset();
      const name = callObject.participants().local.user_name || 'Guest';

      callObject.sendAppMessage({ kind: 'chat', msg }, '*');
      addChatMsg(name, msg);
      updateRecording(callObject, {
        kind: 'chat',
        name,
        msg,
      });
    } catch (e) {
      console.error('Failed to send chat message', e);
    }
  };
}

export function addChatMsg(name, msg) {
  const messagesEle = document.getElementById('messages');
  const msgContainerEle = document.createElement('div');

  const nameEle = document.createElement('span');
  nameEle.className = 'chatName';
  nameEle.innerText = `${name}: `;

  const msgEle = document.createElement('span');
  msgEle.className = 'chatMsg';
  msgEle.innerText = msg;

  msgContainerEle.append(nameEle, msgEle);
  messagesEle.appendChild(msgContainerEle);
}

export function showReaction(emoji) {
  const ele = document.createElement('div');
  ele.innerText = emoji;
  ele.className = 'reaction';
  const container = getInCallEle();
  container.append(ele);

  setTimeout(() => {
    ele.style.opacity = 0;
    // Give element 2 seconds to fade out.
    setTimeout(() => {
      ele.remove();
    }, 2000);
  }, 3000);
}

function setupEmojiReactions(callObject, updateRecording) {
  const reactionBtns = [
    document.getElementById('thumbsup'),
    document.getElementById('thumbsdown'),
    document.getElementById('heart'),
    document.getElementById('boo'),
  ];
  for (let i = 0; i < reactionBtns.length; i += 1) {
    const btn = reactionBtns[i];
    btn.onclick = () => {
      const emoji = btn.innerText;
      callObject.sendAppMessage({ kind: 'emoji', emoji });
      showReaction(emoji);
      updateRecording(callObject, { kind: 'emoji', emoji });
    };
  }
}

function getChatForm() {
  return document.getElementById('chatForm');
}
