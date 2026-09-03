'use strict';

(() => {
    const languages = {
        "en": { label: "English", dir: "ltr", aliases: [] },
        "ar": { label: "العربية", dir: "rtl", aliases: [] },
        "bg": { label: "български", dir: "ltr", aliases: [] },
        "bn_BD": { label: "বাংলা", dir: "ltr", aliases: ["bn"] },
        "ca": { label: "Català", dir: "ltr", aliases: [] },
        "cs": { label: "Čeština", dir: "ltr", aliases: [] },
        "da": { label: "Dansk", dir: "ltr", aliases: [] },
        "de": { label: "Deutsch", dir: "ltr", aliases: [] },
        "el": { label: "Ελληνικά", dir: "ltr", aliases: [] },
        "es": { label: "Español", dir: "ltr", aliases: [] },
        "fa": { label: "فارسی", dir: "rtl", aliases: [] },
        "fi": { label: "Suomi", dir: "ltr", aliases: [] },
        "fil": { label: "Filipino", dir: "ltr", aliases: [] },
        "fr": { label: "Français", dir: "ltr", aliases: [] },
        "ga": { label: "Gaeilge", dir: "ltr", aliases: [] },
        "he": { label: "עִבְרִית", dir: "rtl", aliases: [] },
        "hi": { label: "हिंदी", dir: "ltr", aliases: [] },
        "hu": { label: "Magyar", dir: "ltr", aliases: [] },
        "it": { label: "Italiano", dir: "ltr", aliases: [] },
        "ja": { label: "日本語", dir: "ltr", aliases: [] },
        "ka": { label: "ქართული ენა", dir: "ltr", aliases: [] },
        "ko": { label: "한국어", dir: "ltr", aliases: [] },
        "lo": { label: "ພາສາລາວ", dir: "ltr", aliases: [] },
        "lt": { label: "Lietuvių", dir: "ltr", aliases: [] },
        "lv": { label: "Latviešu", dir: "ltr", aliases: [] },
        "mr": { label: "मराठी", dir: "ltr", aliases: [] },
        "ms": { label: "Bahasa Melayu", dir: "ltr", aliases: [] },
        "nb_NO": { label: "Norsk", dir: "ltr", aliases: ["no"] },
        "nl": { label: "Nederlands", dir: "ltr", aliases: [] },
        "pl": { label: "Polski", dir: "ltr", aliases: [] },
        "pt": { label: "Português", dir: "ltr", aliases: [] },
        "pt_BR": { label: "Português do Brasil", dir: "ltr", aliases: ["pt-br"] },
        "ro": { label: "Română", dir: "ltr", aliases: [] },
        "ru": { label: "Русский", dir: "ltr", aliases: [] },
        "sk": { label: "Slovenčina", dir: "ltr", aliases: [] },
        "sv": { label: "Svenska", dir: "ltr", aliases: [] },
        "ta": { label: "தமிழ்", dir: "ltr", aliases: [] },
        "tr": { label: "Türkçe", dir: "ltr", aliases: [] },
        "uk": { label: "Українська", dir: "ltr", aliases: [] },
        "vi": { label: "Tiếng Việt", dir: "ltr", aliases: [] },
        "yua": { label: "Maaya t'aan", dir: "ltr", aliases: [] },
        "zh_Hans": { label: "简体中文", dir: "ltr", aliases: ["zh-cn"] },
        "zh_Hant": { label: "正體中文", dir: "ltr", aliases: ["zh-tw"] }
    };

    let translations = {};

    function canonicalLanguage(value) {
        if (!value)
            return null;

        const input = String(value).trim();

        if (languages[input])
            return input;

        const normalized = input
            .replace(/_/g, '-')
            .toLowerCase();

        for (const [code, info] of Object.entries(languages)) {
            if (
                code.replace(/_/g, '-').toLowerCase() === normalized ||
                info.aliases.some(alias => alias.toLowerCase() === normalized)
            )
                return code;
        }

        return null;
    }

    function storedLanguage() {
        try {
            return canonicalLanguage(
                localStorage.getItem('hotelwifi.language')
            );
        }
        catch (error) {
            return null;
        }
    }

    function browserLanguage() { for (const value of navigator.languages ?? [navigator.language]) { const normalized = String(value).replace(/_/g, "-").toLowerCase(); if (normalized === "zh-hk" || normalized === "zh-mo") return "zh_Hant"; if (normalized === "zh" || normalized === "zh-sg") return "zh_Hans"; const language = canonicalLanguage(value) ?? canonicalLanguage(normalized.split("-")[0]); if (language) return language; } return "en"; }
    function interpolate(text, values) {
        if (!values)
            return text;

        return text.replace(
            /\{([^}]+)\}/g,
            (match, name) =>
                values[name] !== undefined
                    ? String(values[name])
                    : match
        );
    }

    window.t = function(key, values) {
        const value = translations[key] ?? key;
        return interpolate(value, values);
    };

    function populateLanguageSelect() {
        const select = document.getElementById('languageSelect');

        if (!select)
            return;

        select.replaceChildren();

        for (const [code, info] of Object.entries(languages)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = info.label;
            select.appendChild(option);
        }
    }

    function applyTranslations(root) {
        root.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = window.t(element.dataset.i18n);
        });

        root.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = window.t(element.dataset.i18nTitle);
        });

        root.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            element.setAttribute(
                'aria-label',
                window.t(element.dataset.i18nAriaLabel)
            );
        });

        document.title = window.t('app.title');
    }

    async function fetchCatalogue(language) {
        const response = await fetch(
            `i18n/${language}.json?v=0.1.0-r1`,
            { cache: 'no-store' }
        );

        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);

        return response.json();
    }

    async function loadLanguage(language) {
        const canonical = canonicalLanguage(language) ?? 'en';
        const base = await fetchCatalogue('en');
        const selected = canonical === 'en'
            ? {}
            : await fetchCatalogue(canonical);

        translations = { ...base, ...selected };

        document.documentElement.lang = canonical.replace('_', '-');
        document.documentElement.dir = languages[canonical].dir;

        const select = document.getElementById('languageSelect');
        if (select)
            select.value = canonical;

        applyTranslations(document);

        window.dispatchEvent(
            new CustomEvent('hotelwifi-language-changed', {
                detail: { language: canonical }
            })
        );
    }

    window.setHotelWifiLanguage = async function(language) {
        const canonical = canonicalLanguage(language);

        if (!canonical)
            return;

        try {
            localStorage.setItem('hotelwifi.language', canonical);
        }
        catch (error) {
        }

        await loadLanguage(canonical);
    };

    async function init() {
        populateLanguageSelect();

        const language = storedLanguage() ?? browserLanguage();

        try {
            await loadLanguage(language);
        }
        catch (error) {
            await loadLanguage('en');
        }

        const select = document.getElementById('languageSelect');
        if (select) {
            select.addEventListener('change', () => {
                window.setHotelWifiLanguage(select.value);
            });
        }
    }

    window.i18nReady = init();
})();
