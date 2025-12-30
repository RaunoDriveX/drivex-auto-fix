# i18n Developer Guide - DriveX

This guide explains how to use the i18n (internationalization) system in the DriveX application.

## Overview

DriveX uses **i18next** and **react-i18next** for multi-language support. The system is configured to automatically detect the user's browser language and fall back to English if the detected language is not available.

## Quick Start

### Basic Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common'); // Specify namespace

  return (
    <div>
      <h1>{t('app_name')}</h1>
      <button>{t('buttons.sign_in')}</button>
      <p>{t('messages.loading_dashboard')}</p>
    </div>
  );
}
```

### Using Multiple Namespaces

```typescript
import { useTranslation } from 'react-i18next';

function AuthPage() {
  const { t } = useTranslation(['auth', 'common']); // Multiple namespaces

  return (
    <div>
      <h1>{t('auth:shop.title')}</h1>
      <button>{t('common:buttons.sign_in')}</button>
    </div>
  );
}
```

## Available Namespaces

The application has 4 translation namespaces:

1. **common** - Common UI elements (buttons, status, navigation)
2. **auth** - Authentication pages (shop/insurer login)
3. **dashboard** - Dashboard content (shop/insurer dashboards)
4. **forms** - Form labels, validation, placeholders

## Translation Key Naming Convention

Translation keys follow this pattern:
```
namespace:category.subcategory.key
```

Examples:
- `common:buttons.sign_in` → "Sign In"
- `auth:shop.title` → "Shop Portal"
- `dashboard:insurer.tabs.jobs` → "Live Jobs"
- `forms:labels.email` → "Email"

## Common Use Cases

### 1. Simple Text Translation

```typescript
const { t } = useTranslation('common');

// Simple key
<h1>{t('app_name')}</h1>

// Nested key
<button>{t('buttons.sign_in')}</button>
```

### 2. Translation with Variables (Interpolation)

```typescript
const { t } = useTranslation('forms');

<p>{t('validation.min_length', { count: 8 })}</p>
// Output: "Minimum length is 8 characters"
```

### 3. Translation in Form Labels

```typescript
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div>
      <Label>{t('auth:fields.email')}</Label>
      <Input placeholder={t('auth:fields.email_placeholder')} />

      <Label>{t('auth:fields.password')}</Label>
      <Input type="password" placeholder={t('auth:fields.password_placeholder')} />

      <Button>{t('common:buttons.sign_in')}</Button>
    </div>
  );
}
```

### 4. Translation in Buttons and Actions

```typescript
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

function ActionButtons() {
  const { t } = useTranslation('common');

  return (
    <>
      <Button>{t('buttons.save')}</Button>
      <Button variant="outline">{t('buttons.cancel')}</Button>
      <Button variant="destructive">{t('buttons.delete')}</Button>
    </>
  );
}
```

### 5. Translation in Toast Messages

```typescript
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { toast } = useToast();
  const { t } = useTranslation('auth');

  const handleSuccess = () => {
    toast({
      title: t('messages.welcome_back'),
      description: t('messages.sign_in_success'),
    });
  };
}
```

### 6. Conditional Translation Keys

```typescript
const { t } = useTranslation('dashboard');

const statusKey = isActive ? 'status.active' : 'status.inactive';
<Badge>{t(statusKey)}</Badge>
```

## Language Switching

### Add Language Switcher Component

```typescript
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={i18n.language === 'en' ? 'default' : 'outline'}
        onClick={() => changeLanguage('en')}
      >
        English
      </Button>
      <Button
        variant={i18n.language === 'de' ? 'default' : 'outline'}
        onClick={() => changeLanguage('de')}
      >
        Deutsch
      </Button>
    </div>
  );
}
```

### Get Current Language

```typescript
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'en', 'de', etc.
```

## Adding New Translation Keys

When you need to add new translatable text:

### Step 1: Choose the Appropriate Namespace

- UI elements, buttons → `common.json`
- Auth pages → `auth.json`
- Dashboard content → `dashboard.json`
- Form fields → `forms.json`

### Step 2: Add to English File First

Edit `src/locales/en/[namespace].json`:

```json
{
  "new_section": {
    "new_key": "New English text"
  }
}
```

### Step 3: Add to Other Languages

Edit `src/locales/de/[namespace].json`:

```json
{
  "new_section": {
    "new_key": "[TO TRANSLATE] New English text"
  }
}
```

### Step 4: Use in Component

```typescript
const { t } = useTranslation('common');
<p>{t('new_section.new_key')}</p>
```

## Best Practices

### 1. ✅ Always Use Translation Keys for User-Facing Text

**Bad:**
```typescript
<button>Sign In</button>
```

**Good:**
```typescript
<button>{t('buttons.sign_in')}</button>
```

### 2. ✅ Use Descriptive Key Names

**Bad:**
```json
{ "btn1": "Submit" }
```

**Good:**
```json
{ "buttons": { "submit": "Submit" } }
```

### 3. ✅ Group Related Keys

```json
{
  "buttons": {
    "sign_in": "Sign In",
    "sign_out": "Sign Out"
  },
  "messages": {
    "success": "Success",
    "error": "Error"
  }
}
```

### 4. ✅ Don't Translate Technical Terms

Keep as-is:
- Brand names: "DriveX"
- Technical terms where appropriate: "Email"
- URLs, API endpoints

### 5. ✅ Use Variables for Dynamic Content

**Bad:**
```typescript
{t('min_length_8')} // "Minimum length is 8 characters"
{t('min_length_10')} // "Minimum length is 10 characters"
```

**Good:**
```typescript
{t('min_length', { count: 8 })}
{t('min_length', { count: 10 })}
```

## Configuration Files

### i18n Config (`src/i18n/config.ts`)

Main configuration file that:
- Initializes i18next
- Imports all translation files
- Configures language detection
- Sets fallback language

### Translation Files (`src/locales/[lang]/[namespace].json`)

JSON files containing translations organized by:
- **Language code**: `en`, `de`, etc.
- **Namespace**: `common`, `auth`, `dashboard`, `forms`

## Troubleshooting

### Translation Key Not Found

If you see the translation key instead of the text:
1. Check the key exists in the JSON file
2. Verify the namespace is correct
3. Check JSON syntax (valid JSON)
4. Restart dev server after adding new files

### Language Not Switching

1. Check `i18n.changeLanguage()` is called
2. Verify language code matches folder name (`en`, `de`)
3. Check browser console for errors

### Missing Translations in New Language

1. Ensure all 4 JSON files exist for the language
2. Verify imports in `src/i18n/config.ts`
3. Check JSON syntax is valid

## Testing Translations

### Test Language Switching

```typescript
// In browser console or component
import i18n from '@/i18n/config';

// Switch to German
i18n.changeLanguage('de');

// Switch to English
i18n.changeLanguage('en');
```

### Force Specific Language (for testing)

In `src/i18n/config.ts`, temporarily change:
```typescript
.init({
  // ... other config
  lng: 'de', // Force German
  // fallbackLng: 'en',
});
```

## Example: Converting Existing Component

**Before (hardcoded English):**
```typescript
function ShopAuth() {
  return (
    <div>
      <h1>Shop Portal</h1>
      <p>Sign in to manage your repair jobs</p>
      <Label>Email Address</Label>
      <Input placeholder="shop@autorepair.com" />
      <Button>Sign In</Button>
    </div>
  );
}
```

**After (with i18n):**
```typescript
import { useTranslation } from 'react-i18next';

function ShopAuth() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div>
      <h1>{t('auth:shop.title')}</h1>
      <p>{t('auth:shop.subtitle')}</p>
      <Label>{t('auth:fields.email')}</Label>
      <Input placeholder={t('auth:fields.shop_email_placeholder')} />
      <Button>{t('common:buttons.sign_in')}</Button>
    </div>
  );
}
```

## Summary

1. ✅ Import `useTranslation` hook
2. ✅ Specify namespace(s)
3. ✅ Use `t('key.path')` for translations
4. ✅ Add new keys to English first
5. ✅ Mark other languages with `[TO TRANSLATE]`
6. ✅ Use variables for dynamic content
7. ✅ Group related keys logically

For more information, see:
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- Translation Guide: `TRANSLATION_GUIDE.md`
