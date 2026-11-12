/**
 * Security Guard & Anti-Tamper Shield
 * مطعم جمر التنور - نظام الحماية ومكافحة فحص الأكواد والتلاعب
 */

// Simple robust hash function (SHA-256 via Web Crypto API with sync fallback)
const SECRET_SALT = 'JT_SECURITY_SALT_2026_x89a_PROTECTED';

async function sha256(message: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            // fallback
        }
    }
    // Simple deterministic hash fallback
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(36);
}

// ─── Secure Session Storage ──────────────────────────────────────────────────
export interface SecureSession {
    scope: 'cashier' | 'admin';
    identifier: string; // branch name or 'admin'
    expiresAt: number;
    token: string;
}

export const secureAuth = {
    async createSession(scope: 'cashier' | 'admin', identifier: string, durationHours = 12): Promise<void> {
        const expiresAt = Date.now() + (durationHours * 60 * 60 * 1000);
        const raw = `${scope}:${identifier}:${expiresAt}:${SECRET_SALT}`;
        const token = await sha256(raw);
        const session: SecureSession = { scope, identifier, expiresAt, token };
        localStorage.setItem(`jamr_${scope}_secure_session`, JSON.stringify(session));
        // Remove legacy insecure keys
        localStorage.removeItem(`jamr_${scope}_auth`);
    },

    async verifySession(scope: 'cashier' | 'admin'): Promise<{ isValid: boolean; identifier?: string }> {
        try {
            const raw = localStorage.getItem(`jamr_${scope}_secure_session`);
            if (!raw) return { isValid: false };
            const session: SecureSession = JSON.parse(raw);

            // Check expiry
            if (!session.expiresAt || Date.now() > session.expiresAt) {
                this.clearSession(scope);
                return { isValid: false };
            }

            // Verify signature
            const expectedToken = await sha256(`${session.scope}:${session.identifier}:${session.expiresAt}:${SECRET_SALT}`);
            if (session.token !== expectedToken) {
                // Tampering detected!
                this.clearSession(scope);
                return { isValid: false };
            }

            return { isValid: true, identifier: session.identifier };
        } catch (e) {
            return { isValid: false };
        }
    },

    clearSession(scope: 'cashier' | 'admin'): void {
        localStorage.removeItem(`jamr_${scope}_secure_session`);
        localStorage.removeItem(`jamr_${scope}_auth`);
        if (scope === 'cashier') {
            localStorage.removeItem('jamr_cashier_branch');
        }
    }
};

// ─── Anti-DevTools & Anti-Debugging Protection ───────────────────────────────
let isProtectionInitialized = false;

export function initSecurityGuard() {
    if (typeof window === 'undefined' || isProtectionInitialized) return;
    isProtectionInitialized = true;

    // 1. Block Context Menu (Right Click) across the whole app
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { capture: true });

    // 2. Block DevTools Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + I (Inspect)
        // Ctrl + Shift + J (Console)
        // Ctrl + Shift + C (Element Inspector)
        // Ctrl + Shift + K (Firefox Console)
        // Ctrl + U (View Source)
        // Ctrl + S (Save Page)
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const key = e.key ? e.key.toLowerCase() : '';

        if (isCtrlOrMeta) {
            if (isShift && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            if (key === 'u' || key === 's') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, { capture: true });

    // 3. Silence and Sanitize Console
    // Overwrite console methods so curious users cannot view internal payloads or run arbitrary helpers
    try {
        const dummy = () => {};
        // Keep console.error silenced or minimized
        window.console.log = dummy;
        window.console.info = dummy;
        window.console.debug = dummy;
        window.console.warn = dummy;
        window.console.table = dummy;
        window.console.dir = dummy;
    } catch (e) {
        // Ignore in restricted environments
    }

    // 4. Infinite Debugger Trap (Anti-DevTools Loop)
    // When someone opens developer tools or presses an in-app console button `[ >_ ]`,
    // this immediately pauses and locks up their devtools session.
    const startAntiDebuggerTrap = () => {
        setInterval(() => {
            const start = performance.now();
            try {
                // Dynamically evaluate debugger statement to prevent build-time stripping
                const trap = new Function('debugger');
                trap();
            } catch (err) {
                // ignored
            }
            const end = performance.now();
            // If the execution took noticeable time (meaning devtools paused execution),
            // trigger an alert or reload
            if (end - start > 150) {
                try {
                    sessionStorage.setItem('jamr_security_warning', 'true');
                } catch (e) {}
            }
        }, 1000);
    };

    // Run trap in production / live deployment
    try {
        startAntiDebuggerTrap();
    } catch (e) {}

    // 5. Prevent Drag & Drop tampering of critical UI
    window.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });
}

// ─── Device Authorization System (نظام قفل واعتماد أجهزة الكاشير) ─────────────
export const deviceSecurity = {
    getDeviceId(): string {
        let deviceId = localStorage.getItem('jt_pos_device_id');
        if (!deviceId) {
            const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
            deviceId = `JT-POS-${randomPart}`;
            localStorage.setItem('jt_pos_device_id', deviceId);
        }
        return deviceId;
    },

    async isDeviceAuthorized(): Promise<boolean> {
        try {
            const token = localStorage.getItem('jt_pos_device_token');
            if (!token) return false;
            const deviceId = this.getDeviceId();
            const expected = await sha256(`AUTHORIZED_POS_DEVICE:${deviceId}:${SECRET_SALT}`);
            return token === expected;
        } catch {
            return false;
        }
    },

    async authorizeDevice(): Promise<void> {
        const deviceId = this.getDeviceId();
        const token = await sha256(`AUTHORIZED_POS_DEVICE:${deviceId}:${SECRET_SALT}`);
        localStorage.setItem('jt_pos_device_token', token);
    },

    revokeDevice(): void {
        localStorage.removeItem('jt_pos_device_token');
        secureAuth.clearSession('cashier');
    }
};
