## Portuguese Translation Rules for Identity Wallet App

### **Tone & Style**
- Use informal "você/tu" address (not formal "o senhor/a senhora")
- Keep translations natural and conversational, not literal
- Maintain a friendly, approachable tone that matches the original English
- Be clear and direct - avoid unnecessary words
- Prefer Brazilian Portuguese conventions for broader accessibility

### **Key Terminology**
- **Wallet** → "carteira" (consistently used)
- **Card/Credential** → "cartão" for cards, "credencial" for credentials
- **PIN** → "PIN" (keep in English, masculine: o PIN, use "seu PIN")
- **App** → "aplicativo" (Brazilian) or "app" (informal, widely understood)
- **QR Code** → "código QR"
- **Biometrics** → "biometria" or "autenticação biométrica"
- **eID card** → "cartão eID"
- **Organization** → "organização"
- **Verifier** → "verificador"
- **Issuer** → "emissor"

### **Technical Terms**
- **Share/Sharing** → "compartilhar/compartilhamento"
- **Scan** → "escanear" or "digitalizar"
- **Authentication** → "autenticação"
- **Verification** → "verificação"
- **Attributes** → "atributos"
- **Request** → "solicitação" or "pedido"
- **Offline** → "off-line" (with hyphen in Portuguese)
- **Online** → "on-line" (with hyphen in Portuguese)

### **Common Phrases**
- "Go to" → "Ir para" or "Acessar"
- "Set up" → "configurar"
- "Please try again" → "Por favor, tente novamente"
- "Something went wrong" → "Algo deu errado"
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

### **Context Awareness**
- **Button labels**: Keep short and action-oriented
- **Success messages**: Use encouraging tone ("Sucesso!", "Pronto!", "Feito!")
- **Error messages**: Be helpful and actionable, not alarming
- **Security messages**: Inspire confidence while being clear about actions
- **Confirmations**: Use "Tem certeza que..." or "Deseja realmente..."

### **Special Considerations**
- For time expressions, use Portuguese formats ("hoje às", "ontem às")
- For technical features, explain benefits in user-friendly terms
- When referring to external parties, maintain appropriate level of caution/trust language
- Keep beta/experimental feature warnings clear but not alarming
- Use gender-neutral language when the subject is unknown

### **Specific Patterns**
- **"wants to offer"** → "quer oferecer" or simply "oferece" (present tense)
- **"wants to request"** → "quer solicitar" or simply "solicita"
- **"from X"** → "de {name}" or "por {name}"
- **"About this party"** → "Sobre esta organização" or "Sobre este emissor"
- **"Successfully..."** → Often expressed with "com sucesso" or past participle

### **What NOT to do**
- Don't use overly formal language
- Don't translate brand names or widely-adopted English tech terms
- Don't create literal translations that sound unnatural
- Don't change the meaning or intent of the original message
- Don't add or remove information not present in the source
- Don't mix European and Brazilian Portuguese conventions inconsistently

### **Quality Checks**
- Read translations aloud - they should sound natural in conversation
- Ensure security actions are unambiguous
- Verify button labels are action-oriented and clear
- Check that error messages are helpful, not just descriptive
- Confirm consistent terminology throughout all translations
- Ensure gender agreement is correct throughout
