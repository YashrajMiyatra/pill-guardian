import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pill, Droplet, Wind, CircleDot } from 'lucide-react-native';
import { MedicationForm } from '../types';

interface PillIconProps {
  form: MedicationForm;
  color: string;
  size?: number;
}

export const PillIcon: React.FC<PillIconProps> = ({ form, color, size = 44 }) => {
  const iconSize = Math.round(size * 0.55);

  const renderIcon = () => {
    switch (form) {
      case 'drops':
      case 'liquid':
        return <Droplet size={iconSize} color="#FFFFFF" strokeWidth={2.4} />;
      case 'inhaler':
        return <Wind size={iconSize} color="#FFFFFF" strokeWidth={2.4} />;
      case 'injection':
        return <CircleDot size={iconSize} color="#FFFFFF" strokeWidth={2.4} />;
      case 'capsule':
      case 'tablet':
      case 'pill':
      default:
        return <Pill size={iconSize} color="#FFFFFF" strokeWidth={2.4} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || '#0284C7',
        },
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
