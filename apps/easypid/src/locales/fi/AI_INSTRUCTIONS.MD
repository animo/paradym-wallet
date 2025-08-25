## Finnish Translation Rules for Identity Wallet App

### **Tone & Style**
- Use **informal tone** (sinä-muoto, not te-muoto)
- Keep translations **natural and conversational**, not literal
- Maintain a **helpful, user-friendly** tone throughout
- Avoid bureaucratic or overly technical language

### **Key Terminology**
- **Wallet** = "lompakko" (consistently used)
- **Card** = "kortti" (for digital credentials)
- **Credential** = "todiste" (CHANGED from "valtuutus" - use "todiste" for consistency)
- **Share** = "jaa" (for data sharing)
- **PIN code** = "PIN-koodi" (always hyphenated)
- **Biometrics** = "biometriikka" or "biometrinen tunnistus"
- **Organization** = "organisaatio" or "toimija" (use "toimija" for more natural Finnish)
- **Verification/Verifier** = "tarkastus/vastaanottaja" (CHANGED from "tarkastaja" to "vastaanottaja")
- **Request** = "pyyntö"
- **Document** = "asiakirja"
- **Internet** = "Internet" (with capital I, not "internet")
- **Party/Entity** = "toimija" (more natural than "osapuoli")

### **Grammar & Structure**
- Use **active voice** when possible
- Keep **question format** for confirmations: "Haluatko varmasti...?" (CHANGED from "Oletko varma, että...")
- Use **instructional imperatives**: "Skannaa", "Syötä", "Valitse"
- Prefer **shorter sentences** over complex structures
- **Word order**: Place key information first for clarity

### **Specific Patterns & Improvements**
#### **Quantity expressions**
- **"X total"** = "Yhteensä X" (not "X yhteensä")
- **Single items**: Simply "1 kortti" (not "1 kortti yhteensä")

#### **Action descriptions**
- **"wants to offer"** = "tarjoaa" (not "haluaa tarjota")
- **"wants to request"** = "pyytää" (not "haluaa pyytää")
- **Use simple present tense** instead of "wants to + verb" constructions

#### **Success/completion messages**
- Keep **concise**: "Kortti lisättiin lompakkoosi!" (not "onnistuneesti")
- **Past tense for completed actions**: "lisättiin", "jaettiin"

#### **Interface elements**
- **"About this party"** = "Tietoja tästä toimijasta"
- **"Previous interactions"** = "Aiemmat yhteydet" (not "vuorovaikutukset")
- **"First interaction"** = "Ensimmäinen yhteys"

### **Technical Elements**
- **Preserve placeholders** exactly as they appear: `{userName}`, `{0}`, etc.
- **Keep XML tags** intact: `<0>{name}</0>`, etc.
- **Maintain formatting** elements like newlines (`\n`)
- **Don't translate** technical terms like "QR-koodi", "PIN-koodi", "eID"

### **Context-Specific Rules**
#### **Error messages**
- Start with what went wrong, then suggest action
- **"Cancel"** = "Peru" (CHANGED from "Peruuta")

#### **Process descriptions**
- **"Setup"** = "Luo" or "Valmistele" (not just "Aseta")
- **"Getting information"** = "Haetaan tietoja: {0}" (colon format)

#### **Authentication/Security**
- **"Biometric authentication"** = "Biometrinen tunnistus" (not "tunnistautuminen")
- **"Cancelled"** = "Peruttu" (not "Peruutettu")

#### **Connection/Network**
- **"Online again"** = "Verkkoyhteys toimii taas" (more descriptive)
- Use **"Internet-yhteys"** with hyphen consistently

### **Common Patterns**
- **"Failed to..."** = "...epäonnistui" (not "epäonnistui tekemään")
- **"Successfully..."** = Often omit "onnistuneesti" for brevity
- **"Unable to..."** = "...ei voitu" or "Ei voi..."
- **"You need to..."** = "Sinun tulee..." or "Tarvitset..."
- **"Please..."** = Often omitted or "Ole hyvä ja..." (use sparingly)
- **"This action cannot be undone"** = "Tätä toimintoa ei voi perua" (not "peruuttaa")

### **Presentation & Sharing**
- **"The following information will be presented"** = "Seuraavat tiedot jaetaan"
- **"Presentation"** = "jakaminen" (in context of data sharing)
- Focus on **data sharing** rather than formal "presentation"

### **Avoid**
- Direct word-for-word translations
- Overly formal language
- Unnecessary "ole hyvä" (please) - use only when truly needed
- Long compound words when shorter alternatives exist
- English word order in Finnish sentences
- Redundant words like "onnistuneesti" when context is clear

### **Quality Check**
- Would a Finnish user naturally say this?
- Is the meaning clear without the English context?
- Does it match the app's friendly, accessible tone?
- Are technical terms consistent with established usage?
- Is the word order natural for Finnish?

### **Recent Updates Summary**
Key changes based on human review:
- "valtuutus" → "todiste" for credentials
- "tarkastaja" → "vastaanottaja" for verifier
- "osapuoli" → "toimija" for party/entity
- More natural word order and concise expressions
- "Internet" with capital I and hyphenated compounds