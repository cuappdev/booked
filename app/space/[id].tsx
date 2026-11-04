import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Space, libraryOf } from "../models/Space";
import { Library, LibraryIndex } from "../models/Library";
import { fetchSpace, fetchLibraries } from "../services/api";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [isHelpViewVisible, setIsHelpViewVisible] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Libraries only add optional details, so a failure shouldn't hide the space.
    Promise.all([fetchSpace(id), fetchLibraries().catch((): LibraryIndex => new Map())])
      .then(([spaceData, libraries]) => {
        setSpace(spaceData);
        setLibrary(spaceData ? libraryOf(spaceData, libraries) : undefined);
      })
      .catch(error => console.error('Error loading space:', error))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!space) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.description}>Couldn't load this space.</Text>
      </View>
    );
  }

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
            {space.reservationType === 'Reservable' && space.sourceUrl && (
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
      {space.sourceUrl && (
        <WebViewModal
          visible={isWebViewVisible}
          url={space.sourceUrl}
          onClose={() => setIsWebViewVisible(false)}
        />
      )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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