const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const suggestionsEl = document.getElementById('suggestions');

const characterInfo = window.__CHARACTER__ || { id: 'dochi', starterQuestions: [] };
const conversation = [];

if (suggestionsEl && characterInfo.starterQuestions) {
  characterInfo.starterQuestions.forEach((question) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'suggestion-pill';
    pill.textContent = question;
    pill.addEventListener('click', () => {
      chatInput.value = question;
      chatInput.focus();
    });
    suggestionsEl.appendChild(pill);
  });
}

if (chatForm) {
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendBubble('user', text);
    conversation.push({ role: 'user', content: text });
    chatInput.value = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: characterInfo.id,
          messages: conversation,
          studentGrade: 4,
        }),
      });

      if (!response.ok) {
        throw new Error('응답을 불러오는 데 문제가 생겼어요.');
      }

      const data = await response.json();
      const assistantText = data.message || '곧 챗봇이 연결될 예정이에요!';
      appendBubble('assistant', assistantText);
      conversation.push({ role: 'assistant', content: assistantText });
    } catch (error) {
      appendBubble('assistant', '지금은 예시 답변만 보여드리고 있어요. 잠시 후 다시 시도해 주세요!');
    }
  });
}

function appendBubble(role, text) {
  if (!chatLog) return;
  const bubble = document.createElement('div');
  bubble.className = `bubble bubble-${role}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}
