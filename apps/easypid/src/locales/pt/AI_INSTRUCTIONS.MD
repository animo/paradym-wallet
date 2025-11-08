## Portuguese Translation Rules for Identity Wallet App

### **Tone & Style**
- Use third person singular (formal but not overly formal) - omit the subject pronoun
- This means using verb forms like "pode", "tem", "quer" (same as "você" form but WITHOUT the pronoun)
- NEVER use "você" explicitly - just use the third person verb forms
- Keep translations natural and conversational, not literal
- Maintain a friendly, professional tone that matches the original English
- Be clear and direct - avoid unnecessary words
- Use European Portuguese conventions (Portugal)

### **Key Terminology**
- **Wallet** → "carteira" (consistently used)
- **Card/Credential** → "cartão" for cards, "credencial" for credentials
- **PIN** → "PIN" (keep in English, masculine: o PIN, use "o seu PIN")
- **App** → "aplicação" (European Portuguese - NEVER "aplicativo" which is Brazilian)
- **Phone** → "telemóvel" (European Portuguese - NEVER "telefone" for mobile devices)
- **QR Code** → "código QR"
- **Biometrics** → "biometria" or "autenticação biométrica"
- **eID card** → "cartão eID"
- **Organization** → "organização"
- **Verifier** → "verificador"
- **Issuer** → "emissor"
- **Connection** → "ligação" (European Portuguese - NEVER "conexão" which is Brazilian)

### **Technical Terms**
- **Share/Sharing** → "partilhar/partilha" (European Portuguese - NEVER "compartilhar/compartilhamento" which is Brazilian)
  - "to share" → "partilhar"
  - "sharing" (noun) → "partilha"
  - "shareable" → "partilhável"
  - "shared" → "partilhado/partilhada"
- **Scan** → "ler" (European Portuguese - NEVER "escanear" which is Brazilian)
  - For QR codes: "ler um código QR" not "escanear"
  - For eID cards: "ler o cartão" not "escanear o cartão"
  - "Reading" → "Leitura" (not "Escaneamento")
- **Fetch/Retrieve** → "obter" or "recuperar" (NEVER "buscar" which is Brazilian)
- **Delete** → "eliminar" (European Portuguese - NEVER "excluir" which is Brazilian)
- **Note/Observe** → "Note" (NEVER "Observe" in imperative form)
- **Authentication** → "autenticação"
- **Verification** → "verificação"
- **Attributes** → "atributos"
- **Request** → "pedido" (preferred) or "solicitação" (use "pedido" for consistency)
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
- **Pronoun omission**: ALWAYS omit subject pronouns - third person singular never uses explicit pronouns
  - GOOD: "pode armazenar" (can store)
  - WRONG: "você pode armazenar" (never use "você")
  - GOOD: "assim que receber" (once [you] receive)
  - Subject is understood from context and verb form
- **Verb conjugation**: Always use third person singular forms (same as "você" but WITHOUT the pronoun)
  - Present: "pode", "tem", "quer", "deseja", "precisa", "usa", "faz", "está", "é", "vê", "sabe"
  - Subjunctive: "possa", "tenha", "queira", "deseje", "precise", "use", "faça", "seja", "veja"
  - Imperative: "peça", "tente", "verifique", "adicione", "ative", "digite", "reveja", "leia"
  - Personal infinitive: Use impersonal forms ("receber", "partilhar", "ter", "fazer") not ("receberes", "partilhares")
- **Determinants**: ALWAYS use definite articles (o/a/os/as) before nouns, especially possessives
  - GOOD: "a sua carteira", "os seus dados", "as suas informações"
  - WRONG: "sua carteira", "seus dados" (sounds Brazilian without article)

### **Context Awareness**
- **Button labels**: Keep short and action-oriented
- **Success messages**: Use encouraging tone ("Sucesso!", "Pronto!", "Feito!")
- **Error messages**: Be helpful and actionable, not alarming
- **Security messages**: Inspire confidence while being clear about actions
- **Confirmations**: Use "Tem a certeza que..." or "Deseja realmente..." (third person, not "Tens/Desejas")

### **Special Considerations**
- For time expressions, use Portuguese formats ("hoje às", "ontem às")
- For technical features, explain benefits in user-friendly terms
- When referring to external parties, maintain appropriate level of caution/trust language
- Keep beta/experimental feature warnings clear but not alarming
- Use gender-neutral language when the subject is unknown

### **Specific Patterns**
- **"wants to offer"** → "quer oferecer" or "deseja oferecer" (no "-te", just omit the pronoun)
- **"wants to request"** → "deseja solicitar" or "quer solicitar"
- **"from X"** → "de {name}" or "por {name}"
- **"from you"** → Often can be omitted entirely, or use "suas" (e.g., "informações suas" = your information)
- **"to you"** / **"for you"** → Usually omit, or context makes it clear without pronoun
- **"About this party"** → "Sobre esta organização" or "Sobre este emissor"
- **"Successfully..."** → Often expressed with "com sucesso" or "bem sucedida/sucedido" (no hyphen in this context)
- **"your" (possessive)** → "o seu/a sua/os seus/as suas" with article (third person possessive)
  - GOOD: "a sua carteira", "os seus dados", "as suas informações"
  - WRONG: "sua carteira" (missing article - sounds Brazilian)
  - WRONG: "a tua carteira" (informal second person - not third person)
- **"your information/data" at sentence start** → "As suas informações" or "Os seus dados" (ALWAYS include article)

### **What NOT to do**
- Don't use "você" explicitly - always omit the pronoun
- Don't use Brazilian Portuguese forms:
  - NEVER: você (explicit), compartilhar, aplicativo, telefone (for mobile), conexão, buscar, escanear, excluir
  - ALWAYS use European equivalents: (omit pronoun), partilhar, aplicação, telemóvel, ligação, obter, ler, eliminar
- Don't use informal "tu" forms - use third person singular instead:
  - WRONG: "podes", "tens", "tua carteira", "Pede"
  - RIGHT: "pode", "tem", "a sua carteira", "Peça"
- Don't mix verb tenses or formality levels inconsistently
- Don't omit definite articles before possessives (sounds Brazilian)
  - WRONG: "seus dados", "sua carteira"
  - RIGHT: "os seus dados", "a sua carteira"
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
