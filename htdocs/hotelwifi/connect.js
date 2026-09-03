'use strict';

let selectedNetwork = null;

const connectDialog = document.createElement('div');

connectDialog.id = 'connectDialog';
connectDialog.className = 'dialog-backdrop';
connectDialog.hidden = true;

connectDialog.innerHTML = `
    <div class="dialog-card">
        <h2 id="connectTitle" data-i18n="connect.title"></h2>

        <div id="connectBand" class="dialog-detail"></div>
        <div id="connectSecurity" class="dialog-detail"></div>

        <div id="passwordRow">
            <label for="networkPassword" data-i18n="connect.password"></label>
            <input
                id="networkPassword"
                type="password"
                autocomplete="new-password"
                enterkeyhint="go"
            >
        </div>

        <div id="connectMessage" class="dialog-message"></div>

        <div class="dialog-buttons">
            <button id="cancelConnectButton" class="secondary" data-i18n="common.cancel">
            </button>

            <button id="connectButton" class="primary" data-i18n="connect.button">
            </button>
        </div>
    </div>
`;

document.body.appendChild(connectDialog);

const connectTitle = document.getElementById('connectTitle');
const connectBand = document.getElementById('connectBand');
const connectSecurity = document.getElementById('connectSecurity');
const passwordRow = document.getElementById('passwordRow');
const networkPassword = document.getElementById('networkPassword');
const connectMessage = document.getElementById('connectMessage');
const connectButton = document.getElementById('connectButton');
const cancelConnectButton = document.getElementById('cancelConnectButton');

function networkType(network) {
    if (
        network.encryption === 'none' ||
        network.encryption === 'owe'
    ) {
        return 'passwordless';
    }

    if (
        network.encryption.includes('psk') ||
        network.encryption.includes('sae')
    ) {
        return 'personal';
    }

    return 'unsupported';
}

function openNetwork(network) {
    selectedNetwork = network;

    connectTitle.textContent = network.ssid;
    connectBand.textContent =
        `${network.band} · ${network.strength}%`;

    connectSecurity.textContent =
        network.encryptionLabel;

    connectMessage.textContent = '';
    networkPassword.value = '';

    const type = networkType(network);

    passwordRow.hidden = type !== 'personal';

    if (type === 'unsupported') {
        connectMessage.textContent =
            t('connect.unsupported');
        connectButton.hidden = true;
    }
    else {
        connectButton.hidden = false;
    }

    connectDialog.hidden = false;

    if (type === 'personal') {
        setTimeout(() => {
            networkPassword.focus();
        }, 50);
    }
}

function closeConnectDialog() {
    selectedNetwork = null;
    networkPassword.value = '';
    connectMessage.textContent = '';
    connectDialog.hidden = true;
}

async function connectSelectedNetwork() {
    if (!selectedNetwork) {
        return;
    }

    const type = networkType(selectedNetwork);

    if (type === 'unsupported') {
        return;
    }

    connectButton.disabled = true;
    cancelConnectButton.disabled = true;
    connectMessage.textContent = t('connect.connecting');

    try {
        const result = await rpcCall(
            'hotelwifi',
            'connect',
            {
                radio: selectedNetwork.radio,
                bssid: selectedNetwork.bssid,
                password:
                    type === 'personal'
                        ? networkPassword.value
                        : ''
            }
        );

        if (!result?.ok) {
            if (result?.error === 'invalid_password') {
                connectMessage.textContent =
                    t('connect.invalidPassword');
            }
            else if (result?.error === 'duplicate') {
                connectMessage.textContent =
                    t('connect.duplicate');
            }
            else if (result?.error === 'scan_not_ready') {
                connectMessage.textContent =
                    t('connect.scanRequired');
            }
            else {
                connectMessage.textContent =
                    t('connect.addError', { error: result?.error ?? 'unknown' });
            }

            return;
        }

        await refreshUplinks();
        connectMessage.textContent =
            t('connect.success');

        setTimeout(async () => {
            await refreshStatus();
        }, 3000);

        setTimeout(() => {
            closeConnectDialog();
        }, 1800);
    }
    catch (error) {
        connectMessage.textContent =
            t('common.communicationError');
    }
    finally {
        connectButton.disabled = false;
        cancelConnectButton.disabled = false;
    }
}

connectButton.addEventListener(
    'click',
    connectSelectedNetwork
);

cancelConnectButton.addEventListener(
    'click',
    closeConnectDialog
);

networkPassword.addEventListener(
    'keydown',
    event => {
        if (event.key === 'Enter') {
            connectSelectedNetwork();
        }
    }
);

connectDialog.addEventListener(
    'click',
    event => {
        if (event.target === connectDialog) {
            closeConnectDialog();
        }
    }
);
