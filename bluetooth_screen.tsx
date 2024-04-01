import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Modal, StyleSheet } from 'react-native';
import useBLE from './ble_manager';
const BluetoothScreen = () => {
    const [visible, setVisible] = useState(false);
    const { requestPermissions, scanForDevices, allDevices } = useBLE();

    const scanForPeripherals = () => {
        requestPermissions(isGranted => {
            console.log('isGranted--> ', isGranted);
            if (isGranted) {
                scanForDevices();
            }
        });
    };

    const closeSheet = () => {
        setVisible(false);
    };

    const openSheet = () => {
        scanForPeripherals();
        setVisible(true);
        console.log(allDevices);
    };

    return (
        <SafeAreaView>
            <Text style={{ paddingLeft: 20 }}>Bluetooth Devices</Text>
            <TouchableOpacity onPress={() => openSheet()} style={{ height: 20, margin: 20 }}>
                <Text>Open Sheet</Text>
            </TouchableOpacity>
            <Modal
                transparent={true}
                visible={visible}
                onRequestClose={() => closeSheet()}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.bottomSheet}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => closeSheet()}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                        <View>
                            {
                                allDevices.map((device, index) => (
                                    <View key={index} >
                                        <Text>{device.id} {device.name} {device.localName}</Text>
                                    </View>
                                ))
                            }
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '60%'
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
});

export default BluetoothScreen;
