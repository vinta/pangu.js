# Chrome Extension i18n Keys

This file lists all i18n keys used in the Chrome Extension. Contributors can use these keys to add translations for other languages.

## How to contribute translations

1. Create a new directory under `_locales/` with your locale code (e.g., `en`, `ja`, `ko`)
2. Create a `messages.json` file in that directory
3. Add translations for each key listed below
4. Submit a pull request

## Available i18n keys

### Basic Extension Info
- `extension_name` - Extension name
- `extension_description` - Extension description

### Popup Page
- `god_of_spacing` - Main title "空格之神"
- `spacing_when_load` - "網頁載入後自動幫我加上空格"
- `spacing_when_click` - "我要自己決定什麼時候要加空格"
- `call_god_of_spacing` - "召喚空格之神"
- `extension_rate` - "評分"
- `extension_options` - "選項"
- `can_not_call_god_of_spacing` - Error message when spacing cannot be applied

### Options Page
- `subtitle` - Subtitle description
- `quote` - The humorous quote about spacing
- `label_spacing_mode` - "什麼時候作用？"
- `label_spacing_rule` - "然後，你是否希望："
- `blacklists` - "除了這些網址，其他網頁都自動加上空格"
- `whitelists` - "只在這些網址加上空格"
- `spacing_when_click_msg` - Message shown in manual mode
- `label_is_mute` - "在這個頁面靜音"

## Example messages.json structure

```json
{
    "extension_name": {
        "message": "Your translation here",
        "description": "Extension name"
    }
}
```