import { ScrollView, Text, View, Image, TouchableOpacity, SafeAreaView, useWindowDimensions, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from "react-native";
import { useState, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSpaces } from './services/spaceService';
import { fetchLibraries } from './services/libraryService';
import { SearchBar } from "./components/SearchBar";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { TagType, getTagStyle } from './styles/tags';
import { FilterBar } from "./components/FilterBar";
import { colors, spacing } from './styles/theme';
import { layoutStyles } from './styles/components/layout';
import { headerStyles } from './styles/components/header';
import { cardStyles, createCardStyles } from './styles/components/card';
import { typographyStyles } from './styles/components/typography';
import { Space, FacetSelection, SORTS, SortKey, matchesFacets, libraryOf } from './models/Space';
import { LibraryIndex } from './models/Library';

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT_SEARCHES = 5;

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<FacetSelection>({});
  const [sortKey] = useState<SortKey>('title');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [libraries, setLibraries] = useState<LibraryIndex>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  
  const gridCardSize = (windowWidth - spacing.md * 3) / 2;
  const listImageSize = Math.min(windowWidth * 0.3, 120);

  useEffect(() => {
    loadRecentSearches();
    loadData();
  }, []);

  const loadData = async ({ refresh = false } = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const [spaceData, libraryData] = await Promise.all([
        fetchSpaces({ refresh }),
        fetchLibraries({ refresh }),
      ]);
      setSpaces(spaceData);
      setLibraries(libraryData);
    } catch (err) {
      setError('Failed to load library spaces');
      console.error('Error loading spaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (search: string) => {
    if (!search.trim()) return;
    
    try {
      const newSearches = [
        search,
        ...recentSearches.filter(s => s !== search)
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(newSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSubmitSearch = (text: string) => {
    if (text.trim()) {
      saveRecentSearch(text);
    }
  };

  const handleSelectRecent = (search: string) => {
    setSearchQuery(search);
    saveRecentSearch(search);
  };

  const handleClearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handlePressSpace = (id: number) => {
    router.push(`/space/${id}`);
  };

  const handleChangeFilter = (facet: TagType, value: string | undefined) => {
    setSelectedFilters(prev => ({ ...prev, [facet]: value }));
  };

  const filteredSpaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return spaces
      .filter((space) => {
        const searchable = [
          space.title,
          libraryOf(space, libraries)?.name,
          ...space.spaceTypes,
          ...space.soundLevels,
          ...space.activities,
          ...space.amenities,
        ];
        const matchesSearch = !query || searchable.some(text => text?.toLowerCase().includes(query));
        return matchesSearch && matchesFacets(space, selectedFilters, libraries);
      })
      .sort((a, b) => SORTS[sortKey].compare(a, b, libraries));
  }, [searchQuery, selectedFilters, sortKey, spaces, libraries]);

  const dynamicStyles = createCardStyles(gridCardSize, listImageSize);

  if (isLoading) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={[layoutStyles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typographyStyles.title, { marginTop: spacing.sm }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={[layoutStyles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[typographyStyles.title, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity 
            style={[headerStyles.viewToggle, { marginTop: spacing.md }]}
            onPress={() => loadData({ refresh: true })}
          >
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={layoutStyles.safeArea}>
        <View style={layoutStyles.mainContainer}>
          <View style={headerStyles.headerContainer}>
            <Text style={headerStyles.headerTitle}>Booked</Text>
            <View style={headerStyles.header}>
              <SearchBar 
                value={searchQuery}
                onChangeText={handleSearch}
                onSubmit={handleSubmitSearch}
                recentSearches={recentSearches}
                onSelectRecent={handleSelectRecent}
                onClearRecent={handleClearRecent}
              />
              <TouchableOpacity 
                style={headerStyles.viewToggle}
                onPress={() => setIsGridView(!isGridView)}
              >
                <Ionicons 
                  name={isGridView ? "list" : "grid"}
                  size={24} 
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
            <FilterBar
              selection={selectedFilters}
              onChange={handleChangeFilter}
              onClearAll={() => setSelectedFilters({})}
              spaces={spaces}
              libraries={libraries}
            />
          </View>

          <ScrollView style={layoutStyles.scrollContent}>
            <View style={[layoutStyles.container, isGridView ? layoutStyles.grid : layoutStyles.list]}>
              {filteredSpaces.map((space) => (
                <TouchableOpacity 
                  key={space.id}
                  onPress={() => handlePressSpace(space.id)}
                >
                  <View 
                    style={[
                      cardStyles.card,
                      isGridView ? dynamicStyles.gridCard : cardStyles.listCard
                    ]}
                  >
                    <View style={isGridView ? null : dynamicStyles.listImageContainer}>
                      <Image
                        source={space.imageUrl ? { uri: space.imageUrl } : require('../assets/images/placeholder.avif')}
                        style={
                          isGridView ? dynamicStyles.gridImage : dynamicStyles.listImage
                        }
                        resizeMode="cover"
                      />
                    </View>
                    <View style={cardStyles.cardContent}>
                      <Text style={typographyStyles.title}>{space.title}</Text>
                      {libraryOf(space, libraries) && (
                        <Text style={typographyStyles.location}>{libraryOf(space, libraries)?.name}</Text>
                      )}
                      <View style={layoutStyles.tags}>
                        {space.spaceTypes.map(type => (
                          <Text key={type} style={[layoutStyles.tag, getTagStyle('spaceType')]}>
                            {type}
                          </Text>
                        ))}
                        <Text style={[layoutStyles.tag, getTagStyle('reservationType')]}>
                          {space.reservationType}
                        </Text>
                        {space.soundLevels[0] && (
                          <Text style={[layoutStyles.tag, getTagStyle('soundLevel')]}>
                            {space.soundLevels[0]}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
