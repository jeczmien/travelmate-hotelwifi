# Hotel Wi-Fi

Hotel Wi-Fi is a small, mobile-first web interface for managing OpenWrt
Travelmate uplinks without opening the full LuCI administration interface.
It is served directly by uhttpd at `/hotelwifi/`.

## Features

- Scan 5 GHz and 2.4 GHz Wi-Fi networks through Travelmate.
- Add WPA/WPA2/WPA3 Personal, Open and OWE uplinks.
- Enable and disable remembered uplinks.
- Change saved Wi-Fi passwords.
- Remove remembered uplinks.
- Change uplink priority with up/down controls.
- Show current Wi-Fi, VPN and Internet status.
- Use a dedicated restricted rpcd login instead of exposing full LuCI access.
- Mobile-first interface with light/dark mode.
- Browser-language detection with English fallback plus the current LuCI language catalogue.
- RTL layout support for Arabic, Persian and Hebrew.

## Tested environment

The 0.1.0 release was tested on:

- OpenWrt 25.12.5
- Travelmate 2.4.8-r1
- rpcd with ucode support
- uhttpd with the ubus module
- Travelmate-managed WireGuard (`wg0`) as the tested VPN setup

## Current assumptions

This first release intentionally preserves the behaviour of the tested router.
It currently assumes:

- two wireless devices named `radio0` and `radio1`;
- `radio0` is displayed as 2.4 GHz and `radio1` as 5 GHz;
- the Travelmate uplink interface is normally `trm_wwan` (write operations use
  `travelmate.global.trm_iface` where available).

These are documented limitations, not installation-time changes to the user's
network configuration.

## Runtime dependencies

The OpenWrt package declares dependencies on:

- `travelmate`
- `rpcd`
- `rpcd-mod-ucode`
- `ucode`
- `ucode-mod-fs`
- `ucode-mod-ubus`
- `ucode-mod-uci`
- `uhttpd`
- `uhttpd-mod-ubus`

`uhttpd-mod-ubus` enables the `/ubus` HTTP JSON-RPC endpoint used by the
frontend.

## Security model

During installation the package creates an rpcd login named `hotelwifi`. The
login references the existing OpenWrt root password with `$p$root`, but its ACL
permits access only to the dedicated `hotelwifi` ubus object. The frontend never
receives general UCI, shell or LuCI privileges.

The password entered in the login form is used only for `session.login`. The
session token is kept in JavaScript memory and is not stored in localStorage.
The selected UI language is stored in localStorage.

## Installation

For a locally built package on OpenWrt 25.12:

```sh
apk --allow-untrusted add /tmp/travelmate-hotelwifi-0.1.0-r1.apk
```

Then open:

```text
http://ROUTER-IP/hotelwifi/
```

Use the router root password to log in to the restricted Hotel Wi-Fi session.

## Building

Place this directory in an OpenWrt source tree or SDK as:

```text
package/travelmate-hotelwifi
```

Then install the package definitions for the declared dependencies, run
`make defconfig`, and build:

```sh
make package/travelmate-hotelwifi/clean V=s
make package/travelmate-hotelwifi/compile V=s
```

For Cudy TR3000 v1 on OpenWrt 25.12.5 the tested Docker SDK image is:

```text
openwrt/sdk:mediatek-filogic-25.12.5
```

The package is architecture-independent (`PKGARCH:=all`).

## Languages

The initial language follows browser preferences and falls back to English. The selector follows the current LuCI language
catalogue and uses the same language codes/aliases where applicable. Missing
strings in a translation automatically fall back to English.

- `en` — English
- `ar` — العربية
- `bg` — български
- `bn_BD` — বাংলা
- `ca` — Català
- `cs` — Čeština
- `da` — Dansk
- `de` — Deutsch
- `el` — Ελληνικά
- `es` — Español
- `fa` — فارسی
- `fi` — Suomi
- `fil` — Filipino
- `fr` — Français
- `ga` — Gaeilge
- `he` — עִבְרִית
- `hi` — हिंदी
- `hu` — Magyar
- `it` — Italiano
- `ja` — 日本語
- `ka` — ქართული ენა
- `ko` — 한국어
- `lo` — ພາສາລາວ
- `lt` — Lietuvių
- `lv` — Latviešu
- `mr` — मराठी
- `ms` — Bahasa Melayu
- `nb_NO` — Norsk
- `nl` — Nederlands
- `pl` — Polski
- `pt` — Português
- `pt_BR` — Português do Brasil
- `ro` — Română
- `ru` — Русский
- `sk` — Slovenčina
- `sv` — Svenska
- `ta` — தமிழ்
- `tr` — Türkçe
- `uk` — Українська
- `vi` — Tiếng Việt
- `yua` — Maaya t'aan
- `zh_Hans` — 简体中文
- `zh_Hant` — 正體中文

Run the translation validator with:

```sh
python3 scripts/validate-i18n.py
```

Most catalogues are complete for the 0.1.0 UI. Lao and Yucatec Maya contain
initial partial translations and intentionally fall back to English for the
remaining strings until community review is available.

## Package layout

```text
htdocs/hotelwifi/                  frontend
root/usr/share/rpcd/ucode/hotelwifi   rpcd backend
root/usr/share/rpcd/acl.d/hotelwifi.json  restricted ACL
root/usr/libexec/hotelwifi-scan        Travelmate scan helper
root/etc/uci-defaults/90-hotelwifi     rpcd login setup
```

## Uninstall

```sh
apk del travelmate-hotelwifi
```

The package removal script also removes the dedicated `rpcd.hotelwifi` login.
Travelmate uplinks, wireless settings, VPN settings, firewall configuration and
other router configuration are not removed.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.

