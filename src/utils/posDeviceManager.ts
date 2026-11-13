import { supabase } from '../lib/supabaseClient';
import { parseAppSettings, saveAppSettings } from './appSettingsUtils';

export interface PosDevice {
    id: string;
    device_id: string;
    branch_name: string;
    device_name?: string;
    status: 'pending' | 'approved' | 'rejected' | 'blocked';
    requested_at: string;
    approved_at?: string;
}

export const posDeviceManager = {
    /**
     * Get all POS devices from app_settings
     */
    async getDevices(): Promise<PosDevice[]> {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('*')
                .eq('id', 1)
                .maybeSingle();

            if (!data) return [];
            const parsed = parseAppSettings(data);
            return (parsed.authorized_pos_devices || []) as PosDevice[];
        } catch (e) {
            console.error('[posDeviceManager] getDevices error:', e);
            return [];
        }
    },

    /**
     * Get status of a specific device
     */
    async getDeviceStatus(deviceId: string): Promise<PosDevice | null> {
        const devices = await this.getDevices();
        return devices.find(d => d.device_id === deviceId) || null;
    },

    /**
     * Submit an authorization request from a cashier tablet
     */
    async requestAuthorization(
        deviceId: string,
        branchName: string,
        deviceName: string = 'تابلت الكاشير'
    ): Promise<{ success: boolean; device: PosDevice }> {
        const devices = await this.getDevices();
        const existingIdx = devices.findIndex(d => d.device_id === deviceId);

        let device: PosDevice;

        if (existingIdx >= 0) {
            // If already approved, keep approved
            if (devices[existingIdx].status === 'approved') {
                return { success: true, device: devices[existingIdx] };
            }

            // Update existing with new request
            device = {
                ...devices[existingIdx],
                branch_name: branchName,
                device_name: deviceName,
                status: 'pending',
                requested_at: new Date().toISOString()
            };
            devices[existingIdx] = device;
        } else {
            // Create new pending entry
            device = {
                id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                device_id: deviceId,
                branch_name: branchName,
                device_name: deviceName,
                status: 'pending',
                requested_at: new Date().toISOString()
            };
            devices.push(device);
        }

        await saveAppSettings({ authorized_pos_devices: devices });
        return { success: true, device };
    },

    /**
     * Admin action: Approve device
     */
    async approveDevice(deviceId: string): Promise<boolean> {
        const devices = await this.getDevices();
        const idx = devices.findIndex(d => d.device_id === deviceId);
        if (idx === -1) return false;

        devices[idx] = {
            ...devices[idx],
            status: 'approved',
            approved_at: new Date().toISOString()
        };

        await saveAppSettings({ authorized_pos_devices: devices });
        return true;
    },

    /**
     * Admin action: Reject pending device request
     */
    async rejectDevice(deviceId: string): Promise<boolean> {
        const devices = await this.getDevices();
        const updated = devices.filter(d => d.device_id !== deviceId);
        await saveAppSettings({ authorized_pos_devices: updated });
        return true;
    },

    /**
     * Admin action: Block or revoke device
     */
    async revokeDevice(deviceId: string): Promise<boolean> {
        const devices = await this.getDevices();
        const idx = devices.findIndex(d => d.device_id === deviceId);
        if (idx === -1) return false;

        devices[idx] = {
            ...devices[idx],
            status: 'blocked'
        };

        await saveAppSettings({ authorized_pos_devices: devices });
        return true;
    },

    /**
     * Admin action: Manually add and pre-approve a device
     */
    async addManualApprovedDevice(
        deviceId: string,
        branchName: string,
        deviceName: string = 'تابلت معتمد'
    ): Promise<boolean> {
        const devices = await this.getDevices();
        const existingIdx = devices.findIndex(d => d.device_id === deviceId);

        const newEntry: PosDevice = {
            id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            device_id: deviceId.trim(),
            branch_name: branchName,
            device_name: deviceName,
            status: 'approved',
            requested_at: new Date().toISOString(),
            approved_at: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            devices[existingIdx] = newEntry;
        } else {
            devices.push(newEntry);
        }

        await saveAppSettings({ authorized_pos_devices: devices });
        return true;
    }
};
