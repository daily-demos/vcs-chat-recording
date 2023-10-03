/*
 * This file is responsible for all chat
 * and emoji reaction functionality.
 */

import { getCallContainerEle } from './call.js';
import rand from './util.js';

/**
 * Sets up the in-call chat form, including relevant handlers.s
 * @param {DailyCall} callObject
 * @param {func(DailyCall, {})} updateRecording
 */
export function setupChatForm(callObject, updateRecording) {
  setupEmojiReactions(callObject, updateRecording);

  // Retrieve chat form and chat input element
  const chatForm = getChatForm();
  const chatInput = chatForm.getElementsByTagName('textarea')[0];

  // Set up form submission handler
  chatForm.onsubmit = (ev) => {
    ev.preventDefault();
    try {
      // Retrieve chat input value and reset the form
      const msg = chatInput.value;
      chatForm.reset();

      // Deduce local participant's user name, if available
      const name = callObject.participants().local.user_name || 'Guest';

      // Send retrieved chat message to all other participants
      callObject.sendAppMessage({ kind: 'chat', msg }, '*');

      // Display locally sent chat message
      addChatMsg(name, msg);

      // Invoke recording update callback with chat payload
      updateRecording(callObject, {
        kind: 'chat',
        name,
        msg,
      });
    } catch (e) {
      console.error('Failed to send chat message', e);
    }
  };

  // Let participant submit a chat message with "Enter" key
  // This will invoke the "onsubmit" handler above
  chatInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
}

/**
 * Adds a chat message to the message box in the DOM
 * @param {string} name
 * @param {string} msg
 */
export function addChatMsg(name, msg) {
  const messagesEle = getMessagesEle();
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

/**
 * Shows a reaction emoji in the dom
 * @param {string} emoji
 */
export function showReaction(emoji) {
  const ele = document.createElement('div');
  ele.innerText = emoji;
  ele.className = 'reaction';
  const container = getCallContainerEle();
  container.append(ele);

  // Randomize some elements to make each
  // reaction somewhat distinct.
  // (Allowing for satisfying "reaction spam")
  const opacity = rand(5, 10) / 10;
  ele.style.opacity = opacity;

  const size = rand(20, 50) / 10;
  ele.style.fontSize = `${size}em`;

  setTimeout(() => {
    ele.style.opacity = 0;
    // Give element 2 seconds to fade out.
    setTimeout(() => {
      ele.remove();
    }, 2000);
  }, 1000);
}

/**
 * Sets up emoji reaction button handlers
 * @param {DailyCall} callObject
 * @param {func(DailyCall, {})} updateRecording
 */
function setupEmojiReactions(callObject, updateRecording) {
  // Retrieve all reaction buttons
  const reactionBtns = [
    document.getElementById('thumbsup'),
    document.getElementById('thumbsdown'),
    document.getElementById('heart'),
    document.getElementById('boo'),
  ];

  // Iterate over each button and est up its onclick handler
  for (let i = 0; i < reactionBtns.length; i += 1) {
    const btn = reactionBtns[i];
    btn.onclick = () => {
      const emoji = btn.innerText;
      // Send reactoin to all other participants,
      // then display it at the DOM and invoke recording
      // update callback.
      callObject.sendAppMessage({ kind: 'emoji', emoji });
      showReaction(emoji);
      updateRecording(callObject, { kind: 'emoji', emoji });
    };
  }
}

function getChatForm() {
  return document.getElementById('chatForm');
}

function getMessagesEle() {
  return document.getElementById('messages');
}
