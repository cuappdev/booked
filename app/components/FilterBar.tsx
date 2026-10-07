import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useState, useRef, useCallback, useMemo } from 'react';
import { TagType, getTagStyle } from '../styles/tags';
import { Ionicons } from '@expo/vector-icons';
import { FilterDropdown } from './FilterDropdown';
import { colors } from '../styles/theme';
import { filterStyles as styles } from '../styles/components/filter';
import { Space, FacetSelection, FACETS, FACET_KEYS, facetOptions } from '../models/Space';
import { LibraryIndex } from '../models/Library';

interface FilterBarProps {
  selection: FacetSelection;
  onChange: (facet: TagType, value: string | undefined) => void;
  onClearAll: () => void;
  spaces: Space[];
  libraries: LibraryIndex;
}

export function FilterBar({ selection, onChange, onClearAll, spaces, libraries }: FilterBarProps) {
  const [openCategory, setOpenCategory] = useState<TagType | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const filterRefs = useRef<{ [key: string]: View | null }>({});

  const categories = useMemo(
    () =>
      FACET_KEYS.map((type) => ({ type, label: FACETS[type].label, values: facetOptions(spaces, type, libraries) }))
        .filter((category) => category.values.length > 0),
    [spaces, libraries]
  );

  const handleCategoryPress = useCallback((category: TagType) => {
    const filterRef = filterRefs.current[category];
    if (filterRef) {
      filterRef.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({ 
          x: pageX, 
          y: y + 1.5*height
        });
        setOpenCategory(openCategory === category ? null : category);
      });
    }
  }, [openCategory]);

  const handleBackgroundPress = () => {
    if (openCategory) {
      setOpenCategory(null);
    }
  };

  const handleSelectOption = (value: string, type: TagType) => {
    onChange(type, value || undefined);
    setOpenCategory(null);
  };

  const selectedCategory = openCategory ? categories.find(cat => cat.type === openCategory) : null;
  const hasSelection = Object.values(selection).some(Boolean);

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {categories.map((category) => {
          const selectedValue = selection[category.type];

          const tagStyle = getTagStyle(category.type);

          return (
            <View 
              key={category.type} 
              ref={ref => filterRefs.current[category.type] = ref}
              style={styles.filterContainer}
            >
              <TouchableOpacity
                onPress={() => handleCategoryPress(category.type)}
                style={styles.filterButton}
              >
                <Text
                  style={[
                    styles.filterText,
                    tagStyle,
                    selectedValue && {
                      backgroundColor: tagStyle.color,
                      color: 'white'
                    }
                  ]}
                >
                  {selectedValue || `All ${category.label}`}
                  <Ionicons 
                    name={openCategory === category.type ? "chevron-up" : "chevron-down"} 
                    size={12} 
                    color={selectedValue ? "white" : tagStyle.color}
                    style={styles.icon}
                  />
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
      {hasSelection && (
        <TouchableOpacity
          onPress={onClearAll}
          style={styles.clearButton}
        >
          <Ionicons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      )}
      {selectedCategory && (
        <View style={styles.dropdownContainer}>
          <FilterDropdown
            visible={true}
            position={dropdownPosition}
            category={selectedCategory}
            selectedValue={selection[selectedCategory.type]}
            onSelect={(value) => handleSelectOption(value, selectedCategory.type)}
            onClose={() => setOpenCategory(null)}
          />
        </View>
      )}
    </View>
  );
} 