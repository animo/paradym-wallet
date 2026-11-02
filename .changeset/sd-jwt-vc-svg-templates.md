---
'@paradym/wallet-sdk': patch
---

Support the `svg_templates` rendering method of SD-JWT VC type metadata. When an OpenID4VCI credential is received, the template its card shows in the current locale is fetched once and checked. It must be https or a `data:` uri, at most 512 KiB, match its `uri#integrity`, declare no XML entities, and render with Skia. Then it is stored on the record with the locales it serves. `CredentialDisplay.svg` holds the template with the claim values filled in, XML escaped. It is left out when the spec says not to render the template, for example for a placeholder without claim metadata. The template is untrusted: draw it with a renderer that runs no scripts and loads no external resources, such as Skia, and never in a WebView.

`updateSdJwtVcSvgTemplates` fetches the template of every credential whose stored one isn't for the current locale. Call it after a language switch, not when a card is shown.

On Android the filled-in template is also the credential's icon in the OS credential picker. SVG icons are now scaled into the 20x20 icon. Before, one with its own width and height was cropped to its top-left corner, and one without failed to rasterize.
