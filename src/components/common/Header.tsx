import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../styles/colors';
interface HeaderProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  const [isNotificationModalVisible, setNotificationModalVisible] = React.useState(false);

  const toggleNotificationModal = () => {
    setNotificationModalVisible(prev => !prev);
  };
  return (
    <View style={styles.header}>
      {leftIcon ? (
        <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
          {leftIcon}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={toggleNotificationModal} style={styles.iconButton}>
        <Ionicons name="notifications" size={24} color="red" />
      </TouchableOpacity>
      <Modal
        visible={isNotificationModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={toggleNotificationModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 8, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Notifications</Text>
              <TouchableOpacity onPress={toggleNotificationModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {/* Add notification content here */}
          </View> 
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    marginTop: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.titleColor,
  },
  iconButton: {
    padding: 8,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
  },
});
