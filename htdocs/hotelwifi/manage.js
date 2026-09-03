'use strict';

const uplinkList =
    document.getElementById('uplinkList');

window.rememberedUplinks = [];

let selectedUplink = null;

const uplinkDialog =
    document.createElement('div');

uplinkDialog.id = 'uplinkDialog';
uplinkDialog.className = 'dialog-backdrop';
uplinkDialog.hidden = true;

uplinkDialog.innerHTML = `
    <div class="dialog-card">
        <h2 id="uplinkDialogTitle" data-i18n="password.title"></h2>

        <div
            id="uplinkDialogBand"
            class="dialog-detail"
        ></div>

        <label for="uplinkPassword"> data-i18n="password.new">
        </label>

        <input
            id="uplinkPassword"
            type="text"
            autocomplete="off"
            enterkeyhint="go"
        >

        <div
            id="uplinkDialogMessage"
            class="dialog-message"
        ></div>

        <div class="dialog-buttons">
            <button
                id="uplinkCancelButton"
                class="secondary"
            >
            </button>

            <button
                id="uplinkSaveButton"
                class="primary"
            >
            </button>
        </div>
    </div>
`;

document.body.appendChild(uplinkDialog);

const uplinkDialogTitle =
    document.getElementById(
        'uplinkDialogTitle'
    );

const uplinkDialogBand =
    document.getElementById(
        'uplinkDialogBand'
    );

const uplinkPassword =
    document.getElementById(
        'uplinkPassword'
    );

const uplinkDialogMessage =
    document.getElementById(
        'uplinkDialogMessage'
    );

const uplinkCancelButton =
    document.getElementById(
        'uplinkCancelButton'
    );

const uplinkSaveButton =
    document.getElementById(
        'uplinkSaveButton'
    );


function encryptionLabel(encryption) {
    const labels = {
        'none': t('security.open'),
        'owe': 'WPA3 OWE',
        'sae': 'WPA3 PSK',
        'sae-mixed': 'WPA2/WPA3 PSK',
        'psk2+ccmp': 'WPA2 PSK',
        'psk2+tkip': 'WPA2 PSK (TKIP)',
        'psk+ccmp': 'WPA PSK',
        'psk+tkip': 'WPA PSK (TKIP)',
        'psk-mixed+ccmp': 'WPA/WPA2 PSK',
        'psk-mixed+tkip':
            'WPA/WPA2 PSK (TKIP)'
    };

    return labels[encryption] ?? encryption;
}


function hasPassword(uplink) {
    return (
        uplink.encryption?.includes('psk') ||
        uplink.encryption?.includes('sae')
    );
}


function orderedUplinks(uplinks) {
    const result = [];

    for (const uplink of uplinks) {
        if (uplink.radio === 'radio1')
            result.push(uplink);
    }

    for (const uplink of uplinks) {
        if (uplink.radio === 'radio0')
            result.push(uplink);
    }

    for (const uplink of uplinks) {
        if (
            uplink.radio !== 'radio1' &&
            uplink.radio !== 'radio0'
        )
            result.push(uplink);
    }

    return result;
}


async function refreshUplinks() {
    try {
        const result = await rpcCall(
            'hotelwifi',
            'list'
        );

        window.rememberedUplinks =
            result?.uplinks ?? [];

        renderUplinks(
            orderedUplinks(
                window.rememberedUplinks
            )
        );
    }
    catch (error) {
        uplinkList.replaceChildren();

        const message =
            document.createElement('div');

        message.className = 'uplink-empty';

        message.textContent =
            t('uplinks.loadError');

        uplinkList.appendChild(message);
    }
}


function getRadioPosition(
    uplinks,
    uplink
) {
    const sameRadio =
        uplinks.filter(
            item =>
                item.radio === uplink.radio
        );

    return {
        index: sameRadio.findIndex(
            item => item.id === uplink.id
        ),
        count: sameRadio.length
    };
}


function renderUplinks(uplinks) {
    uplinkList.replaceChildren();

    if (!uplinks.length) {
        const empty =
            document.createElement('div');

        empty.className = 'uplink-empty';

        empty.textContent =
            t('uplinks.empty');

        uplinkList.appendChild(empty);
        return;
    }

    for (const uplink of uplinks) {
        const item =
            document.createElement('div');

        item.className = 'uplink-item';

        const header =
            document.createElement('div');

        header.className = 'uplink-header';

        const ssid =
            document.createElement('strong');

        ssid.textContent = uplink.ssid;

        const band =
            document.createElement('span');

        band.className = 'uplink-band';
        band.textContent = uplink.band;

        header.append(ssid, band);

        const meta =
            document.createElement('div');

        meta.className = 'uplink-meta';

        const security =
            document.createElement('span');

        security.textContent =
            encryptionLabel(
                uplink.encryption
            );

        const enabled =
            document.createElement('span');

        enabled.className =
            uplink.enabled
                ? 'uplink-enabled'
                : 'uplink-disabled';

        enabled.textContent =
            uplink.enabled
                ? t('uplink.enabled')
                : t('uplink.disabled');

        meta.append(security, enabled);

        const buttons =
            document.createElement('div');

        buttons.className =
            'uplink-buttons';

        const position =
            getRadioPosition(
                uplinks,
                uplink
            );

        const upButton =
            document.createElement('button');

        upButton.type = 'button';
        upButton.className =
            'small-button priority-button';

        upButton.textContent = '↑';
        upButton.title =
            t('uplink.priorityUp');

        upButton.disabled =
            position.index <= 0;

        upButton.addEventListener(
            'click',
            () => moveUplink(
                uplink,
                'up'
            )
        );

        const downButton =
            document.createElement('button');

        downButton.type = 'button';
        downButton.className =
            'small-button priority-button';

        downButton.textContent = '↓';
        downButton.title =
            t('uplink.priorityDown');

        downButton.disabled =
            position.index < 0 ||
            position.index >=
                position.count - 1;

        downButton.addEventListener(
            'click',
            () => moveUplink(
                uplink,
                'down'
            )
        );

        buttons.append(
            upButton,
            downButton
        );

        const toggleButton =
            document.createElement('button');

        toggleButton.type = 'button';
        toggleButton.className =
            'small-button';

        toggleButton.textContent =
            uplink.enabled
                ? t('uplink.disable')
                : t('uplink.enable');

        toggleButton.addEventListener(
            'click',
            () => toggleUplink(uplink)
        );

        buttons.appendChild(
            toggleButton
        );

        if (hasPassword(uplink)) {
            const passwordButton =
                document.createElement(
                    'button'
                );

            passwordButton.type =
                'button';

            passwordButton.className =
                'small-button';

            passwordButton.textContent =
                t('uplink.password');

            passwordButton.addEventListener(
                'click',
                () =>
                    openPasswordDialog(
                        uplink
                    )
            );

            buttons.appendChild(
                passwordButton
            );
        }

        const removeButton =
            document.createElement('button');

        removeButton.type = 'button';

        removeButton.className =
            'small-button danger-button';

        removeButton.textContent =
            t('uplink.remove');

        removeButton.addEventListener(
            'click',
            () => removeUplink(uplink)
        );

        buttons.appendChild(
            removeButton
        );

        item.append(
            header,
            meta,
            buttons
        );

        uplinkList.appendChild(item);
    }
}


async function moveUplink(
    uplink,
    direction
) {
    try {
        const result = await rpcCall(
            'hotelwifi',
            'move',
            {
                id: uplink.id,
                direction
            }
        );

        if (!result?.ok) {
            alert(
                t('uplink.priorityError', { error: result?.error ?? 'unknown' })
            );

            return;
        }

        await refreshUplinks();
    }
    catch (error) {
        alert(
            t('common.communicationError')
        );
    }
}


async function toggleUplink(uplink) {
    const action =
        uplink.enabled
            ? 'disable'
            : 'enable';

    try {
        const result = await rpcCall(
            'hotelwifi',
            'update',
            {
                id: uplink.id,
                action,
                password: ''
            }
        );

        if (!result?.ok) {
            alert(
                t('uplink.stateError', { error: result?.error ?? 'unknown' })
            );

            return;
        }

        await refreshUplinks();

        setTimeout(
            refreshStatus,
            1500
        );
    }
    catch (error) {
        alert(
            t('common.communicationError')
        );
    }
}


function openPasswordDialog(uplink) {
    selectedUplink = uplink;

    uplinkDialogTitle.textContent =
        uplink.ssid;

    uplinkDialogBand.textContent =
        `${uplink.band} · ${encryptionLabel(uplink.encryption)}`;

    uplinkPassword.value = '';

    uplinkDialogMessage.textContent =
        '';

    uplinkDialog.hidden = false;

    setTimeout(() => {
        uplinkPassword.focus();
    }, 50);
}


function closePasswordDialog() {
    selectedUplink = null;
    uplinkPassword.value = '';

    uplinkDialogMessage.textContent =
        '';

    uplinkDialog.hidden = true;
}


async function saveUplinkPassword() {
    if (!selectedUplink)
        return;

    uplinkSaveButton.disabled = true;
    uplinkCancelButton.disabled = true;

    uplinkDialogMessage.textContent =
        t('password.saving');

    try {
        const result = await rpcCall(
            'hotelwifi',
            'update',
            {
                id: selectedUplink.id,
                action: 'password',
                password:
                    uplinkPassword.value
            }
        );

        if (!result?.ok) {
            if (
                result?.error ===
                'invalid_password'
            ) {
                uplinkDialogMessage.textContent =
                    t('password.invalid');
            }
            else {
                uplinkDialogMessage.textContent =
                    t('password.saveError', { error: result?.error ?? 'unknown' });
            }

            return;
        }

        uplinkDialogMessage.textContent =
            t('password.saved');

        setTimeout(
            closePasswordDialog,
            700
        );

        setTimeout(
            refreshStatus,
            1500
        );
    }
    catch (error) {
        uplinkDialogMessage.textContent =
            t('common.communicationError');
    }
    finally {
        uplinkSaveButton.disabled =
            false;

        uplinkCancelButton.disabled =
            false;
    }
}


async function removeUplink(uplink) {
    const confirmed = confirm(
        t('uplink.removeConfirm', { ssid: uplink.ssid, band: uplink.band })
    );

    if (!confirmed)
        return;

    try {
        const result = await rpcCall(
            'hotelwifi',
            'remove',
            {
                id: uplink.id
            }
        );

        if (!result?.ok) {
            alert(
                t('uplink.removeError', { error: result?.error ?? 'unknown' })
            );

            return;
        }

        await refreshUplinks();

        setTimeout(
            refreshStatus,
            1500
        );
    }
    catch (error) {
        alert(
            t('common.communicationError')
        );
    }
}


uplinkSaveButton.addEventListener(
    'click',
    saveUplinkPassword
);

uplinkCancelButton.addEventListener(
    'click',
    closePasswordDialog
);

uplinkPassword.addEventListener(
    'keydown',
    event => {
        if (event.key === 'Enter')
            saveUplinkPassword();
    }
);

uplinkDialog.addEventListener(
    'click',
    event => {
        if (event.target === uplinkDialog)
            closePasswordDialog();
    }
);

/* hotelwifi-active-uplink */

const refreshUplinksWithoutActiveMarker =
    refreshUplinks;

refreshUplinks = async function() {
    await refreshUplinksWithoutActiveMarker();

    let status;

    try {
        status = await rpcCall(
            'hotelwifi',
            'status'
        );
    }
    catch (error) {
        return;
    }

    if (
        !status?.wifiConnected ||
        !status?.stationId
    )
        return;

    const uplinks = orderedUplinks(
        window.rememberedUplinks ?? []
    );

    const items =
        uplinkList.querySelectorAll(
            '.uplink-item'
        );

    for (
        let i = 0;
        i < uplinks.length;
        i++
    ) {
        const uplink = uplinks[i];

        const prefix =
            `${uplink.radio}/${uplink.ssid}/`;

        if (
            !status.stationId.startsWith(
                prefix
            )
        )
            continue;

        const state =
            items[i]?.querySelector(
                '.uplink-enabled, .uplink-disabled'
            );

        if (!state)
            continue;

        if (uplink.enabled) {
            state.className =
                'uplink-enabled';

            state.textContent =
                t('uplink.connectedEnabled');
        }
        else {
            state.className =
                'uplink-disabled';

            state.textContent =
                t('uplink.connectedDisabled');
        }
    }
};

/* hotelwifi-language-change */
window.addEventListener(
    'hotelwifi-language-changed',
    () => {
        const appPanel =
            document.getElementById(
                'appPanel'
            );

        if (
            appPanel &&
            !appPanel.hidden
        )
            refreshUplinks();
    }
);
