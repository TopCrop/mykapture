

## Problem

The `transcribe-voice` edge function already has anti-narration instructions in the system prompt and tool description, but Gemini 2.5 Flash still occasionally produces "The speaker says/mentions..." patterns. The current prompt-only approach is insufficient — LLMs can ignore instructions, especially with audio input.

## Solution

Two-layer fix: strengthen the prompt AND add server-side post-processing to strip narration patterns from the output before returning it.

### Changes to `supabase/functions/transcribe-voice/index.ts`

**1. Harden the system prompt** — add explicit negative examples and a stronger framing:

Replace the system content with a version that includes:
- "You are writing notes AS the sales rep, not about them"
- Explicit banned phrases list: "The speaker", "The user", "They mention", "He/She says", "The rep", "The person"
- A "WRONG vs RIGHT" example pair to anchor the model

**2. Add post-processing after parsing the tool call result** (lines ~101-102)

After `JSON.parse(toolCall.function.arguments)`, run a cleanup function on the `transcription` and `summary` fields that:
- Uses regex to strip common narration prefixes: `/^[\s•\-]*(?:The (?:speaker|user|rep|person|caller|sales rep)[\s,]*(?:says?|mentions?|states?|describes?|explains?|notes?|talks? about|discusses?|indicates?|reports?|shares?|highlights?|refers? to|is saying|is mentioning)[:\s,]*)/gmi`
- Removes "According to the speaker..." type phrases
- Trims any resulting empty bullets

This ensures that even if the model ignores the prompt, the output is cleaned before delivery.

**3. No other changes** — no UI changes, no other files modified.

### Technical Detail

```text
Flow:
  Audio → Gemini 2.5 Flash (hardened prompt) → tool_call JSON
    → post-process: regex strip narration → return clean result
```

The regex cleanup is a safety net — the improved prompt should reduce occurrences, and the post-processing catches any that slip through.

