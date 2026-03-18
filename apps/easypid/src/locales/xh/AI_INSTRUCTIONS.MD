# isiXhosa Translation Guidelines (xh)

## Overview
isiXhosa is a Bantu language spoken by approximately 8 million people in South Africa, primarily in the Eastern Cape. This guide provides specific instructions for translating and maintaining isiXhosa translations in the Paradym Wallet application.

## Tone & Style
- **Informal & Accessible**: Use "wakho" for possessive pronouns
- **Clear & Direct**: Prioritize clarity over literal translation
- **Respectful**: Use appropriate noun class prefixes (i-/am-, u-/aba-, etc.)
- **Consistent**: Maintain terminology consistency throughout the app

## Key Terminology Mappings

| English | Afrikaans | isiXhosa | Context |
|---------|-----------|----------|---------|
| Wallet | Beursie | I-Wallet | The main app container |
| Card | Kaart | Ikhadi | A credential or document |
| Accept | Aanvaar | Amkela | Action button |
| Connect | Konnekteer | Joyina | Establish connection |
| Share | Deel | Yalela | Distribute information |
| Scan | Skandeer | Skena | Capture QR code |
| Organization | Organisasie | Inhlangano | Company or entity |
| Document | Dokument | Idokukhente | File or record |

## Grammatical Rules
- **Noun Classes**: isiXhosa has multiple noun classes with distinct prefixes
- **Agreement**: All modifiers must agree with the noun class
- **Click Consonants**: Some words include unique click sounds (c, q, x)
- **Tense Marking**: Verb forms indicate past, present, and future

## Common Phrases
- "Enkosi" - Thank you
- "Ndiyaxolisa" - I'm sorry
- "Evet" - Yes
- "Hayi" - No
- "Nceda" - Please

## Placeholder Handling
- Placeholders like {0}, {name}, {date} must remain unchanged
- Keep placeholders within the natural word order
- Example: "Ikhadi elisuka ku-[name]" with placeholder preserved

## Code Style
- Use UTF-8 encoding for all isiXhosa characters including click sounds
- Avoid unnecessary HTML formatting
- Keep translations concise for mobile screens

## Review Checklist
- [ ] Noun class prefixes correct
- [ ] Agreement rules followed
- [ ] Click consonants properly rendered
- [ ] Placeholders preserved
- [ ] Technical terminology consistent
- [ ] No English words mixed in (except proper nouns)

## References
- South African Government Language Policy
- isiXhosa language resources and standards
