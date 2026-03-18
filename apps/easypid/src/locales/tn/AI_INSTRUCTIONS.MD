# Setswana Translation Guidelines (tn)

## Overview
Setswana is a Bantu language spoken by approximately 8.2 million people in South Africa and Botswana. This guide provides specific instructions for translating and maintaining Setswana translations in the Paradym Wallet application.

## Tone & Style
- **Informal & Accessible**: Use "sa gago" for possessive pronouns
- **Clear & Conversational**: Favor natural, easy-to-understand phrasing
- **Respectful**: Use appropriate noun class prefixes (mo-/ba-, le-/di-, etc.)
- **Consistent**: Keep terminology uniform throughout the app

## Key Terminology Mappings

| English | Afrikaans | Setswana | Context |
|---------|-----------|----------|---------|
| Wallet | Beursie | Lokwalane | The main app container |
| Card | Kaart | Karata | A credential or document |
| Accept | Aanvaar | Dumela | Action button |
| Connect | Konnekteer | Kopanya | Establish connection |
| Share | Deel | Abositswe | Distribute information |
| Scan | Skandeer | Badima | Capture QR code |
| Organization | Organisasie | Setsi | Company or entity |
| Document | Dokument | Tokwalo | File or record |

## Grammatical Rules
- **Noun Classes**: Setswana has fixed noun classes with prefixes (mo-/ba-, le-/di-, mo-/me-, se-/di-, etc.)
- **Agreement**: All modifiers and verbs agree with the noun class
- **Copula Forms**: "ke", "o", "wa" for different persons and classes
- **Possessive Structure**: "sa ga [noun]" or stand-alone possessives

## Common Phrases
- "Ke a leboga" - Thank you
- "Tswee" - Please
- "Aitsi" - Sorry
- "Ee" - Yes
- "Nnyaa" - No

## Placeholder Handling
- Preserve placeholders {0}, {name}, {date} without modification
- Place placeholders in grammatically appropriate positions
- Example: "Karata e go tswa go [name]" keeping placeholder intact

## Code Style
- Use UTF-8 encoding for all Setswana characters
- Minimize complex HTML in translations
- Optimize text length for mobile display

## Review Checklist
- [ ] Noun class prefixes correct
- [ ] Agreement patterns followed
- [ ] Verb forms appropriate
- [ ] Placeholders preserved exactly
- [ ] Technical terminology consistent
- [ ] No English words mixed in (except proper nouns)

## References
- South African Government Language Guidelines
- Setswana language standards and resources
