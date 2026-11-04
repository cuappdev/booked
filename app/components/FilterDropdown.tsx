import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { TagType, getTagStyle } from '../styles/tags';
import { colors } from '../styles/theme';
import { filterDropdownStyles as styles } from '../styles/components/filter';

interface FilterDropdownProps {
  visible: boolean;
  position: { x: number; y: number };
  category: { type: TagType; label: string; values: string[] };
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function FilterDropdown({ 
  visible, 
  position, 
  category, 
  selectedValue, 
  onSelect,
  onClose 
}: FilterDropdownProps) {
  if (!visible) return null;

  const tagStyle = getTagStyle(category.type);

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View 
        style={[
          styles.dropdown,
          {
            top: position.y,
            left: position.x,
            borderColor: tagStyle.color
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            <TouchableOpacity
              style={[
                styles.item,
                !selectedValue && {
                  backgroundColor: tagStyle.backgroundColor
                }
              ]}
              onPress={() => onSelect('')}
            >
              <Text
                style={[
                  styles.text,
                  { color: tagStyle.color }
                ]}
              >
                All {category.label}
              </Text>
            </TouchableOpacity>
            {category.values.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.item,
                  selectedValue === value && {
                    backgroundColor: tagStyle.backgroundColor
                  }
                ]}
                onPress={() => onSelect(value)}
              >
                <Text
                  style={[
                    styles.text,
                    { color: tagStyle.color }
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </>
  );
}
