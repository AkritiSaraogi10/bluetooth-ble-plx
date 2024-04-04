import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    connectedDeviceInfo: {
        marginTop: 20,
    },
    container: {
        padding: 20,
        backgroundColor: 'white'
    },
    deviceList: {
        marginTop: 20,
    },
    deviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    error: {
        color: 'red',
        marginTop: 10,
    },
    bottomSheetContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        borderRadius: 10
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },
    closeIcon: {
        fontSize: 20,
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    bottomSheetContent: {
        backgroundColor: '#fff',
        padding: 20,
        height: '60%',
    },
    textstyle: {
        color: 'blue',
        fontSize: 16
    }
});
