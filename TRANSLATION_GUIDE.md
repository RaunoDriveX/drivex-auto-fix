# Translation Guide for DriveX

This guide explains how to translate the DriveX application into different languages.

## Overview

DriveX uses **i18next** for internationalization (i18n). Translation files are stored in JSON format and organized by language and namespace.

## File Structure

```
src/
  locales/
    en/                 # English (default language)
      common.json       # Common UI elements (buttons, status, messages)
      auth.json         # Authentication pages
      dashboard.json    # Dashboard pages
      forms.json        # Form labels, validation, placeholders
    de/                 # German (or your target language)
      common.json       # Same structure as English files
      auth.json
      dashboard.json
      forms.json
```

## Translation Files

Each language has **4 translation files** (namespaces):

1. **common.json** - Common UI elements, buttons, navigation, status messages
2. **auth.json** - Authentication pages (Shop Login, Insurer Login)
3. **dashboard.json** - Dashboard content (Shop Dashboard, Insurer Dashboard)
4. **forms.json** - Form labels, validation messages, placeholders

## How to Translate

### Step 1: Locate Translation Files

Translation files for the target language are in: `src/locales/[language-code]/`

Currently available:
- `src/locales/en/` - English (reference/source)
- `src/locales/de/` - German (to be translated)

### Step 2: Open a Translation File

Example: `src/locales/de/common.json`

You will see entries marked with `[TO TRANSLATE]`:

```json
{
  "buttons": {
    "sign_in": "[TO TRANSLATE] Sign In",
    "sign_up": "[TO TRANSLATE] Sign Up",
    "sign_out": "[TO TRANSLATE] Sign Out"
  }
}
```

### Step 3: Replace with Translated Text

Remove the `[TO TRANSLATE]` prefix and replace with the translated text:

```json
{
  "buttons": {
    "sign_in": "Anmelden",
    "sign_up": "Registrieren",
    "sign_out": "Abmelden"
  }
}
```

### Step 4: Important Translation Rules

#### 1. **Preserve JSON Structure**
- Keep all the keys (e.g., `"sign_in"`, `"sign_up"`) exactly the same
- Only translate the values (the text after the colon)
- Maintain the nested structure

#### 2. **Preserve Special Syntax**

**Variables (interpolation)**:
```json
"min_length": "[TO TRANSLATE] Minimum length is {{count}} characters"
```
Keep `{{count}}` unchanged:
```json
"min_length": "Mindestlänge ist {{count}} Zeichen"
```

**HTML tags** (if any):
```json
"message": "[TO TRANSLATE] Click <strong>here</strong> to continue"
```
Keep tags unchanged:
```json
"message": "Klicken Sie <strong>hier</strong> um fortzufahren"
```

#### 3. **Brand Names**
Keep brand names unchanged:
- "DriveX" → "DriveX" (don't translate)

#### 4. **Technical Terms**
Some technical terms may not need translation:
- "Email" → Often kept as "Email" in many languages
- Consider local conventions

### Step 5: Testing Your Translations

After translating:
1. Save the JSON file
2. Check that the JSON is valid (use a JSON validator if needed)
3. Ensure no syntax errors (missing commas, quotes, brackets)

## Translation Checklist

For each language, translate all 4 files:

- [ ] `common.json` - Common UI elements
- [ ] `auth.json` - Authentication pages
- [ ] `dashboard.json` - Dashboard content
- [ ] `forms.json` - Forms and validation

## JSON Validation

**Common JSON errors to avoid:**
- Missing commas between entries
- Unmatched quotes or brackets
- Extra commas at the end of lists

**Tip**: Use an online JSON validator (like jsonlint.com) to check your file before submitting.

## Example: Complete Translation

**Before (English in de/common.json):**
```json
{
  "buttons": {
    "sign_in": "[TO TRANSLATE] Sign In",
    "cancel": "[TO TRANSLATE] Cancel",
    "save": "[TO TRANSLATE] Save"
  },
  "status": {
    "loading": "[TO TRANSLATE] Loading...",
    "success": "[TO TRANSLATE] Success"
  }
}
```

**After (German translation):**
```json
{
  "buttons": {
    "sign_in": "Anmelden",
    "cancel": "Abbrechen",
    "save": "Speichern"
  },
  "status": {
    "loading": "Laden...",
    "success": "Erfolg"
  }
}
```

## Adding a New Language

To add a new language (e.g., French):

1. Create a new folder: `src/locales/fr/`
2. Copy all 4 JSON files from `src/locales/en/` to `src/locales/fr/`
3. Translate all values in the 4 files
4. Update `src/i18n/config.ts` to include the new language:

```typescript
// Import French translations
import frCommon from '@/locales/fr/common.json';
import frAuth from '@/locales/fr/auth.json';
import frDashboard from '@/locales/fr/dashboard.json';
import frForms from '@/locales/fr/forms.json';

const resources = {
  en: { ... },
  de: { ... },
  fr: {  // Add French
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    forms: frForms,
  }
};
```

## Questions?

If you encounter any issues or have questions about translations:
- Check the English reference files in `src/locales/en/`
- Validate your JSON syntax
- Contact the development team for technical support

## Summary

1. ✅ Keep all JSON keys unchanged
2. ✅ Translate only the text values
3. ✅ Preserve `{{variables}}` and HTML tags
4. ✅ Validate JSON syntax before submitting
5. ✅ Keep brand names (DriveX) unchanged
6. ✅ Translate all 4 files per language

Happy translating! 🌍
