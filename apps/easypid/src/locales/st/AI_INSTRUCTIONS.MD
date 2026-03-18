# Sesotho Translation Guidelines (st)

## Overview
Sesotho (also known as Southern Sotho) is a Bantu language spoken by approximately 4 million people in South Africa and Lesotho. This guide provides specific instructions for translating and maintaining Sesotho translations in the Paradym Wallet application.

## Tone & Style
- **Informal & Accessible**: Use "sa hao" for possessive pronouns
- **Clear & Direct**: Prioritize understandable, straightforward language
- **Respectful**: Use appropriate noun class prefixes (mo-/ba-, le-/di-, etc.)
- **Consistent**: Maintain terminology consistency throughout the app

## Key Terminology Mappings

| English | Afrikaans | Sesotho | Context |
|---------|-----------|---------|---------|
| Wallet | Beursie | Mokotlelo | The main app container |
| Card | Kaart | Karata | A credential or document |
| Accept | Aanvaar | Amohela | Action button |
| Connect | Konnekteer | Kopanya | Establish connection |
| Share | Deel | E arogetswe | Distribute information |
| Scan | Skandeer | Badima | Capture QR code |
| Organization | Organisasie | Mokgatlo | Company or entity |
| Document | Dokument | Tokomane | File or record |

## Grammatical Rules
- **Noun Classes**: Sesotho uses distinct noun classes with prefixes (mo-/ba-, le-/di-, se-/di-, etc.)
- **Concordance**: Adjectives, verbs, and demonstratives agree with noun class
- **Tense-Aspect**: Verbs mark tense, aspect, and mood with specific affixes
- **Possessive Construction**: "sa hao" (your), "sa me" (my), etc.

## Common Phrases
- "Ke a leboha" - Thank you
- "Tswee" - Please
- "Ke maswabi" - I'm sorry
- "Ee" - Yes
- "Nnyaa" - No

## Placeholder Handling
- Placeholders {0}, {name}, {date} must remain completely unchanged
- Keep placeholders in natural grammatical positions
- Example: "Karata e tswang ho [name]" with placeholder preserved

## Code Style
- Use UTF-8 encoding for all Sesotho characters (including diacritics like š, ž)
- Avoid excessive HTML formatting
- Keep translations concise for mobile screens

## Review Checklist
- [ ] Noun class prefixes accurate
- [ ] Concordance rules followed
- [ ] Verb forms correct
- [ ] Placeholders preserved exactly
- [ ] Technical terms translated consistently
- [ ] No English mixed in (except proper nouns)

## References
- South African Government Language Policy
- Sesotho language standards and resources
- Lesotho language resources
