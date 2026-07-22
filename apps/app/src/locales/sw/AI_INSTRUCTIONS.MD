## Swedish Translation Rules for Identity App

### **Tone and Style**
- Use informal, friendly tone (du-form, not ni-form)
- Keep translations conversational and approachable
- Maintain clarity and brevity - avoid overly complex phrasing
- Use natural Swedish expressions rather than literal translations

### **Critical Terminology: Contextual "Credential" Translation**

**IMPORTANT:** The word "credential" has different translations depending on context:

1. **Use "kort" (card)** in these contexts:
   - User-facing interfaces (buttons, titles, headers)
   - When users receive credentials (notifications, success messages)
   - Direct user interactions and actions
   - Examples:
     - "You have received a credential" → "Du har tagit emot ett kort"
     - "common.credential: Credential" → "Kort"
     - "Credential has been added to your wallet" → "Kortet har lagts till i din plånbok"

2. **Use "intyg" (certificate/credential)** in these contexts:
   - Technical/system error messages
   - Fallback labels when credential has no display name
   - Storage and retrieval operations
   - Metadata and technical descriptions
   - Empty state descriptions explaining credential functionality
   - Examples:
     - "Credential information could not be extracted" → "Intygsinformation kunde inte extraheras"
     - "Error while retrieving credentials" → "Fel vid hämtning av intyg"
     - "Deleted credential" → "Borttaget intyg"
     - "Credentials will appear here once you receive them" → "Intyg kommer att visas här när du tar emot dem"
     - Fallback label: "Credential" → "Intyg"

3. **Use "Intygserbjudande"** (not "Korterbjudande") for:
   - "Credential offer" → "Intygserbjudande"
   - "Credential offer from {name}" → "Intygsbjudande från {name}"

### **Technical Terminology**
- **"Card"** → **"kort"** (consistently for digital credentials)
- **"Wallet"** → **"plånbok"**
- **"PIN"** → **"PIN-kod"** (always include "-kod")
- **"Share/sharing"** → **"dela/delning"**
- **"Scan"** → **"skanna"**
- **"Biometrics"** → **"biometri"** (use noun form, not "biometrisk autentisering")
- **"Fingerprint"** → **"fingeravtryck"**
- **"Verifier"** → **"verifierare"**
- **"Organization"** → **"organisation"**
- **"Issuer"** → **"utfärdare"**
- **"Document"** → **"dokument"**
- **"Attribute"** → **"uppgift"** (plural: "uppgifter")
- **"Metadata"** → **"metadata"**
- **"Information"** → **"information"** or **"uppgifter"** (context-dependent)
- **"Data"** → **"data"** or **"uppgifter"** (context-dependent)

### **User Interface Elements**
- **Buttons**: Use imperative form (e.g., "Fortsätt", "Avbryt", "Acceptera", "Avvisa")
- **Success messages**:
  - Generally use **"Färdigt!"** for "Success!"
  - In receive credential flow specifically, use **"Klart!"**
- **Error messages**: Start with descriptive phrases, avoid harsh language
- **Menu items**: Use noun form (e.g., "Inställningar", "Aktivitet")
- **Empty states**: Use friendly, encouraging language (e.g., "Inget här ännu" for "There's nothing here, yet")

### **Action Verbs**
- **"Accept"** → **"Acceptera"**
- **"Decline"** → **"Avvisa"** (not "Avböj")
- **"Continue"** → **"Fortsätt"**
- **"Cancel"** → **"Avbryt"**
- **"Review"** → **"Granska"**
- **"Receive"** → **"ta emot"** (infinitive), "tar emot" (present), "tagit emot" (past participle)
- **"Add/Added"** → **"Lägg till"** (infinitive), "Läggs till" (passive), "Lade till" (past), "Tillagt" (adjective)
- **"Sign/Signing"** → **"Signera/Signering"**

### **Placeholder Handling**
- Keep all placeholders exactly as they are: `{0}`, `{name}`, `{userName}`, etc.
- Ensure Swedish grammar flows naturally around placeholders
- Adjust word order when needed for natural Swedish syntax

### **Context-Specific Guidelines**
- **Time expressions**: Use Swedish conventions ("idag", "igår", "om X dagar")
- **Security contexts**: Emphasize safety without being alarming
  - "secure" → "säker"
  - "secured" → "säkrad" / "säkrade"
- **Onboarding**: Use encouraging, helpful language
  - "Set up" → "Ställ in"
  - "Before you can use..." → "Innan du kan använda..."
- **Error states**: Be informative but not technical
  - "Something went wrong" → "Något gick fel"
  - Use natural Swedish error phrasing

### **What NOT to Translate**
- Technical identifiers (URLs, codes, file extensions)
- Proper nouns (company names like "Paradym Wallet", product names)
- Placeholder syntax
- HTML/XML tags
- Demo labels: "(Demo)" remains "(Demo)"

### **Special Cases**
- Leave empty translations (`""`) for fields that are primarily technical metadata
- For compound messages with multiple sentences, ensure each part flows naturally
- When gender-neutral language is needed, use standard Swedish conventions
- Notification messages about credentials use "kort" when describing receipt
- Technical system messages about credentials use "intyg"

### **Quality Checks**
- Read translations aloud to ensure they sound natural
- Verify that interactive elements (buttons, links) use appropriate action words
- Ensure consistent terminology throughout the app
- Check that formal/informal tone matches the original intent
- Verify contextual usage of "kort" vs "intyg" for "credential"
- Confirm "PIN" always appears as "PIN-kod"
- Ensure success messages use the appropriate variant ("Färdigt!" or "Klart!")
