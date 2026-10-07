import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Space } from "../models/Space";
import { Library } from "../models/Library";
import { fetchSpace } from "../services/spaceService";
import { fetchLibraries } from "../services/libraryService";
import { TagType, getTagStyle, baseTagStyle } from '../styles/tags';
import { WebViewModal } from '../components/WebViewModal';
import { useState, useEffect } from 'react';
import React from "react";
import { colors } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SpaceDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [space, setSpace] = useState<Space | undefined>();
  const [library, setLibrary] = useState<Library | undefined>();
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [isHelpViewVisible, setIsHelpViewVisible] = useState(false);

  useEffect(() => {
    Promise.all([fetchSpace(Number(id)), fetchLibraries()])
      .then(([spaceData, libraries]) => {
        setSpace(spaceData);
        setLibrary(spaceData?.libraryId === undefined ? undefined : libraries.get(spaceData.libraryId));
      })
      .catch(error => console.error('Error loading space:', error));
  }, [id]);

  if (!space) return null;

  const handleCheckAvailability = () => {
    setIsWebViewVisible(true);
  };

  const handleGetHelp = () => {
    setIsHelpViewVisible(true);
  };

  const sections: { title: string; type: TagType; values: string[] }[] = [
    { title: 'Space Type', type: 'spaceType', values: space.spaceTypes },
    { title: 'Features', type: 'amenity', values: space.accessible ? [...space.amenities, 'Accessible'] : space.amenities },
    { title: 'Sound Level', type: 'soundLevel', values: space.soundLevels },
    { title: 'Good For', type: 'activity', values: space.activities },
    { title: 'Facilities', type: 'amenity', values: space.support },
    { title: 'Available For', type: 'audience', values: space.audiences },
  ];

  const handleGetDirections = () => {
    if (library?.mapUrl) {
      Linking.openURL(library.mapUrl);
      return;
    }
    const destination = encodeURIComponent(`${library?.name ?? space.title}, Cornell University, Ithaca, NY`);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={space.imageUrl ? { uri: space.imageUrl } : require('../../assets/images/placeholder.avif')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.title}>{space.title}</Text>
              {library && <Text style={styles.location}>{library.name}</Text>}
            </View>
            <TouchableOpacity 
              style={[styles.directionsButton]}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={24} color={colors.info} />
            </TouchableOpacity>
          </View>

          {library && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              {library.address && <Text style={styles.description}>{library.address}</Text>}
              {library.hoursUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(library.hoursUrl!)}>
                  <Text style={styles.link}>Library hours</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {sections.map(({ title, type, values }) => values.length > 0 && (
            <View key={title} style={styles.section}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.tags}>
                {values.map(value => (
                  <Text key={value} style={[styles.tag, getTagStyle(type)]}>
                    {value}
                  </Text>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation</Text>
            <View style={styles.tags}>
              <Text style={[styles.tag, getTagStyle('reservationType')]}>
                {space.reservationType}
              </Text>
            </View>
            {space.reservationType === 'Reservable' && (
              <TouchableOpacity 
                style={[styles.availabilityButton, { backgroundColor: colors.primary }]}
                onPress={handleCheckAvailability}
              >
                <Text style={styles.availabilityButtonText}>Book Now</Text>
              </TouchableOpacity>
            )}
            {space.reservationType === 'By request' && (
              <TouchableOpacity 
                style={[styles.availabilityButton]}
                onPress={handleGetHelp}
              >
                <Text style={styles.availabilityButtonText}>Contact Cornell Library</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      <WebViewModal
        visible={isWebViewVisible}
        url={space.url}
        onClose={() => setIsWebViewVisible(false)}
      />
      <WebViewModal
        visible={isHelpViewVisible}
        url="https://library.cornell.edu/get-help/ask/"
        onClose={() => setIsHelpViewVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    width: 100,
    resizeMode: 'contain',
  },
  content: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  link: {
    fontSize: 16,
    color: colors.info,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    ...baseTagStyle,
  },
  reservationType: {
    fontSize: 16,
    color: '#333',
  },
  availabilityButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  availabilityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  directionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.infoLight,
  },
}); 