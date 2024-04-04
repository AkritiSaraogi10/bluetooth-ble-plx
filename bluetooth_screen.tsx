import React, { useEffect } from 'react';
import { Button, Text, View, TouchableOpacity, Alert, ToastAndroid } from 'react-native';
import { Device } from 'react-native-ble-plx';
import useBLE from './ble_manager';
import { Strings } from './constants/app_strings';
import { styles } from './constants/app_styles';

const BluetoothScreen = () => {
    const { requestPermissions,
        scanForDevices,
        connectToDevice,
        disconnectFromDevice,
        allDevices,
        connectedDevice,
        scanningError,
        isScanning,
        deviceName,
        deviceValue,
        connectingError,
        BLTManager } = useBLE();

    useEffect(() => {
        const subscription = BLTManager.onStateChange((state) => {
            if (state === 'PoweredOff') {
                Alert.alert(
                    Strings.PERMISSION_ALERT_TITLE,
                    Strings.PERMISSION_ALERT_MESSAGE,
                    [
                        {
                            text: Strings.PERMISSION_DENIED_TEXT,
                            onPress: () => console.log('Cancel Pressed'),
                            style: 'cancel',
                        },
                        {
                            text: Strings.TURN_ON_TEXT,
                            onPress: () => {
                                BLTManager.enable();
                            }
                        },
                    ]
                );
                subscription.remove();
            }
        }, true);

        if (scanningError) {
            ToastAndroid.showWithGravity(
                scanningError,
                ToastAndroid.LONG,
                ToastAndroid.CENTER,
            );
        }
        if (connectingError) {
            console.log("connectingError ", connectingError.reason);
            ToastAndroid.showWithGravity(
                connectingError.message,
                2,
                ToastAndroid.CENTER,
            );
        }

        return () => {
            subscription.remove();
        };
    }, [BLTManager, scanningError, connectingError]);

    const scanForPeripherals = () => {
        requestPermissions(isGranted => {
            if (isGranted) {
                scanForDevices();
            }
        });
    };

    const handleConnect = (device: Device) => {
        if (connectedDevice && connectedDevice.id !== device.id) {
            disconnectFromDevice(connectedDevice);
            connectToDevice(device);
        } else if (connectedDevice && connectedDevice.id === device.id) {
            disconnectFromDevice(device);
        } else {
            connectToDevice(device);
        }
    };

    return (
        <View style={styles.container}>
            {/* {!allDevices.length && (
                <Button title={isScanning ? Strings.SCANNING_TEXT : Strings.SCAN_TEXT} onPress={scanForPeripherals} disabled={isScanning} />
            )} */}
            <Button title={isScanning ? Strings.SCANNING_TEXT : Strings.SCAN_TEXT} onPress={scanForPeripherals} disabled={isScanning} />
            <View style={styles.deviceList}>
                {allDevices.map(device => (
                    <View key={device.id} style={styles.deviceItem}>
                        <TouchableOpacity
                        >
                            {/* <Text style={styles.textstyle}>{Strings.DEVICE_ID_TEXT}{device.id}</Text> */}
                            <Text style={styles.textstyle}>{Strings.DEVICE_NAME_TEXT} {device.name}</Text>
                        </TouchableOpacity>
                        <Button
                            title={connectedDevice && connectedDevice.id === device.id ? Strings.DISCONNECT_TEXT : Strings.CONNECT_TEXT}
                            onPress={() => handleConnect(device)}
                        />
                    </View>
                ))}
            </View>
            {connectedDevice && (
                <View style={styles.connectedDeviceInfo}>
                    {/* <Text style={styles.textstyle}>{Strings.DEVICE_ID_TEXT} {connectedDevice.id}</Text> */}
                    <Text style={styles.textstyle}>{Strings.DEVICE_NAME_TEXT} {deviceName}</Text>
                    <Text style={styles.textstyle}>{Strings.DEVICE_VALUE_TEXT} {deviceValue}</Text>
                </View>
            )}
        </View>
    );
};

export default BluetoothScreen;
