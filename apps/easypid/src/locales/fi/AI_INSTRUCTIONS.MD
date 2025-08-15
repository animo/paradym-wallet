## Finnish Translation Rules for Identity Wallet App

### **Tone & Style**
- Use **informal tone** (sinä-muoto, not te-muoto)
- Keep translations **natural and conversational**, not literal
- Maintain a **helpful, user-friendly** tone throughout
- Avoid bureaucratic or overly technical language

### **Key Terminology**
- **Wallet** = "lompakko" (consistently used)
- **Card** = "kortti" (for digital credentials)
- **Credential** = "valtuutus" (not "todistus")
- **Share** = "jaa" (for data sharing)
- **PIN code** = "PIN-koodi" (always hyphenated)
- **Biometrics** = "biometriikka"
- **Organization** = "organisaatio"
- **Verification/Verifier** = "tarkastus/tarkastaja"
- **Request** = "pyyntö"
- **Document** = "asiakirja"

### **Grammar & Structure**
- Use **active voice** when possible
- Keep **question format** for confirmations: "Oletko varma, että...?"
- Use **instructional imperatives**: "Skannaa", "Syötä", "Valitse"
- Prefer **shorter sentences** over complex structures

### **Technical Elements**
- **Preserve placeholders** exactly as they appear: `{userName}`, `{0}`, etc.
- **Keep XML tags** intact: `<0>{name}</0>`, ``, etc.
- **Maintain formatting** elements like newlines (`\n`)
- **Don't translate** technical terms like "QR-koodi", "PIN-koodi", "eID"

### **Context-Specific Rules**
- **Error messages**: Start with what went wrong, then suggest action
- **Success messages**: Keep brief and positive
- **Confirmations**: Always ask clearly with consequences explained
- **Instructions**: Use direct commands ("Tee X" not "Sinun tulisi tehdä X")
- **Time references**: Use natural Finnish time expressions

### **Common Patterns**
- **"Failed to..."** = "...epäonnistui" (not "epäonnistui tekemään")
- **"Successfully..."** = "...onnistuneesti" or "...onnistui"
- **"Unable to..."** = "...ei voitu" or "Ei voi..."
- **"You need to..."** = "Sinun tulee..." or "Tarvitset..."
- **"Please..."** = Often omitted or "Ole hyvä ja..." (use sparingly)

### **Avoid**
- Direct word-for-word translations
- Overly formal language
- Unnecessary "ole hyvä" (please) - use only when truly needed
- Long compound words when shorter alternatives exist
- English word order in Finnish sentences

### **Quality Check**
- Would a Finnish user naturally say this?
- Is the meaning clear without the English context?
- Does it match the app's friendly, accessible tone?
- Are technical terms consistent with established usage?