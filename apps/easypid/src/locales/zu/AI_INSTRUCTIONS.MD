# isiZulu Translation Guidelines (zu)

## Overview
isiZulu is a Bantu language spoken by approximately 12 million people in South Africa, primarily in KwaZulu-Natal. This guide provides specific instructions for translating and maintaining isiZulu translations in the Paradym Wallet application.

## Tone & Style
- **Informal & Accessible**: Use "wakho" for possessive pronouns
- **Clear & Direct**: Avoid overly complex sentence structures when possible
- **Respectful**: Use appropriate prefixes for nouns (i-/am-, umu-/aba-, etc.)
- **Consistent**: Keep terminology consistent throughout the app

## Key Terminology Mappings

| English | Afrikaans | isiZulu | Context |
|---------|-----------|---------|---------|
| Wallet | Beursie | Iworeli | The main app container |
| Card | Kaart | Ikhadi | A credential or document |
| Accept | Aanvaar | Ngiyavuma | Action button |
| Connect | Konnekteer | Xhumana | Establish connection |
| Share | Deel | Yafihla | Distribute information |
| Scan | Skandeer | Skena | Capture QR code |
| Organization | Organisasie | Inhlangano | Company or entity |
| Document | Dokument | Idokumenti | File or record |

## Grammatical Rules
- **Noun Prefixes**: Different noun prefixes convey singular vs plural (i-/am-, umu-/aba-, i-/izin-)
- **Agreement**: Adjectives and verbs must agree with noun class
- **Tenses**: Use appropriate past, present, and future tenses for context
- **Formal vs Informal**: "ubani" (formal) vs "wakho" (informal) for address

## Common Phrases
- "Ngiyakucelela" - I request / Please
- "Siyabonga" - Thank you
- "Uxolo" - Sorry / Excuse me
- "Yebo" - Yes
- "Cha" - No

## Placeholder Handling
- Placeholders like {0}, {name}, {date} should remain unchanged in square brackets
- Example: "I-ikhadi kusuka ku-[name]" keep the placeholder

## Code Style
- Use UTF-8 encoding for all isiZulu characters
- Avoid unnecessary HTML tags in translations
- Keep line lengths reasonable for mobile display

## Review Checklist
- [ ] Correct noun class prefixes used
- [ ] Agreements between words maintained
- [ ] Placeholders preserved correctly
- [ ] Spelling and grammar verified
- [ ] Technical terms translated consistently
- [ ] No English words left untranslated (except proper nouns)

## References
- South African Government Language Guidelines
- isiZulu dictionary and grammar resources
