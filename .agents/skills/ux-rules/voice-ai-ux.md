# Voice and AI UX Reference

Comprehensive guide to designing user experiences for conversational interfaces, voice UIs, AI-powered products, and emerging AI interaction patterns.

---

## Conversational UI Design

### Types of Conversational Interfaces
| Type | Description | Example |
|------|-------------|---------|
| **Chatbot (text)** | Text-based turn-taking dialogue | Customer support chat |
| **Voice UI (VUI)** | Speech input and output | Alexa, Siri, Google Assistant |
| **Multimodal** | Combined text, voice, visual, touch | ChatGPT with images, Google Lens |
| **Agentic UI** | AI that takes actions on user's behalf | Auto-scheduling, auto-purchasing |
| **Copilot** | AI embedded in existing workflows | GitHub Copilot, Microsoft 365 Copilot |

### Conversational Design Principles

**1. Set expectations early.**
Tell users what the bot can and cannot do in the first interaction. Manage scope explicitly.

**2. Be concise.**
Chat messages should be shorter than written content. One idea per message bubble. Avoid walls of text.

**3. Provide escape hatches.**
Always offer: "Talk to a human," "Start over," "Go back," and "Main menu."

**4. Confirm understanding.**
Reflect back what you understood before taking action. "I'll schedule a meeting with Sarah for Tuesday at 2pm. Is that right?"

**5. Handle ambiguity gracefully.**
When intent is unclear, ask a clarifying question with specific options (not open-ended).

**6. Maintain context.**
Remember prior turns in the conversation. Don't ask for information already provided.

**7. Match tone to context.**
Support chat: empathetic and professional. Shopping assistant: enthusiastic but not pushy. Healthcare: calm and precise.

---

## Chatbot UX Patterns

### Conversation Starters
- **Welcome message** with capability summary and 2–3 suggested prompts.
- **Quick reply buttons** for common intents (not open text field only).
- **Contextual starters** based on page user is on ("Ask about this product").
- **Persistent input** always visible at bottom.

### Message Types
| Type | Use | Design |
|------|-----|--------|
| Text | Standard response | Left-aligned (bot), right-aligned (user) |
| Quick replies | Suggested responses | Horizontal button chips below message |
| Cards | Rich content (product, article) | Image + title + description + CTA |
| Carousel | Multiple cards | Horizontal scrollable cards |
| List | Options to choose from | Numbered or bulleted items |
| Image/Media | Visual response | Inline with caption |
| Typing indicator | Bot is processing | Animated dots (max 3–5 seconds) |
| System message | Status updates | Centered, muted style |

### Chatbot Flow Patterns

**Linear flow:**
User intent → Bot response → Next step → Completion.
Best for: guided tasks (booking, troubleshooting).

**Branching flow:**
Decision points lead to different paths.
Best for: FAQ, triage, product recommendation.

**Free-form flow:**
Open conversation with NLU intent matching.
Best for: General Q&A, search replacement.

**Hybrid flow:**
Quick replies for common paths + free text for everything else.
Best for: Most production chatbots (recommended default).

### Chatbot Error Handling
| Error | Response Pattern |
|-------|-----------------|
| Unrecognized intent | "I'm not sure I understand. Did you mean: [options]?" |
| Out of scope | "I can't help with that, but I can [alternatives]." |
| System error | "Something went wrong. Let me try again." + retry |
| Timeout | "Are you still there? I can help with [options]." |
| Profanity | Neutral redirect: "Let's focus on how I can help you." |

### Handoff to Human
- Trigger: user requests human, bot fails 2–3 times, or sentiment drops.
- Transfer: full conversation history to agent.
- Expectation: "Connecting you to [name]. Average wait: 2 minutes."
- Fallback: if no agents available, offer callback or email.

---

## Voice User Interface (VUI) Design

### VUI Design Principles (Google, Amazon, Apple)

**1. One breath rule.**
Spoken responses should be short enough to say in one breath (~5–7 seconds).

**2. Speakable language.**
Write for the ear, not the eye. No abbreviations, URLs, or special characters.
- Bad: "Visit example.com/pricing"
- Good: "I found pricing information. Would you like me to send a link to your phone?"

**3. Offer choices, not open questions.**
- Bad: "What would you like to do?"
- Good: "Would you like to check your order status or speak with support?"

**4. Confirm destructive actions.**
Always confirm before irreversible actions. "Are you sure you want to cancel your subscription?"

**5. Progressive disclosure.**
Start simple; offer more detail on request. "Your meeting is at 2pm. Want more details?"

### VUI Interaction Model
```
User speaks → Wake word / Push-to-talk → ASR (speech-to-text)
→ NLU (intent + entities) → Business logic → Response generation
→ TTS (text-to-speech) → User hears response
```

### VUI Feedback Patterns
| State | Audio | Visual (if screen present) |
|-------|-------|---------------------------|
| Listening | Earcon (beep) | Pulsing animation |
| Processing | Brief silence or earcon | Loading indicator |
| Speaking | TTS output | Text transcript displayed |
| Error | Error earcon | Error message + retry prompt |
| End | Closing earcon | Return to idle state |

### VUI Constraints
- **No visual reference:** User can't see options; must remember choices.
- **Linear time:** Can't skip ahead or scan; information must be paced.
- **Public context:** Users may not want to speak private info aloud.
- **Accent/dialect:** ASR accuracy varies; design for misunderstanding.
- **Ambient noise:** May interfere with recognition.

### Multimodal VUI (Screen + Voice)
When a screen is available (smart displays, car, phone):
- Show options visually while speaking them.
- Display transcript of conversation.
- Use visual cards for complex information.
- Allow touch selection as alternative to voice.

---

## AI Error Handling

### Types of AI Errors
| Error Type | Example | User Impact |
|-----------|---------|-------------|
| **Hallucination** | Fabricated facts, citations | Misinformation, lost trust |
| **Misunderstanding** | Wrong intent interpretation | Wrong action taken |
| **Incomplete** | Partial answer to complex question | User must re-ask |
| **Outdated** | Training data cutoff | Incorrect current information |
| **Overconfident** | Presenting uncertain info as fact | False trust |
| **Harmful** | Biased, offensive, or dangerous output | User harm, brand damage |
| **Timeout** | Model too slow to respond | Abandoned task |

### AI Error UX Patterns

**1. Acknowledge limitations proactively.**
"I may not have the latest information on this topic. Please verify important details."

**2. Confidence indicators.**
- High confidence: direct answer.
- Medium confidence: "I think..." or "Based on available information..."
- Low confidence: "I'm not sure, but..." + suggest alternatives.

**3. Source attribution.**
Link to sources for factual claims. "According to [source]..." with clickable references.

**4. Regenerate and refine.**
"Try again" button, "Make it shorter/longer," "Explain differently."

**5. Human fallback.**
"Would you like me to connect you with a human expert?"

**6. Graceful degradation.**
If AI fails, fall back to search, FAQ, or structured options — never a dead end.

**7. Error recovery without blame.**
- Bad: "I couldn't understand your question."
- Good: "Let me try a different approach. Are you asking about [option A] or [option B]?"

### Hallucination Prevention UX
- Display "AI-generated" label on all AI content.
- Require user confirmation before AI-initiated actions.
- Provide "Report inaccurate response" feedback mechanism.
- For high-stakes domains (medical, legal, financial): mandatory disclaimers.

---

## Prompt Design for UX

### System Prompt Architecture
```
Role: You are a [specific role] for [product].
Capabilities: You can [list of actions].
Constraints: You cannot [list of limitations].
Tone: [Professional/Friendly/Concise].
Format: [Response structure guidelines].
Safety: [Content policy boundaries].
```

### Prompt UX Principles
1. **Constrain scope** in system prompts to prevent off-topic responses.
2. **Define output format** (JSON, markdown, bullet points) for consistent UI rendering.
3. **Set token limits** to prevent overly long responses.
4. **Include few-shot examples** for consistent response patterns.
5. **Specify error handling** behavior in prompts.

### User-Facing Prompt Patterns
| Pattern | UI Element | Example |
|---------|-----------|---------|
| Suggested prompts | Chips/buttons | "Summarize this page" |
| Prompt templates | Fill-in-the-blank | "Write a [tone] email about [topic]" |
| Prompt history | Recent prompts list | Re-run previous queries |
| Prompt builder | Guided form | Step-by-step query construction |
| Slash commands | Power user shortcuts | "/summarize", "/translate" |

### Prompt Input Design
- **Multi-line text area** (not single-line input) for complex prompts.
- **Character/token counter** for models with limits.
- **Submit on Enter** (Shift+Enter for newline).
- **Stop generation** button visible during streaming.
- **Edit and resubmit** previous prompts.
- **Attach context** (files, images, selected text) with clear indicators.

---

## AI Trust and Transparency

### Trust Framework for AI Products
| Level | What to Show | When |
|-------|-------------|------|
| **Disclosure** | "AI-generated" label | Always on AI output |
| **Explanation** | Why this recommendation | On request or for high-stakes |
| **Control** | Edit, reject, regenerate | Always available |
| **Accountability** | Report problem, human review | Accessible from any AI output |
| **Data privacy** | What data is used, retention | During onboarding and settings |

### AI Disclosure Requirements (2024–2025 Regulatory Landscape)
- **EU AI Act:** Transparency obligations for AI-generated content.
- **FTC:** AI claims must be substantiated; no deceptive AI marketing.
- **California BOT Act:** Disclose when users interact with bots.
- **Best practice:** Proactive disclosure regardless of jurisdiction.

### Building AI Trust
1. **Start with competence** — AI must work reliably before adding features.
2. **Show your work** — reasoning, sources, confidence levels.
3. **Admit uncertainty** — "I don't know" is better than a wrong answer.
4. **User control** — always allow override, edit, and rejection.
5. **Consistent behavior** — unpredictable AI erodes trust faster than limited AI.
6. **Privacy respect** — clear data usage policies; opt-out options.
7. **Gradual autonomy** — earn trust before giving AI more agency.

---

## Latency Patterns for AI

AI responses are inherently slower than traditional UI. Latency UX is critical.

### Latency Thresholds
| Duration | User Perception | UX Pattern |
|----------|----------------|------------|
| <1s | Instant | No indicator needed |
| 1–3s | Noticeable delay | Typing indicator or skeleton |
| 3–10s | Waiting | Progress message + streaming |
| 10–30s | Long wait | Progress bar + cancel option |
| >30s | Too long | Background processing + notification |

### Streaming Response UX
- **Token-by-token display** creates perception of speed.
- **Cursor/blink indicator** at end of streaming text.
- **Stop button** always visible during generation.
- **Partial results** are useful (don't wait for completion to show).
- **Auto-scroll** to follow streaming text; pause if user scrolls up.

### Latency Mitigation Patterns
| Pattern | Description | Best For |
|---------|-------------|----------|
| **Streaming** | Show tokens as generated | Text generation |
| **Skeleton UI** | Show content shape while waiting | Structured output |
| **Optimistic UI** | Show expected result immediately | Simple, predictable actions |
| **Background processing** | "I'll work on this and notify you" | Long tasks (>30s) |
| **Progressive loading** | Show partial results, refine | Multi-step AI tasks |
| **Prefetch** | Start processing before user submits | Predictable next actions |
| **Caching** | Instant results for repeated queries | FAQ, common prompts |

### Waiting UX Copy
- Don't use static "Loading..." — rotate contextual messages.
- "Analyzing your document..." / "Searching relevant sources..." / "Composing response..."
- Show elapsed time for waits >5s.
- Always provide cancel option for waits >3s.

---

## AI Disclosure and Ethics

### Disclosure Patterns
- **Persistent badge:** "AI" icon on all AI-generated content.
- **Inline label:** "Generated by AI" below response.
- **Onboarding disclosure:** Explain AI role during first use.
- **Watermark:** Subtle visual marker on AI-generated images.
- **Metadata:** Machine-readable AI generation markers.

### Ethical AI UX Guidelines
1. **Never pretend AI is human** — disclose bot/AI identity.
2. **Don't exploit vulnerability** — no AI manipulation of emotional states for conversion.
3. **Respect user agency** — AI suggests, user decides (especially for high-stakes).
4. **Protect vulnerable users** — children, elderly, distressed users get extra safeguards.
5. **Avoid bias amplification** — test AI outputs across demographics.
6. **Enable feedback** — thumbs up/down minimum; detailed feedback preferred.
7. **Data minimization** — collect only what's needed for the AI feature.
8. **Right to human review** — users can escalate AI decisions to humans.

---

## 2024–2025 AI UX Research Findings

### Key Research from NNG, Google, Microsoft, and Academia

**1. AI as Collaborator, Not Oracle (NNG, 2024)**
Users trust AI more when positioned as a "copilot" or "assistant" rather than an authority. Frame AI as augmenting human judgment.

**2. Generative UI (Google Research, 2024)**
AI that generates interface elements on-the-fly based on user intent. Early stage but promising for personalized dashboards and forms.

**3. Conversational Repair (Microsoft Research, 2024)**
Users naturally try to "repair" misunderstood AI interactions. Support correction patterns: "No, I meant..." should work seamlessly.

**4. AI Fatigue (NNG, 2025)**
Users are developing skepticism toward AI features due to over-promising marketing. Under-promise and over-deliver.

**5. Multimodal Input Preference (Anthropic Research, 2024)**
Users prefer combining text, image, and file upload in single prompts. Support multiple input modalities in one interface.

**6. Context Window UX (Industry, 2024–2025)**
As context windows grow, users expect AI to "remember" entire projects. Long-context UX needs: memory indicators, context management, and selective forgetting.

**7. Agentic UX Concerns (NNG, 2025)**
Users are uncomfortable with AI taking autonomous actions. Require explicit confirmation for any action with external effects.

**8. Personalization vs Privacy (Pew Research, 2024)**
Users want personalized AI but are concerned about data usage. Provide granular controls and visible privacy indicators.

### Emerging AI UX Patterns (2025)
| Pattern | Description | Maturity |
|---------|-------------|----------|
| Inline AI | AI actions within existing UI (Notion AI) | Production |
| AI sidebar | Persistent AI panel alongside content | Production |
| Generative UI | AI creates UI components on demand | Experimental |
| AI memory | Persistent user preferences and history | Early production |
| Multi-agent | Multiple AI agents collaborating | Experimental |
| Voice + vision | Combined speech and visual understanding | Early production |
| AI-native apps | Products designed around AI from ground up | Emerging |

---

## AI UX Checklist

### Before Launch
- [ ] AI capabilities and limitations disclosed to users
- [ ] Error states designed for all failure modes
- [ ] Streaming response UX implemented
- [ ] Cancel/stop generation available
- [ ] Human fallback path exists
- [ ] Feedback mechanism (thumbs up/down minimum)
- [ ] AI-generated content labeled
- [ ] High-stakes actions require confirmation
- [ ] Privacy policy covers AI data usage
- [ ] Tested with diverse user groups
- [ ] Latency UX tested at p50, p90, and p99
- [ ] Accessibility: screen reader compatible, keyboard navigable

---

## Sources

- Nielsen Norman Group. *AI UX articles*. https://www.nngroup.com/topic/ai/
- Google. *Conversation Design*. https://developers.google.com/assistant/conversation-design
- Amazon. *Alexa Design Guide*. https://developer.amazon.com/en-US/docs/alexa/alexa-design/get-started.html
- Apple. *Siri Human Interface Guidelines*. https://developer.apple.com/design/human-interface-guidelines/siri
- Microsoft. *Conversational UX Design*. https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-fundamentals
- Shneiderman, B. *Human-Centered AI*. Oxford University Press.
- Amershi, S. et al. *Guidelines for Human-AI Interaction*. CHI 2019. https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/
- Anthropic. *Claude Documentation*. https://docs.anthropic.com/
- OpenAI. *GPT Best Practices*. https://platform.openai.com/docs/guides/prompt-engineering
- EU AI Act. https://artificialintelligenceact.eu/
- Google PAIR. *People + AI Guidebook*. https://pair.withgoogle.com/guidebook/
- Pearl, C. *Designing Voice User Interfaces*. O'Reilly.
