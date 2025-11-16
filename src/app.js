const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const characters = require('./data/characters');
const buildSystemPrompt = require('./lib/prompt');

dotenv.config();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/', (req, res) => {
    res.render('landing', { characters });
  });

  app.get('/chat', (req, res) => {
    const characterId = req.query.character;
    const character = characters[characterId];

    if (!character) {
      return res.status(404).render('404', { message: '캐릭터를 찾을 수 없어요.' });
    }

    res.render('chat', { character, characterId });
  });

  app.post('/api/chat', async (req, res) => {
    const { character: characterId, messages = [], studentGrade = 4 } = req.body || {};
    const character = characters[characterId];

    if (!character) {
      return res.status(400).json({ message: '알 수 없는 캐릭터입니다.' });
    }

    if (!openai) {
      return res.status(500).json({ message: 'OpenAI API 키가 설정되지 않았어요.' });
    }

    const systemPrompt = buildSystemPrompt(character, studentGrade);
    const trimmedMessages = Array.isArray(messages) ? messages.slice(-10) : [];

    const sanitized = trimmedMessages
      .filter((msg) => typeof msg?.content === 'string')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content.trim(),
      }));

    const chatMessages = [{ role: 'system', content: systemPrompt }, ...sanitized];

    if (sanitized.length === 0) {
      chatMessages.push({
        role: 'assistant',
        content: character.greeting,
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.6,
        messages: chatMessages,
      });

      const aiMessage = completion.choices?.[0]?.message?.content?.trim();

      if (!aiMessage) {
        throw new Error('응답이 비어 있습니다.');
      }

      return res.json({ message: aiMessage });
    } catch (error) {
      console.error('OpenAI chat error:', error);
      return res.status(500).json({ message: '챗봇과 연결하는 중 문제가 발생했어요.' });
    }
  });

  app.use((req, res) => {
    res.status(404).render('404', { message: '페이지를 찾을 수 없어요.' });
  });

  return app;
}

module.exports = createApp;
