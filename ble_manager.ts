import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
type VoidCallback = (result: boolean) => void;

const bleManager = new BleManager();
interface BluetoothLowEnergyApi {
    requestPermissions(callback: VoidCallback): Promise<void>;
    scanForDevices(): void;
    connectToDevice(device: Device): Promise<void>;
    disconnectFromDevice(device: Device): void;
    isScanning: boolean;
    connectedDevice: Device | null;
    scanningError: string | null;
    connectingError: BleError | null;
    BLTManager: BleManager;
    allDevices: Device[];
    deviceValue: any;
    deviceName: string;
}
export default function useBLE(): BluetoothLowEnergyApi {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [deviceValue, setdeviceValue] = useState(0);
    const [deviceName, setdeviceName] = useState('');
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [scanningError, setScanningError] = useState<string | null>(null);
    const [connectingError, setConnectedError] = useState<BleError | null>(null);
    const [isScanning, setIsScanning] = useState(false);


    //request permission
    const requestPermissions = async (cb: VoidCallback) => {
        if (Platform.OS === 'android') {
            const apiLevel = await DeviceInfo.getApiLevel();

            if (apiLevel < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'Bluetooth Low Energy requires Location',
                        buttonNeutral: 'Ask Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                cb(granted === PermissionsAndroid.RESULTS.GRANTED);
            } else {
                const result = await requestMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ]);

                const isGranted =
                    result['android.permission.BLUETOOTH_CONNECT'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] ===
                    PermissionsAndroid.RESULTS.GRANTED;

                cb(isGranted);
            }
        } else {
            cb(true);
        }
    };

    //check duplicate devices
    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex(device => nextDevice.id === device.id) > -1;

    const scanForDevices = async () => {
        setIsScanning(true);
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log('Error in scanning devices:', error);
                setScanningError(error.message);
                setIsScanning(false);
                return;
            }
            if (device) {
                console.log(
                    'Device serviceUUIDs:',
                    device.discoverAllServicesAndCharacteristics(),
                );
                setAllDevices(prevState => {
                    if (!isDuplicateDevice(prevState, device)) {
                        return [...prevState, device];
                    }
                    return prevState;
                });
                bleManager.stopDeviceScan();
                setIsScanning(false);
            }
        });
    };


    //connect to Device
    const connectToDevice = async (device: Device) => {
        console.log('Connecting to:', device.id, device.name);
        //check
        setdeviceName(device.name ?? '');
        try {
            await bleManager.connectToDevice(device.id);
            console.log(`Device ${device.id} connected successfully!`);
            setConnectedDevice(device);
            const discoverAllServicesAndCharacteristics =
                await device.discoverAllServicesAndCharacteristics();
            const deviceServices = await bleManager.servicesForDevice(device.id);
            for (const service of deviceServices) {
                const characteristics = await bleManager.characteristicsForDevice(
                    device.id,
                    service.uuid,
                );
                for (const characteristic of characteristics) {
                    console.log('Characteristic Value for', characteristic.uuid);
                    enableCharacteristicIndication(characteristic);
                }
            }
            setConnectedError(null);
            listenToDeviceDisconnection(device);
        } catch (error: any) {
            setConnectedError(error);
            console.log('error at connectToDevice', error);
        }
    };


    const listenToDeviceDisconnection = (device: Device) => {
        bleManager.onDeviceDisconnected(device.id, (error, device) => {
            if (error) {
                console.log("error at onDeviceDisconnected ", error);
            }
            else {
                setConnectedDevice(null);
                console.log("device onDeviceDisconnected", device);
            }
        })
    }

    //disconnecting device
    const disconnectFromDevice = (device: Device) => {
        if (connectedDevice) {
            try {
                bleManager.cancelDeviceConnection(device.id);
                setConnectedDevice(null);
                console.log('Device disconnected successfully.');
            } catch (error) {
                console.log('Error disconnecting from device:', error);
            }
        } else {
            console.warn('No connected device to disconnect.');
        }
    };

    //decoding data
    const base64ToBinary = (base64String: string) => {
        const base64Chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let binaryString = "";
        let padding = 0;
        for (let i = 0; i < base64String.length; i++) {
            if (base64String[i] === "=") {
                padding++;
                continue;
            }

            const charIndex = base64Chars.indexOf(base64String[i]);
            const binaryRepresentation = charIndex.toString(2).padStart(6, "0");
            binaryString += binaryRepresentation;
        }
        binaryString = binaryString.slice(0, -padding * 2);
        const binaryData = new Uint8Array(binaryString.length / 8);
        for (let i = 0; i < binaryData.length; i++) {
            binaryData[i] = parseInt(
                binaryString.slice(i * 8, (i + 1) * 8),
                2
            );
        }

        return binaryData;
    };

    //reading data
    const enableCharacteristicIndication = async (
        characteristic: Characteristic,
    ) => {
        if (!characteristic) {
            console.log('No characteristic selected');
            return;
        }
        try {
            bleManager.monitorCharacteristicForDevice(
                characteristic.deviceID,
                characteristic.serviceUUID,
                characteristic.uuid,
                (error, characteristic) => {
                    if (error) {
                        console.log('Error at receiving data from device', error);
                        return;
                    } else {
                        //check
                        const base64ToBinaryd = base64ToBinary(characteristic?.value ?? " ");
                        const bytes = base64ToBinaryd;
                        const value = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
                        setdeviceValue(value);
                    }
                },
            );
        } catch (error) {
            console.log('Enable indication error:', error);
        }
    };

    return {
        requestPermissions,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
        allDevices,
        deviceValue,
        scanningError,
        connectedDevice,
        deviceName,
        isScanning,
        connectingError,
        BLTManager: bleManager
    };
}
