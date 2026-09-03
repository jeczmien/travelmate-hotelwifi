'use strict';

const ZERO_SESSION = '00000000000000000000000000000000';

let sessionId = ZERO_SESSION;
let requestId = 1;
let statusTimer = null;

const loginPanel = document.getElementById('loginPanel');
const appPanel = document.getElementById('appPanel');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const scanButton = document.getElementById('scanButton');
const scanInfo = document.getElementById('scanInfo');
const networkList = document.getElementById('networkList');

async function rpcCall(object, method, params = {}, sid = sessionId) {
    const response = await fetch('/ubus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId++,
            method: 'call',
            params: [
                sid,
                object,
                method,
                params
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const message = await response.json();

    if (
        !Array.isArray(message.result) ||
        message.result.length < 1
    ) {
        throw new Error('Invalid RPC response');
    }

    const code = message.result[0];

    if (code !== 0) {
        throw new Error(`ubus error ${code}`);
    }

    return message.result.length > 1
        ? message.result[1]
        : null;
}

async function login() {
    loginButton.disabled = true;
    loginError.textContent = '';

    try {
        const result = await rpcCall(
            'session',
            'login',
            {
                username: 'hotelwifi',
                password: passwordInput.value,
                timeout: 3600
            },
            ZERO_SESSION
        );

        if (!result?.ubus_rpc_session) {
            throw new Error('Login failed');
        }

        sessionId = result.ubus_rpc_session;

        passwordInput.value = '';
        loginPanel.hidden = true;
        appPanel.hidden = false;

        await refreshStatus();
        await refreshUplinks();

        statusTimer = setInterval(refreshStatus, 10000);
    }
    catch (error) {
        loginError.textContent = t('login.error');
    }
    finally {
        loginButton.disabled = false;
    }
}

function setStatus(elementId, value) {
    const element = document.getElementById(elementId);

    element.classList.remove('ok', 'bad', 'unknown');

    if (value === true) {
        element.textContent = t('status.ok');
        element.classList.add('ok');
    }
    else if (value === false) {
        element.textContent = t('status.no');
        element.classList.add('bad');
    }
    else {
        element.textContent = '...';
        element.classList.add('unknown');
    }
}

async function refreshStatus() {
    try {
        const result = await rpcCall(
            'hotelwifi',
            'status'
        );

        setStatus(
            'wifiStatus',
            result?.wifiConnected
        );

        setStatus(
            'vpnStatus',
            result?.vpnConnected
        );

        setStatus(
            'internetStatus',
            result?.internetOk
        );
    }
    catch (error) {
        setStatus('wifiStatus', null);
        setStatus('vpnStatus', null);
        setStatus('internetStatus', null);
    }
}

function prepareNetworks(networks) {
    const strongest = new Map();

    for (const network of networks ?? []) {
        if (
            network.hidden ||
            !network.ssid ||
            network.ssid === 'hidden'
        ) {
            continue;
        }

        const rememberedUplinks = window.rememberedUplinks ?? [];

        if (rememberedUplinks.some(uplink =>
            uplink.radio === network.radio &&
            uplink.ssid === network.ssid
        )) {
            continue;
        }

        const key = `${network.radio}\u0000${network.ssid}`;
        const previous = strongest.get(key);

        if (
            !previous ||
            network.strength > previous.strength
        ) {
            strongest.set(key, network);
        }
    }

    return Array.from(strongest.values())
        .sort((a, b) => {
            if (a.radio !== b.radio) {
                return a.radio === 'radio1' ? -1 : 1;
            }

            if (a.strength !== b.strength) {
                return b.strength - a.strength;
            }

            return a.ssid.localeCompare(b.ssid);
        });
}

function renderNetworks(networks) {
    networkList.replaceChildren();

    const prepared = prepareNetworks(networks);

    if (prepared.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'card empty';
        empty.textContent = t('scan.empty');
        networkList.appendChild(empty);
        return;
    }

    for (const network of prepared) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'network';

        const main = document.createElement('div');
        main.className = 'network-main';

        const ssid = document.createElement('strong');
        ssid.textContent = network.ssid;

        const band = document.createElement('span');
        band.textContent = network.band;

        const strength = document.createElement('span');
        strength.textContent = `${network.strength}%`;

        main.append(ssid, band, strength);

        const security = document.createElement('div');
        security.className = 'network-security';
        security.textContent = network.encryptionLabel;

        item.append(main, security);
        item.addEventListener('click', () => openNetwork(network));

        networkList.appendChild(item);
    }
}

async function scanNetworks() {
    scanButton.disabled = true;
    networkList.replaceChildren();
    scanInfo.textContent = t('scan.scanning');

    try {
        await rpcCall(
            'hotelwifi',
            'scanStart'
        );

        const deadline = Date.now() + 40000;

        while (Date.now() < deadline) {
            await new Promise(resolve => {
                setTimeout(resolve, 1000);
            });

            const state = await rpcCall(
                'hotelwifi',
                'scanStatus'
            );

            if (state?.status === 'done') {
                const result = await rpcCall(
                    'hotelwifi',
                    'scanResults'
                );

                renderNetworks(result?.networks);
                scanInfo.textContent = '';
                return;
            }

            if (
                state?.status &&
                state.status !== 'running'
            ) {
                throw new Error(state.status);
            }
        }

        throw new Error('scan_timeout');
    }
    catch (error) {
        scanInfo.textContent = t('scan.error');
    }
    finally {
        scanButton.disabled = false;
    }
}

loginButton.addEventListener('click', login);

passwordInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        login();
    }
});

scanButton.addEventListener('click', scanNetworks);
