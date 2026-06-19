## French Translation Rules for Identity Wallet App

### **Tone & Style**
- Use polite, user-facing French with `vous`
- Keep translations natural and conversational, not literal
- Maintain a clear, reassuring tone that matches the original English
- Keep UI labels short and direct

### **Key Terminology**
- **Wallet** → `portefeuille` for the generic feature, but keep product names like `Paradym Wallet` unchanged
- **Card** → `carte`
- **Credential** → default to `carte` in wallet UI, receiving/sharing flows, empty states, and activity text; reserve `justificatif` for formal or metadata-style labels like credential type
- **PIN** → always `code PIN` in user-facing French
- **App** → `application`
- **Phone** → `téléphone`
- **QR Code** → `code QR`
- **Biometrics** → `biométrie` or `données biométriques`
- **eID card** → `carte eID`
- **Organization** → `organisation`
- **Verifier** → `vérificateur`
- **Issuer** → `émetteur`

### **Technical Terms**
- **Share/Sharing** → `partager/partage`
- **Scan** → `scanner`
- **Authentication** → `authentification`
- **Verification** → `vérification`
- **Attributes** → `attributs`
- **Request** → `demande`
- **Offline** → `hors ligne`
- **Online** → `en ligne`

### **Common Phrases**
- `Go to` → `Aller à` or `Ouvrir`
- `Set up` → `configurer`
- `Please try again` → `Veuillez réessayer`
- `Something went wrong` → `Un problème est survenu`
- `Continue` → `Continuer`
- `Cancel` → `Annuler`
- `Stop` → `Arrêter`
- `Back` → `Retour`

### **Placeholder Handling**
- Preserve all placeholders exactly as they appear: `{0}`, `{name}`, `{userName}`, etc.
- Preserve XML tags exactly as they appear: `<0>{name}</0>`, etc.
- Adapt French sentence structure around placeholders naturally

### **Grammar & Structure**
- Use natural French word order
- Prefer sentence case for UI copy
- Use imperative forms naturally for buttons and instructions
- Keep confirmation messages clear and unambiguous

### **Context Awareness**
- Button labels should be short and action-oriented
- Error messages should be helpful, not dramatic
- Security and privacy messages should feel trustworthy and clear
- Explanatory copy can be slightly longer, but still concise
- Prefer `Paramètres` for in-app settings, and `réglages` only for device-level settings prompts or buttons
- For trust and verification screens, prefer natural wording like `organisation reconnue` / `reconnaître` over literal calques of `approved`
- Avoid literal headings like `Ceci est votre portefeuille`; prefer natural UI headings such as `Votre portefeuille` or `Votre portefeuille numérique`
- In credential-offer and issuance flows, prefer the `délivrance` register over `offre` or `proposition` when the app is clearly talking about a card being issued

### **Special Considerations**
- Keep brand names, acronyms, and technical identifiers intact
- Use familiar French mobile-app phrasing instead of literal English calques
- For time expressions, use natural French forms like `Aujourd'hui à` and `Hier à`
- When a source string sounds awkward in direct translation, rewrite it naturally without changing meaning

### **What NOT to do**
- Don't switch between `tu` and `vous`
- Don't translate placeholders, XML tags, or product names
- Don't use stiff or overly formal administrative French
- Don't create literal translations that sound unnatural in a mobile app
- Don't add or remove meaning from the source text
