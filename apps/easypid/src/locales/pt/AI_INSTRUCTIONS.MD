## Portuguese Translation Rules for Identity Wallet App

### **Tone & Style**
- Use informal "tu" address with second person singular verb forms (not formal "o senhor/a senhora" or Brazilian "você")
- Keep translations natural and conversational, not literal
- Maintain a friendly, approachable tone that matches the original English
- Be clear and direct - avoid unnecessary words
- Use European Portuguese conventions (Portugal)

### **Key Terminology**
- **Wallet** → "carteira" (consistently used)
- **Card/Credential** → "cartão" for cards, "credencial" for credentials
- **PIN** → "PIN" (keep in English, masculine: o PIN, use "o teu PIN")
- **App** → "aplicação" (European Portuguese - NEVER "aplicativo" which is Brazilian)
- **QR Code** → "código QR"
- **Biometrics** → "biometria" or "autenticação biométrica"
- **eID card** → "cartão eID"
- **Organization** → "organização"
- **Verifier** → "verificador"
- **Issuer** → "emissor"

### **Technical Terms**
- **Share/Sharing** → "compartilhar/compartilhamento"
- **Scan** → "ler" (European Portuguese - NEVER "escanear" which is Brazilian)
  - For QR codes: "ler um código QR" not "escanear"
  - For eID cards: "ler o cartão" not "escanear o cartão"
- **Fetch/Retrieve** → "obter" or "recuperar" (NEVER "buscar" which is Brazilian)
- **Delete** → "eliminar" (European Portuguese - NEVER "excluir" which is Brazilian)
- **Note/Observe** → "Note" (NEVER "Observe" in imperative form)
- **Authentication** → "autenticação"
- **Verification** → "verificação"
- **Attributes** → "atributos"
- **Request** → "solicitação" or "pedido"
- **Offline** → "off-line" (with hyphen in Portuguese)
- **Online** → "on-line" (with hyphen in Portuguese)

### **Common Phrases**
- "Go to" → "Ir para" or "Aceder"
- "Set up" → "configurar"
- "Please try again" → "Por favor, tenta novamente"
- "Something went wrong" → "Algo correu mal"
- "Continue" → "Continuar"
- "Cancel" → "Cancelar"
- "Stop" → "Parar"
- "Accept" → "Aceitar"
- "Decline" → "Recusar"
- "Back" → "Voltar"

### **Placeholder Handling**
- Preserve all placeholders exactly as they appear: `{0}`, `{name}`, `{userName}`, etc.
- Adapt Portuguese sentence structure around placeholders naturally
- Use appropriate Portuguese articles (o/a/os/as) before placeholder content when needed
- Maintain XML tags intact: `<0>{name}</0>`, etc.

### **Grammar & Structure**
- Use natural Portuguese word order
- Prefer active voice when possible
- Use proper gender agreement for adjectives and articles
- For questions, use natural Portuguese question structure
- Capitalize only proper nouns and first words of sentences (Portuguese uses less capitalization than English)
- **Pronoun omission**: In Portuguese, subject pronouns (tu, eu, você) are often omitted when the verb conjugation makes the subject clear
  - GOOD: "podes armazenar" (you can store)
  - AVOID: "tu podes armazenar" (unnecessary pronoun)
  - GOOD: "assim que receberes" (once you receive)
  - AVOID: "assim que tu receberes" (unnecessary pronoun)
  - Use pronouns only for emphasis or clarity
- **Verb conjugation consistency**: Always use informal second person (tu) verb forms
  - GOOD: "Pede ao emissor" (informal imperative)
  - WRONG: "Peça ao emissor" (formal imperative mixed with informal)

### **Context Awareness**
- **Button labels**: Keep short and action-oriented
- **Success messages**: Use encouraging tone ("Sucesso!", "Pronto!", "Feito!")
- **Error messages**: Be helpful and actionable, not alarming
- **Security messages**: Inspire confidence while being clear about actions
- **Confirmations**: Use "Tens a certeza que..." or "Desejas realmente..."

### **Special Considerations**
- For time expressions, use Portuguese formats ("hoje às", "ontem às")
- For technical features, explain benefits in user-friendly terms
- When referring to external parties, maintain appropriate level of caution/trust language
- Keep beta/experimental feature warnings clear but not alarming
- Use gender-neutral language when the subject is unknown

### **Specific Patterns**
- **"wants to offer"** → "quer oferecer-te" or "oferece-te"
- **"wants to request"** → "quer solicitar" or simply "solicita"
- **"from X"** → "de {name}" or "por {name}"
- **"About this party"** → "Sobre esta organização" or "Sobre este emissor"
- **"Successfully..."** → Often expressed with "com sucesso" or past participle
- **"your" (possessive)** → "o teu/a tua/os teus/as tuas" (NEVER "seu/sua/seus/suas" which is Brazilian or formal)
  - GOOD: "a tua carteira", "os teus dados", "as tuas informações"
  - WRONG: "sua carteira", "seus dados", "suas informações"
- **"your information/data" at sentence start** → "As tuas informações" or "Os teus dados" (include article)
  - WRONG: "Suas informações" (Brazilian possessive)

### **What NOT to do**
- Don't use overly formal language
- Don't use Brazilian Portuguese forms:
  - NEVER: você, seu/sua/seus/suas, aplicativo, buscar, escanear, excluir
  - ALWAYS use European equivalents: tu, teu/tua/teus/tuas, aplicação, obter, ler, eliminar
- Don't mix formal and informal verb forms (e.g., "Peça" + "tenta")
  - Stay consistent with informal "tu" forms throughout
- Don't overuse subject pronouns - omit "tu" when the verb conjugation is clear
- Don't translate brand names or widely-adopted English tech terms
- Don't create literal translations that sound unnatural
- Don't change the meaning or intent of the original message
- Don't add or remove information not present in the source

### **Quality Checks**
- Read translations aloud - they should sound natural in conversation
- Ensure security actions are unambiguous
- Verify button labels are action-oriented and clear
- Check that error messages are helpful, not just descriptive
- Confirm consistent terminology throughout all translations
- Ensure gender agreement is correct throughout
