## Swedish Translation Rules for Identity App

### **Tone and Style**
- Use informal, friendly tone (du-form, not ni-form)
- Keep translations conversational and approachable
- Maintain clarity and brevity - avoid overly complex phrasing
- Use natural Swedish expressions rather than literal translations

### **Technical Terminology**
- **"Card"** → **"kort"** (consistently for digital credentials)
- **"Wallet"** → **"plånbok"** 
- **"PIN"** → **"PIN-kod"** (always include "-kod")
- **"Credential"** → **"kort"** (same as card for user-facing text)
- **"Share/sharing"** → **"dela/delning"**
- **"Scan"** → **"skanna"**
- **"Biometrics"** → **"biometri"**
- **"Verifier"** → **"verifierare"**
- **"Organization"** → **"organisation"**

### **User Interface Elements**
- **Buttons**: Use imperative form (e.g., "Fortsätt", "Avbryt", "Acceptera")
- **Success messages**: Use "Klart!" for "Success!"
- **Error messages**: Start with descriptive phrases, avoid harsh language
- **Menu items**: Use noun form (e.g., "Inställningar", "Aktivitet")

### **Placeholder Handling**
- Keep all placeholders exactly as they are: `{0}`, `{name}`, `{userName}`, etc.
- Ensure Swedish grammar flows naturally around placeholders
- Adjust word order when needed for natural Swedish syntax

### **Context-Specific Guidelines**
- **Time expressions**: Use Swedish conventions ("idag", "igår", "om X dagar")
- **Security contexts**: Emphasize safety without being alarming
- **Onboarding**: Use encouraging, helpful language
- **Error states**: Be informative but not technical

### **What NOT to Translate**
- Technical identifiers (URLs, codes, file extensions)
- Proper nouns (company names, product names)
- Placeholder syntax
- HTML/XML tags

### **Special Cases**
- Leave empty translations (`""`) for fields that are primarily technical metadata
- For compound messages with multiple sentences, ensure each part flows naturally
- When gender-neutral language is needed, use standard Swedish conventions

### **Quality Checks**
- Read translations aloud to ensure they sound natural
- Verify that interactive elements (buttons, links) use appropriate action words
- Ensure consistent terminology throughout the app
- Check that formal/informal tone matches the original intent